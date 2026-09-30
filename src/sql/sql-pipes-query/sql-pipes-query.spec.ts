/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { SqlQueryBase } from '../..';
import {
  SqlAggregatePipeOperator,
  SqlColumn,
  SqlExpression,
  SqlFromQuery,
  SqlLimitClause,
  SqlLimitPipeOperator,
  SqlOffsetClause,
  SqlOrderByClause,
  SqlOrderByExpression,
  SqlPipesQuery,
  SqlQuery,
  SqlTable,
  SqlWherePipeOperator,
} from '../..';
import { backAndForth } from '../../test-utils';
import { sane } from '../../utils';

function parsePipes(sql: string): SqlPipesQuery {
  const parsed = SqlExpression.parse(sql);
  if (!(parsed instanceof SqlPipesQuery)) throw new Error(`${sql} is not a pipes query`);
  return parsed;
}

describe('SqlPipesQuery', () => {
  describe('parses', () => {
    it.each([
      `FROM t |> WHERE x`,
      `FROM t|>WHERE x`,
      `FROM t\n|> WHERE x\n|> SELECT a, b`,
      `FROM t |> WHERE x |> LIMIT 5`,
      `FROM t\n  -- a comment\n  |> WHERE x\n  /* another */ |> DROP y`,
      `SELECT * FROM t |> WHERE x`,
      `SELECT a, COUNT(*) AS c FROM t GROUP BY 1 ORDER BY 2 DESC LIMIT 10 |> WHERE c > 1`,
      `TABLE t |> WHERE x`,
      `VALUES (1), (2) |> WHERE EXPR/bin/zsh > 1`,
      `(FROM t |> WHERE x)`,
      `EXPLAIN PLAN FOR FROM t |> WHERE x`,
      `INSERT INTO u FROM t |> WHERE x PARTITIONED BY DAY`,
      `REPLACE INTO u OVERWRITE ALL FROM t |> AGGREGATE COUNT(*) GROUP BY a PARTITIONED BY ALL CLUSTERED BY a`,
      `FROM t |> WHERE x UNION ALL FROM u`,
      sane`
        SET x = 1;
        FROM t
        |> WHERE x
      `,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlPipesQuery);
    });

    describe('as a sub query', () => {
      it.each([
        `SELECT * FROM (FROM t |> WHERE x) AS s`,
        `SELECT * FROM t WHERE a IN (FROM u |> SELECT a)`,
      ])('does back and forth with %s', sql => {
        backAndForth(sql, SqlQuery);
      });
    });

    it('keeps the ORDER BY and LIMIT of the root query on the root query', () => {
      const query = parsePipes(`SELECT * FROM t ORDER BY a LIMIT 5 |> WHERE x`);

      expect(query.query).toBeInstanceOf(SqlQuery);
      expect(query.query.toString()).toEqual(`SELECT * FROM t ORDER BY a LIMIT 5`);
      expect(query.limitClause).toBeUndefined();
    });

    it('puts the ingest and union clauses on the pipes query', () => {
      const query = parsePipes(
        `INSERT INTO u FROM t |> WHERE x PARTITIONED BY DAY CLUSTERED BY a UNION ALL FROM v`,
      );

      expect(query.query.toString()).toEqual(`FROM t`);
      expect(String(query.insertClause)).toEqual(`INSERT INTO u`);
      expect(String(query.partitionedByClause)).toEqual(`PARTITIONED BY DAY`);
      expect(String(query.clusteredByClause)).toEqual(`CLUSTERED BY a`);
      expect(String(query.unionQuery)).toEqual(`FROM v`);
    });

    it('works with a spike detection query', () => {
      const sql = sane`
        FROM store
        |> WHERE channel = '#en'
        -- The schedule fires on 5-minute boundaries, so the window is exactly one bucket.
        |> EXTEND
        LOWER(site_name) AS site,
        client_ip AS visitor,
        TIME_FLOOR(__time, 'PT5M') AS bucket_start
        -- Visitors per site in each 5-minute bucket of the last 7 days.
        |> AGGREGATE COUNT(DISTINCT visitor) AS visitors GROUP BY site, bucket_start
        -- Buckets with no visitors don't appear, so they aren't part of the baseline.
        |> AGGREGATE
        SUM(visitors) FILTER (WHERE bucket_start >= TIMESTAMP '2026-01-01') AS current_visitors,
        AVG(visitors) FILTER (WHERE bucket_start < TIMESTAMP '2026-01-01') AS avg_visitors_7d,
        STDDEV(visitors) FILTER (WHERE bucket_start < TIMESTAMP '2026-01-01') AS stddev_visitors_7d,
        COUNT(*) FILTER (WHERE bucket_start < TIMESTAMP '2026-01-01') AS baseline_buckets
        GROUP BY site
        |> EXTEND avg_visitors_7d + 3 * stddev_visitors_7d AS threshold
        |> WHERE current_visitors > threshold
        |> SET
        avg_visitors_7d = ROUND(avg_visitors_7d, 1),
        stddev_visitors_7d = ROUND(stddev_visitors_7d, 1),
        threshold = ROUND(threshold, 1)
      `;

      backAndForth(sql, SqlPipesQuery);

      const query = parsePipes(sql);
      expect(query.query).toBeInstanceOf(SqlFromQuery);
      expect(query.getPipeOperators().map(op => op.constructor.name)).toEqual([
        'SqlWherePipeOperator',
        'SqlExtendPipeOperator',
        'SqlAggregatePipeOperator',
        'SqlAggregatePipeOperator',
        'SqlExtendPipeOperator',
        'SqlWherePipeOperator',
        'SqlSetPipeOperator',
      ]);

      expect(query.prettify().toString()).toMatchInlineSnapshot(`
        "FROM store
        |> WHERE channel = '#en'
        |> EXTEND
          LOWER(site_name) AS site,
          client_ip AS visitor,
          TIME_FLOOR(__time, 'PT5M') AS bucket_start
        |> AGGREGATE COUNT(DISTINCT visitor) AS visitors GROUP BY site, bucket_start
        |> AGGREGATE
          SUM(visitors) FILTER (WHERE bucket_start >= TIMESTAMP '2026-01-01') AS current_visitors,
          AVG(visitors) FILTER (WHERE bucket_start < TIMESTAMP '2026-01-01') AS avg_visitors_7d,
          STDDEV(visitors) FILTER (WHERE bucket_start < TIMESTAMP '2026-01-01') AS stddev_visitors_7d,
          COUNT(*) FILTER (WHERE bucket_start < TIMESTAMP '2026-01-01') AS baseline_buckets
        GROUP BY site
        |> EXTEND avg_visitors_7d + 3 * stddev_visitors_7d AS threshold
        |> WHERE current_visitors > threshold
        |> SET
          avg_visitors_7d = ROUND(avg_visitors_7d, 1),
          stddev_visitors_7d = ROUND(stddev_visitors_7d, 1),
          threshold = ROUND(threshold, 1)"
      `);
    });

    it('works with a z-score query', () => {
      const sql = sane`
          FROM store
          |> WHERE kind = 'query_history'
          -- source_label says which account the row is from.
          -- The daily schedule makes windows start at midnight UTC, so days line up with the window.
          |> EXTEND
               source_label,
               user_name,
               CAST(bytes_written AS BIGINT) AS result_bytes,
               TIME_FLOOR(__time, 'P1D') AS day_start
          |> AGGREGATE SUM(result_bytes) AS day_bytes GROUP BY source_label, user_name, day_start
          |> AGGREGATE
               SUM(day_bytes) FILTER (WHERE day_start >= TIMESTAMP '2026-01-01') AS daily_bytes,
               AVG(day_bytes) FILTER (WHERE day_start < TIMESTAMP '2026-01-01') AS mean_bytes,
               STDDEV(day_bytes) FILTER (WHERE day_start < TIMESTAMP '2026-01-01') AS stddev_bytes
             GROUP BY source_label, user_name
          |> WHERE stddev_bytes > 0
          |> EXTEND (daily_bytes - mean_bytes) / stddev_bytes AS zscore
          |> WHERE zscore > 3 AND daily_bytes > 1000000
          |> SET zscore = ROUND(zscore, 1), mean_bytes = ROUND(mean_bytes), stddev_bytes = ROUND(stddev_bytes)
      `;

      backAndForth(sql, SqlPipesQuery);
      expect(parsePipes(sql).getPipeOperators()).toHaveLength(8);
    });

    it('parses to the expected tree', () => {
      expect(SqlExpression.parse(`FROM t\n|> WHERE x |> LIMIT 1`)).toMatchInlineSnapshot(`
        SqlPipesQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "explain": undefined,
          "insertClause": undefined,
          "keywords": Object {},
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "pipeOperators": SeparatedArray {
            "separators": Array [
              " ",
            ],
            "values": Array [
              SqlWherePipeOperator {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {
                  "postPipe": " ",
                },
                "type": "wherePipeOperator",
                "whereClause": SqlWhereClause {
                  "expression": SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "x",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                  "keywords": Object {
                    "where": "WHERE",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postWhere": " ",
                  },
                  "type": "whereClause",
                },
              },
              SqlLimitPipeOperator {
                "keywords": Object {},
                "limitClause": SqlLimitClause {
                  "keywords": Object {
                    "limit": "LIMIT",
                  },
                  "limit": SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postLimit": " ",
                  },
                  "type": "limitClause",
                },
                "offsetClause": undefined,
                "parens": undefined,
                "spacing": Object {
                  "postPipe": " ",
                },
                "type": "limitPipeOperator",
              },
            ],
          },
          "query": SqlFromQuery {
            "clusteredByClause": undefined,
            "contextStatements": undefined,
            "explain": undefined,
            "insertClause": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "limitClause": undefined,
            "offsetClause": undefined,
            "orderByClause": undefined,
            "parens": undefined,
            "partitionedByClause": undefined,
            "replaceClause": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "table": SqlTable {
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "refName": RefName {
                "name": "t",
                "quotes": false,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "fromQuery",
            "unionQuery": undefined,
          },
          "replaceClause": undefined,
          "spacing": Object {
            "prePipes": "
        ",
          },
          "type": "pipesQuery",
          "unionQuery": undefined,
        }
      `);
    });
  });

  describe('does not parse', () => {
    it.each([
      `FROM t |> WHERE x ORDER BY y`,
      `FROM t |> WHERE x LIMIT 1`,
      `FROM t PARTITIONED BY DAY |> WHERE x`,
      `FROM t |>`,
      `FROM t |> FOO x`,
      `FROM t |> AGGREGATE`,
      `FROM t |> LIMIT`,
      `|> WHERE x`,
    ])('rejects %s', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works', () => {
      expect(
        SqlPipesQuery.create(SqlFromQuery.create('t'), [
          SqlWherePipeOperator.create(SqlColumn.create('x')),
          SqlLimitPipeOperator.create(5),
        ]).toString(),
      ).toEqual(`FROM "t"\n|> WHERE "x"\n|> LIMIT 5`);
    });

    it('appends to an existing pipes query', () => {
      expect(
        SqlPipesQuery.create(parsePipes(`FROM t |> WHERE x`), [
          SqlLimitPipeOperator.create(5),
        ]).toString(),
      ).toEqual(`FROM t |> WHERE x\n|> LIMIT 5`);
    });
  });

  describe('#constructor', () => {
    it('throws when given suffix clauses', () => {
      expect(
        () =>
          new SqlPipesQuery({
            query: SqlFromQuery.create('t'),
            pipeOperators: parsePipes(`FROM t |> WHERE x`).pipeOperators,
            limitClause: SqlLimitClause.create(1),
          }),
      ).toThrow('a pipes query can not have ORDER BY, LIMIT or OFFSET clauses');
    });
  });

  describe('#changeQuery', () => {
    it('replaces the root query', () => {
      expect(
        parsePipes(`FROM t |> WHERE x`).changeQuery(SqlFromQuery.optionalQuotes('u')).toString(),
      ).toEqual(`FROM u |> WHERE x`);
    });
  });

  describe('#getPipeOperators', () => {
    it('gets the operators', () => {
      expect(parsePipes(`FROM t |> WHERE x |> LIMIT 1`).getPipeOperators().map(String)).toEqual([
        '|> WHERE x',
        '|> LIMIT 1',
      ]);
    });
  });

  describe('#getLastPipeOperator', () => {
    it('gets the last operator', () => {
      expect(String(parsePipes(`FROM t |> WHERE x |> LIMIT 1`).getLastPipeOperator())).toEqual(
        '|> LIMIT 1',
      );
    });
  });

  describe('#changePipeOperators', () => {
    it('replaces the operators', () => {
      expect(
        parsePipes(`FROM t |> WHERE x`)
          .changePipeOperators([SqlLimitPipeOperator.create(1)])
          .toString(),
      ).toEqual(`FROM t |> LIMIT 1`);
    });
  });

  describe('#insertPipeOperator', () => {
    it('inserts with the default spacing so comments are not duplicated', () => {
      expect(
        parsePipes(`FROM t\n-- one\n|> WHERE x\n-- two\n|> LIMIT 1`)
          .insertPipeOperator(1, SqlWherePipeOperator.create(SqlColumn.create('y')))
          .toString(),
      ).toEqual(`FROM t\n-- one\n|> WHERE x\n|> WHERE "y"\n-- two\n|> LIMIT 1`);
    });

    it('takes a negative index from the end', () => {
      expect(
        parsePipes(`FROM t |> WHERE x |> LIMIT 1`)
          .insertPipeOperator(-1, SqlWherePipeOperator.create(SqlColumn.create('y')))
          .toString(),
      ).toEqual(`FROM t |> WHERE x\n|> WHERE "y" |> LIMIT 1`);
    });
  });

  describe('#appendPipeOperator', () => {
    it('adds an operator at the end', () => {
      expect(
        parsePipes(`FROM t |> WHERE x`)
          .appendPipeOperator(SqlAggregatePipeOperator.create(undefined, [SqlColumn.create('a')]))
          .toString(),
      ).toEqual(`FROM t |> WHERE x\n|> AGGREGATE GROUP BY "a"`);
    });
  });

  describe('#removePipeOperator', () => {
    it('removes an operator', () => {
      expect(parsePipes(`FROM t |> WHERE x |> LIMIT 1`).removePipeOperator(0).toString()).toEqual(
        `FROM t |> LIMIT 1`,
      );
    });

    it('leaves the root query with the prefix and suffix when the last operator goes', () => {
      const query = parsePipes(`INSERT INTO u FROM t |> WHERE x PARTITIONED BY DAY`);
      const removed = query.removePipeOperator(0);

      expect(removed).toBeInstanceOf(SqlFromQuery);
      expect(removed.toString()).toEqual(`INSERT INTO u\nFROM t\nPARTITIONED BY DAY`);
    });
  });

  describe('#getOrderByClause', () => {
    it('finds a trailing ORDER BY', () => {
      expect(String(parsePipes(`FROM t |> ORDER BY a`).getOrderByClause())).toEqual(`ORDER BY a`);
    });

    it('finds an ORDER BY followed by a LIMIT', () => {
      expect(String(parsePipes(`FROM t |> ORDER BY a |> LIMIT 1`).getOrderByClause())).toEqual(
        `ORDER BY a`,
      );
    });

    it('ignores an ORDER BY that is not trailing', () => {
      expect(parsePipes(`FROM t |> ORDER BY a |> WHERE x`).getOrderByClause()).toBeUndefined();
    });
  });

  describe('#changeOrderByClause', () => {
    const orderByB = SqlOrderByClause.create(SqlOrderByExpression.create(SqlColumn.create('b')));

    it('replaces a trailing ORDER BY', () => {
      expect(parsePipes(`FROM t |> ORDER BY a`).changeOrderByClause(orderByB).toString()).toEqual(
        `FROM t |> ORDER BY "b"`,
      );
    });

    it('appends an ORDER BY', () => {
      expect(parsePipes(`FROM t |> WHERE x`).changeOrderByClause(orderByB).toString()).toEqual(
        `FROM t |> WHERE x\n|> ORDER BY "b"`,
      );
    });

    it('inserts an ORDER BY before a trailing LIMIT', () => {
      expect(parsePipes(`FROM t |> LIMIT 1`).changeOrderByClause(orderByB).toString()).toEqual(
        `FROM t |> ORDER BY "b"\n|> LIMIT 1`,
      );
    });

    it('removes a trailing ORDER BY', () => {
      expect(
        parsePipes(`FROM t |> WHERE x |> ORDER BY a |> LIMIT 1`)
          .changeOrderByClause(undefined)
          .toString(),
      ).toEqual(`FROM t |> WHERE x |> LIMIT 1`);
    });

    it('returns the same query when nothing changes', () => {
      const query = parsePipes(`FROM t |> WHERE x`);

      expect(query.changeOrderByClause(undefined)).toBe(query);
    });

    it('drives the inherited ORDER BY methods', () => {
      const query = parsePipes(`FROM t |> ORDER BY a |> LIMIT 1`);

      expect(query.hasOrderBy()).toEqual(true);
      expect(query.getOrderByExpressions().map(String)).toEqual(['a']);
      expect(
        query.addOrderBy(SqlOrderByExpression.create(SqlColumn.create('b'), 'DESC')).toString(),
      ).toEqual(`FROM t |> ORDER BY "b" DESC, a |> LIMIT 1`);
    });
  });

  describe('#getLimitClause', () => {
    it('finds a trailing LIMIT', () => {
      expect(String(parsePipes(`FROM t |> LIMIT 5`).getLimitClause())).toEqual(`LIMIT 5`);
      expect(parsePipes(`FROM t |> LIMIT 5 |> WHERE x`).getLimitClause()).toBeUndefined();
    });
  });

  describe('#changeLimitClause', () => {
    it('replaces a trailing LIMIT', () => {
      expect(
        parsePipes(`FROM t |> LIMIT 5`).changeLimitClause(SqlLimitClause.create(3)).toString(),
      ).toEqual(`FROM t |> LIMIT 3`);
    });

    it('removes a trailing LIMIT', () => {
      expect(
        parsePipes(`FROM t |> WHERE x |> LIMIT 5`).changeLimitClause(undefined).toString(),
      ).toEqual(`FROM t |> WHERE x`);
    });

    it('throws when removing a LIMIT that has an OFFSET', () => {
      expect(() => parsePipes(`FROM t |> LIMIT 5 OFFSET 1`).changeLimitClause(undefined)).toThrow(
        'can not remove the LIMIT from a |> LIMIT operator that has an OFFSET',
      );
    });

    it('drives the inherited LIMIT methods', () => {
      const query: SqlQueryBase = parsePipes(`FROM t |> WHERE x`);

      expect(query.hasLimit()).toEqual(false);
      const limited = query.changeLimitValue(100);
      expect(limited.toString()).toEqual(`FROM t |> WHERE x\n|> LIMIT 100`);
      expect(limited.getLimitValue()).toEqual(100);
      expect(limited.changeLimitValue(10).toString()).toEqual(`FROM t |> WHERE x\n|> LIMIT 10`);
      expect(limited.combineWithLimitClause(SqlLimitClause.create(5)).getLimitValue()).toEqual(5);
      expect(limited.changeLimitValue(undefined).toString()).toEqual(`FROM t |> WHERE x`);
    });

    it('turns back into the root query when the only operator is removed', () => {
      const query = parsePipes(`FROM t |> LIMIT 5`).changeLimitValue(undefined);

      expect(query).toBeInstanceOf(SqlFromQuery);
      expect(query.toString()).toEqual(`FROM t`);
    });
  });

  describe('#getOffsetClause', () => {
    it('finds the offset of a trailing LIMIT', () => {
      expect(String(parsePipes(`FROM t |> LIMIT 5 OFFSET 2`).getOffsetClause())).toEqual(
        `OFFSET 2`,
      );
      expect(parsePipes(`FROM t |> LIMIT 5`).getOffsetClause()).toBeUndefined();
    });
  });

  describe('#changeOffsetClause', () => {
    it('sets the offset of a trailing LIMIT', () => {
      expect(parsePipes(`FROM t |> LIMIT 5`).changeOffsetValue(2).toString()).toEqual(
        `FROM t |> LIMIT 5 OFFSET 2`,
      );
    });

    it('removes the offset', () => {
      expect(
        parsePipes(`FROM t |> LIMIT 5 OFFSET 2`).changeOffsetClause(undefined).toString(),
      ).toEqual(`FROM t |> LIMIT 5`);
    });

    it('throws without a trailing LIMIT', () => {
      expect(() =>
        parsePipes(`FROM t |> WHERE x`).changeOffsetClause(SqlOffsetClause.create(1)),
      ).toThrow('can not set an OFFSET on a pipes query that does not end with |> LIMIT');
    });

    it('returns the same query when nothing changes', () => {
      const query = parsePipes(`FROM t |> WHERE x`);

      expect(query.changeOffsetClause(undefined)).toBe(query);
      expect(query.hasOffset()).toEqual(false);
    });
  });

  describe('#walk', () => {
    it('walks the root query and the operators', () => {
      const query = parsePipes(`FROM t |> WHERE a = 1 |> SELECT a`);

      expect(query.getUsedColumnNames()).toEqual(['a']);
      expect(query.getFirstTableName()).toEqual('t');
      expect(
        query
          .walk(ex => {
            if (ex instanceof SqlTable) return SqlTable.optionalQuotes('u');
            if (ex instanceof SqlColumn) return SqlColumn.optionalQuotes('b');
            return ex;
          })
          .toString(),
      ).toEqual(`FROM u |> WHERE b = 1 |> SELECT b`);
    });

    it('stops when the substitutor returns undefined', () => {
      const query = parsePipes(`FROM t |> WHERE a = 1`);

      expect(query.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(query);
      expect(query.walk(ex => (ex instanceof SqlTable ? undefined : ex))).toBe(query);
    });

    it('throws when the root query is replaced with something that is not a query', () => {
      const query = parsePipes(`FROM t |> WHERE a = 1`);

      expect(() =>
        query.walk(ex => (ex instanceof SqlFromQuery ? SqlColumn.create('x') : ex)),
      ).toThrow('must return a sql query');
    });
  });

  describe('#clearOwnSeparators', () => {
    it('resets the space between operators', () => {
      expect(parsePipes(`FROM t |> WHERE x   |> LIMIT 1`).clearOwnSeparators().toString()).toEqual(
        `FROM t |> WHERE x\n|> LIMIT 1`,
      );
    });
  });

  describe('#prettify', () => {
    it('puts each operator on its own line', () => {
      expect(SqlExpression.parse(`from t |>  where x   |> limit 1`).prettify().toString()).toEqual(
        `FROM t\n|> WHERE x\n|> LIMIT 1`,
      );
    });
  });
});
