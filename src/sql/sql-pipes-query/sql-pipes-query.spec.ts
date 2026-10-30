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
  SqlWithQuery,
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
      `VALUES (1), (2) |> WHERE "EXPR$0" > 1`,
      `(FROM t |> WHERE x)`,
      `EXPLAIN PLAN FOR FROM t |> WHERE x`,
      `INSERT INTO u FROM t |> WHERE x PARTITIONED BY DAY`,
      `REPLACE INTO u OVERWRITE ALL FROM t |> AGGREGATE COUNT(*) GROUP BY a PARTITIONED BY ALL CLUSTERED BY a`,
      sane`
        SET x = 1;
        FROM t
        |> WHERE x
      `,
      `FROM t AS a |> WHERE a.x`,
      `FROM t a, u b |> WHERE a.x = b.x`,
      `FROM t AS a JOIN u AS b ON a.x = b.x |> AGGREGATE COUNT(*) AS c`,
      `FROM (SELECT a FROM t) AS s |> WHERE s.a > 1`,
      `WITH s AS (SELECT a FROM t) FROM s |> WHERE a > 1`,
      `WITH s AS (FROM t) FROM s |> AGGREGATE COUNT(*) AS c`,
      `WITH s AS (SELECT a FROM t) TABLE s |> LIMIT 1`,
      `WITH s AS (SELECT a FROM t) SELECT a FROM s |> WHERE a > 1`,
      `(FROM t) |> WHERE x`,
      `(SELECT a FROM t) |> WHERE a > 1`,
      `(FROM t |> SELECT a) |> LIMIT 1`,
      `FROM t |> SELECT DISTINCT a |> UNION ALL (FROM u |> SELECT a), (SELECT b FROM v)`,
      `FROM t |> AS a |> JOIN u AS b ON a.x = b.x |> RENAME x AS y |> DISTINCT`,
      `FROM t |> AGGREGATE COUNT(*) AS c DESC GROUP BY a ASC NULLS LAST, b`,
      `SELECT a FROM t UNION ALL SELECT a FROM u |> AGGREGATE COUNT(*) AS c`,
      `WITH s AS (FROM t) SELECT a, b FROM s |> WHERE a IN (FROM s |> SELECT a)`,
      sane`
        FROM t
        |> WHERE a = 'x'
        |> AGGREGATE COUNT(*) AS c, SUM(b) AS s GROUP BY d
        |> ORDER BY c DESC, d
        |> LIMIT 5
      `,
      sane`
        FROM t
        |> SELECT a, b, c
        |> EXTEND b - c AS e
        |> DROP c
        |> RENAME a AS k
        |> SET b = b * 2
        |> AGGREGATE SUM(b) AS b, SUM(e) AS e GROUP BY k
      `,
      sane`
        SELECT a, COUNT(*) AS c FROM t GROUP BY a
        |> WHERE c > 10
        |> ORDER BY c DESC
      `,
      sane`
        FROM t
        |> SELECT a
        |> DISTINCT
        |> AGGREGATE COUNT(*) c
      `,
      sane`
        FROM t
        |> AS l
        |> LEFT JOIN u AS r ON l.k = r.k
        |> AGGREGATE COUNT(*) AS c, SUM(r.v) AS s
      `,
      sane`
        FROM t
        |> SELECT a
        |> UNION ALL (
             FROM u
             |> SELECT a
           )
      `,
      `FROM t |> AGGREGATE COUNT(*) AS c GROUP BY a DESC /* sorts */ |> LIMIT 2`,
      `FROM t |> ORDER BY __time |> SELECT a |> LIMIT 2`,
      `FROM t |> AS m |> WHERE MY_FN(m.*, 'x') |> AGGREGATE COUNT(*) AS c`,
      sane`
        INSERT INTO dst
        WITH s AS (FROM t)
        FROM s
        |> SELECT __time, a
        PARTITIONED BY ALL TIME
      `,
      sane`
        REPLACE INTO dst OVERWRITE ALL
        FROM TABLE(EXTERN('{}', '{}')) EXTEND (a VARCHAR, b BIGINT)
        |> AGGREGATE SUM(b) AS b GROUP BY a
        PARTITIONED BY DAY
      `,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlPipesQuery);
    });

    it('applies the pipe operators after a UNION ALL to the whole union', () => {
      const query = parsePipes(
        `SELECT a FROM t UNION ALL FROM u UNION ALL SELECT a FROM v ORDER BY a LIMIT 3 |> WHERE a`,
      );

      expect(query.query).toBeInstanceOf(SqlQuery);
      expect(query.query.toString()).toEqual(
        `SELECT a FROM t UNION ALL FROM u UNION ALL SELECT a FROM v ORDER BY a LIMIT 3`,
      );
      expect(query.getPipeOperators().map(String)).toEqual([`|> WHERE a`]);
    });

    it('keeps the pipe operators in parentheses on their query', () => {
      const query = SqlExpression.parse(`SELECT a FROM t UNION ALL (FROM u |> WHERE a)`);

      expect(query).toBeInstanceOf(SqlQuery);
      expect((query as SqlQuery).unionQuery).toBeInstanceOf(SqlPipesQuery);
    });

    it('puts a WITH in front of the root query around the whole pipeline', () => {
      for (const root of [`FROM s`, `SELECT a FROM s UNION ALL FROM s`]) {
        const query = parsePipes(`WITH s AS (SELECT a FROM t) ${root} |> WHERE a > 1`);

        expect(String(query.withClause)).toEqual(`WITH s AS (SELECT a FROM t)`);
        expect(query.query.toString()).toEqual(root);
      }
    });

    it('leaves a WITH in parentheses on the root query', () => {
      const query = parsePipes(`(WITH s AS (FROM t) FROM s) |> WHERE a > 1`);

      expect(query.withClause).toBeUndefined();
      expect(query.query).toBeInstanceOf(SqlWithQuery);
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

    it('puts the ingest clauses on the pipes query', () => {
      for (const root of [`FROM t`, `FROM t UNION ALL FROM v`]) {
        const query = parsePipes(
          `INSERT INTO u ${root} |> WHERE x PARTITIONED BY DAY CLUSTERED BY a`,
        );

        expect(query.query.toString()).toEqual(root);
        expect(String(query.insertClause)).toEqual(`INSERT INTO u`);
        expect(String(query.partitionedByClause)).toEqual(`PARTITIONED BY DAY`);
        expect(String(query.clusteredByClause)).toEqual(`CLUSTERED BY a`);
      }
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
            "fromClause": SqlFromClause {
              "expressions": SeparatedArray {
                "separators": Array [],
                "values": Array [
                  SqlTable {
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
                ],
              },
              "joinParts": undefined,
              "keywords": Object {
                "from": "FROM",
              },
              "parens": undefined,
              "spacing": Object {
                "postFrom": " ",
              },
              "type": "fromClause",
            },
            "insertClause": undefined,
            "keywords": Object {},
            "limitClause": undefined,
            "offsetClause": undefined,
            "orderByClause": undefined,
            "parens": undefined,
            "partitionedByClause": undefined,
            "replaceClause": undefined,
            "spacing": Object {},
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
          "withClause": undefined,
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
      `FROM t |> GROUP BY x`,
      `FROM t |> WHERE x |> UNION ALL FROM u`,
      `FROM t |> WHERE x UNION ALL FROM u`,
      `FROM t |> LIMIT 1 UNION ALL SELECT a FROM u`,
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

    it('puts the WITH of the root query around the pipeline, as parsing does', () => {
      const query = SqlPipesQuery.create(SqlQuery.parse(`WITH s AS (FROM t) SELECT a FROM s`), [
        SqlWherePipeOperator.create(SqlColumn.create('x')),
      ]);

      expect(String(query.withClause)).toEqual(`WITH s AS (FROM t)`);
      expect(query.query.toString()).toEqual(`SELECT a FROM s`);
      expect(query.toString()).toEqual(`WITH s AS (FROM t) SELECT a FROM s\n|> WHERE "x"`);
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

    it('throws when given a union', () => {
      expect(() =>
        parsePipes(`FROM t |> WHERE x`).changeUnionQuery(SqlFromQuery.create('u')),
      ).toThrow('a pipes query can not have a UNION ALL after it, use |> UNION ALL instead');
    });
  });

  describe('#changeWithClause', () => {
    it('sets and removes the WITH', () => {
      const query = parsePipes(`WITH s AS (FROM t)\nFROM s |> WHERE x`);

      expect(query.changeWithClause(undefined).toString()).toEqual(`FROM s |> WHERE x`);
      expect(parsePipes(`FROM s |> WHERE x`).changeWithClause(query.withClause).toString()).toEqual(
        `WITH s AS (FROM t)\nFROM s |> WHERE x`,
      );
    });
  });

  describe('#getWithParts', () => {
    it('gets the parts of the WITH', () => {
      expect(
        parsePipes(`WITH s AS (FROM t), r AS (FROM u) FROM s |> WHERE x`)
          .getWithParts()
          .map(String),
      ).toEqual([`s AS (FROM t)`, `r AS (FROM u)`]);
      expect(parsePipes(`FROM s |> WHERE x`).getWithParts()).toEqual([]);
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

    it('inserts into operators that were created without separators', () => {
      expect(
        SqlPipesQuery.create(SqlFromQuery.create('t'), [
          SqlWherePipeOperator.create(SqlColumn.create('x')),
          SqlLimitPipeOperator.create(5),
        ])
          .insertPipeOperator(1, SqlWherePipeOperator.create(SqlColumn.create('y')))
          .appendPipeOperator(SqlWherePipeOperator.create(SqlColumn.create('z')))
          .toString(),
      ).toEqual(`FROM "t"\n|> WHERE "x"\n|> WHERE "y"\n|> LIMIT 5\n|> WHERE "z"`);
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
      expect(removed.toString()).toEqual(`INSERT INTO u FROM t PARTITIONED BY DAY`);
    });

    it('gives the WITH back to the root query when the last operator goes', () => {
      const select = parsePipes(`WITH s AS (FROM t) SELECT a FROM s |> WHERE x`).removePipeOperator(
        0,
      );
      expect(select).toBeInstanceOf(SqlQuery);
      expect(select.toString()).toEqual(`WITH s AS (FROM t) SELECT a FROM s`);

      const from = parsePipes(
        `INSERT INTO u WITH s AS (FROM t) FROM s |> WHERE x`,
      ).removePipeOperator(0);
      expect(from).toBeInstanceOf(SqlWithQuery);
      expect(from.toString()).toEqual(`INSERT INTO u WITH s AS (FROM t) FROM s`);
    });
  });

  describe('#unpipe', () => {
    function unpipe(sql: string): string {
      return parsePipes(sql).unpipe().toString();
    }

    it('keeps the casing and spacing of the clauses that carry over', () => {
      expect(unpipe(`From t |> Where x=1`)).toEqual(`SELECT * From t Where x=1`);
      expect(unpipe(`FROM t\n|> WHERE x = 1\n|> LIMIT 10`)).toEqual(
        `SELECT * FROM t\nWHERE x = 1\nLIMIT 10`,
      );
      expect(
        unpipe(
          `from t |> where x |> aggregate count(*) as c group by a |> order by c desc |> limit 5`,
        ),
      ).toEqual(`SELECT a, count(*) as c from t where x group by a order by c desc limit 5`);
    });

    it('returns a SqlQuery', () => {
      expect(parsePipes(`FROM t |> WHERE x`).unpipe()).toBeInstanceOf(SqlQuery);
    });

    it('keeps comments in front of the clauses they were in front of', () => {
      expect(unpipe(`FROM t\n-- only x\n|> WHERE x`)).toEqual(
        `SELECT * FROM t\n-- only x\nWHERE x`,
      );
    });

    it('does not glue clauses together', () => {
      expect(unpipe(`FROM t|>WHERE x`)).toEqual(`SELECT * FROM t WHERE x`);
    });

    it('combines WHERE operators', () => {
      expect(unpipe(`FROM t |> WHERE x = 1 |> WHERE y = 2 OR z = 3`)).toEqual(
        `SELECT * FROM t WHERE x = 1 AND (y = 2 OR z = 3)`,
      );
    });

    it('folds a SELECT into the select list', () => {
      expect(unpipe(`FROM t |> WHERE x |> select a, b AS c`)).toEqual(
        `select a, b AS c FROM t WHERE x`,
      );
    });

    it('folds an EXTEND into the select list', () => {
      expect(unpipe(`FROM t |> EXTEND a + 1 AS b, a + 2 AS c`)).toEqual(
        `SELECT *, a + 1 AS b, a + 2 AS c FROM t`,
      );
      expect(unpipe(`FROM t\n|> EXTEND\n  a + 1 AS b,\n  a + 2 AS c`)).toEqual(
        `SELECT *,\n  a + 1 AS b,\n  a + 2 AS c\nFROM t`,
      );
    });

    it('puts the grouping keys before the aggregates', () => {
      expect(
        unpipe(`FROM t |> WHERE x |> AGGREGATE COUNT(*) AS c, SUM(v) AS s GROUP BY a, b`),
      ).toEqual(`SELECT a, b, COUNT(*) AS c, SUM(v) AS s FROM t WHERE x GROUP BY a, b`);
      expect(unpipe(`FROM t |> AGGREGATE COUNT(*) AS c`)).toEqual(`SELECT COUNT(*) AS c FROM t`);
      expect(unpipe(`FROM t |> AGGREGATE GROUP BY a`)).toEqual(`SELECT a FROM t GROUP BY a`);
      expect(unpipe(`FROM t |> AGGREGATE COUNT(*) GROUP BY ROLLUP (a, b)`)).toEqual(
        `SELECT a, b, COUNT(*) FROM t GROUP BY ROLLUP (a, b)`,
      );
      expect(
        unpipe(`FROM t |> AGGREGATE COUNT(*) GROUP BY GROUPING SETS ((a), (a, b), ())`),
      ).toEqual(`SELECT a, b, COUNT(*) FROM t GROUP BY GROUPING SETS ((a), (a, b), ())`);
    });

    it('moves the aliases of the grouping keys into the select list', () => {
      expect(unpipe(`FROM t |> AGGREGATE COUNT(*) AS n GROUP BY UPPER(item) AS i, b`)).toEqual(
        `SELECT UPPER(item) AS i, b, COUNT(*) AS n FROM t GROUP BY UPPER(item), b`,
      );
      expect(unpipe(`FROM t |> AGGREGATE GROUP BY item i`)).toEqual(
        `SELECT item i FROM t GROUP BY item`,
      );
      expect(
        unpipe(`FROM t |> AGGREGATE COUNT(*) AS n GROUP BY item AS i |> ORDER BY i |> LIMIT 5`),
      ).toEqual(`SELECT item AS i, COUNT(*) AS n FROM t GROUP BY item ORDER BY i LIMIT 5`);
    });

    it('throws for an AGGREGATE with nothing to output', () => {
      expect(() => unpipe(`FROM t |> AGGREGATE GROUP BY ()`)).toThrow(
        'can not unpipe an |> AGGREGATE that has no aggregates or grouping keys',
      );
    });

    it('wraps the query when an operator can not be folded into it', () => {
      // WHERE can not see a column that the SELECT list defines
      expect(unpipe(`FROM t |> EXTEND a + 1 AS b |> WHERE b > 2`)).toEqual(
        `SELECT * FROM (SELECT *, a + 1 AS b FROM t) WHERE b > 2`,
      );

      // WHERE applies after the LIMIT
      expect(unpipe(`FROM t |> LIMIT 5 |> WHERE x`)).toEqual(
        `SELECT * FROM (SELECT * FROM t LIMIT 5) WHERE x`,
      );

      // AGGREGATE over an aggregate
      expect(
        unpipe(`FROM t |> AGGREGATE COUNT(*) AS c GROUP BY a |> AGGREGATE MAX(c) AS m`),
      ).toEqual(`SELECT MAX(c) AS m FROM (SELECT a, COUNT(*) AS c FROM t GROUP BY a)`);

      // LIMIT after a LIMIT
      expect(unpipe(`FROM t |> LIMIT 5 OFFSET 1 |> LIMIT 2`)).toEqual(
        `SELECT * FROM (SELECT * FROM t LIMIT 5 OFFSET 1) LIMIT 2`,
      );
    });

    it('folds an ORDER BY past a select list only when it names output columns', () => {
      expect(unpipe(`FROM t |> AGGREGATE COUNT(*) AS c GROUP BY a |> ORDER BY c DESC, a`)).toEqual(
        `SELECT a, COUNT(*) AS c FROM t GROUP BY a ORDER BY c DESC, a`,
      );
      expect(unpipe(`FROM t |> AGGREGATE COUNT(*) AS c GROUP BY a |> ORDER BY c + 1`)).toEqual(
        `SELECT * FROM (SELECT a, COUNT(*) AS c FROM t GROUP BY a) ORDER BY c + 1`,
      );
      expect(unpipe(`FROM t |> ORDER BY a + 1 |> LIMIT 3`)).toEqual(
        `SELECT * FROM t ORDER BY a + 1 LIMIT 3`,
      );
      expect(unpipe(`FROM t |> LIMIT 3 |> ORDER BY a`)).toEqual(
        `SELECT * FROM (SELECT * FROM t LIMIT 3) ORDER BY a`,
      );
      expect(unpipe(`FROM t |> SELECT a::BIGINT |> ORDER BY a`)).toEqual(
        `SELECT a::BIGINT FROM t ORDER BY a`,
      );
    });

    it('keeps NULLS FIRST and NULLS LAST', () => {
      expect(
        unpipe(`FROM t |> AGGREGATE COUNT(*) AS c GROUP BY a |> ORDER BY c DESC NULLS LAST, a`),
      ).toEqual(`SELECT a, COUNT(*) AS c FROM t GROUP BY a ORDER BY c DESC NULLS LAST, a`);
      expect(unpipe(`FROM t |> LIMIT 3 |> ORDER BY a nulls  first`)).toEqual(
        `SELECT * FROM (SELECT * FROM t LIMIT 3) ORDER BY a nulls  first`,
      );
    });

    it('spells out the columns for SET and DROP', () => {
      expect(unpipe(`FROM t |> AGGREGATE COUNT(*) AS c, SUM(v) AS s GROUP BY a |> SET c = c * 2`))
        .toEqual(sane`
          SELECT
            a,
            c * 2 AS c,
            s
          FROM (SELECT a, COUNT(*) AS c, SUM(v) AS s FROM t GROUP BY a)
        `);

      expect(unpipe(`FROM t |> SELECT a, b, "c d" |> DROP b`)).toEqual(sane`
        SELECT
          a,
          "c d"
        FROM (SELECT a, b, "c d" FROM t)
      `);

      expect(unpipe(`FROM t |> SELECT a, b |> WHERE a > 1 |> DROP b`)).toEqual(
        `SELECT a FROM (SELECT a, b FROM t) WHERE a > 1`,
      );

      expect(unpipe(`FROM t |> SELECT a, b::BIGINT, v:c |> DROP a`)).toEqual(sane`
        SELECT
          b,
          c
        FROM (SELECT a, b::BIGINT, v:c FROM t)
      `);
    });

    it('throws for SET and DROP when the input columns are not known', () => {
      expect(() => unpipe(`FROM t |> DROP a`)).toThrow(
        'can not unpipe |> DROP because the columns of its input are not known',
      );
      expect(() => unpipe(`FROM t |> SET a = 1`)).toThrow(
        'can not unpipe |> SET because the columns of its input are not known',
      );
      expect(() => unpipe(`FROM t |> SELECT a, b + 1 |> DROP a`)).toThrow(
        'can not unpipe |> DROP because the columns of its input are not known',
      );
      expect(() => unpipe(`FROM t |> SELECT a, a::BIGINT |> DROP a`)).toThrow(
        'can not unpipe |> DROP because the columns of its input are not known',
      );
      expect(() => unpipe(`FROM t |> SELECT a, u.* |> DROP a`)).toThrow(
        'can not unpipe |> DROP because the columns of its input are not known',
      );
      expect(() => unpipe(`SELECT * FROM t JOIN u ON t.a = u.a |> DROP a`)).toThrow(
        'can not unpipe |> DROP because the columns of its input are not known',
      );
    });

    it('throws for SET and DROP of unknown columns', () => {
      expect(() => unpipe(`FROM t |> SELECT a |> SET b = 1`)).toThrow(
        `can not SET unknown column 'b'`,
      );
      expect(() => unpipe(`FROM t |> SELECT a |> DROP b`)).toThrow(
        `can not DROP unknown column 'b'`,
      );
      expect(() => unpipe(`FROM t |> SELECT a |> DROP a`)).toThrow('can not DROP every column');
    });

    it('follows a star through sub queries to find the columns', () => {
      expect(unpipe(`FROM t |> SELECT a, b |> EXTEND a + b AS c |> DROP a`)).toEqual(sane`
        SELECT
          b,
          c
        FROM (SELECT *, a + b AS c FROM (SELECT a, b FROM t))
      `);
    });

    it('works with every kind of root query', () => {
      expect(unpipe(`TABLE t |> WHERE x`)).toEqual(`SELECT * FROM t WHERE x`);
      expect(unpipe(`FROM t LIMIT 5 |> WHERE x`)).toEqual(
        `SELECT * FROM (SELECT * FROM t LIMIT 5) WHERE x`,
      );
      expect(unpipe(`SELECT a FROM t |> WHERE a > 1`)).toEqual(
        `SELECT * FROM (SELECT a FROM t) WHERE a > 1`,
      );
      expect(unpipe(`SELECT * FROM t WHERE x |> WHERE y`)).toEqual(`SELECT * FROM t WHERE x AND y`);
      expect(unpipe(`VALUES (1), (2) |> WHERE "EXPR$0" > 1`)).toEqual(
        `SELECT * FROM (VALUES (1), (2)) WHERE "EXPR$0" > 1`,
      );
    });

    it('keeps the parts that wrap the pipeline', () => {
      expect(unpipe(`INSERT INTO u FROM t |> WHERE x PARTITIONED BY DAY CLUSTERED BY a`)).toEqual(
        `INSERT INTO u SELECT * FROM t WHERE x PARTITIONED BY DAY CLUSTERED BY a`,
      );
      expect(unpipe(`SET x = 1;\nEXPLAIN PLAN FOR FROM t |> WHERE x`)).toEqual(
        `SET x = 1;\nEXPLAIN PLAN FOR SELECT * FROM t WHERE x`,
      );
      expect(unpipe(`  (FROM t |> WHERE x)  `)).toEqual(`  (SELECT * FROM t WHERE x)  `);
    });

    it('applies the operators after a UNION ALL to the whole union', () => {
      expect(
        unpipe(`SELECT a FROM t UNION ALL SELECT a FROM u |> AGGREGATE COUNT(*) AS c`),
      ).toEqual(`SELECT COUNT(*) AS c FROM (SELECT a FROM t UNION ALL SELECT a FROM u)`);
      expect(unpipe(`SELECT a FROM t UNION ALL SELECT a FROM u LIMIT 5 |> WHERE a`)).toEqual(
        `SELECT * FROM (SELECT a FROM t UNION ALL SELECT a FROM u LIMIT 5) WHERE a`,
      );
    });

    it('keeps the tables of a WITH in reach of every operator', () => {
      expect(
        unpipe(`WITH s AS (FROM t) SELECT a, b FROM s |> WHERE a IN (FROM s |> SELECT a)`),
      ).toEqual(
        `WITH s AS (SELECT * FROM t) SELECT * FROM (SELECT a, b FROM s) WHERE a IN (SELECT a FROM s)`,
      );
      expect(
        unpipe(
          `WITH s AS (FROM t) FROM s |> AGGREGATE COUNT(*) AS c GROUP BY a |> WHERE a IN (FROM s)`,
        ),
      ).toEqual(
        `WITH s AS (SELECT * FROM t) SELECT * FROM (SELECT a, COUNT(*) AS c FROM s GROUP BY a) WHERE a IN (SELECT * FROM s)`,
      );
      expect(unpipe(`WITH r AS (FROM u) (WITH s AS (FROM t) SELECT * FROM s) |> WHERE x`)).toEqual(
        `WITH r AS (SELECT * FROM u), s AS (SELECT * FROM t) SELECT * FROM s WHERE x`,
      );
    });

    it('converts SELECT DISTINCT and DISTINCT', () => {
      expect(unpipe(`FROM t |> SELECT DISTINCT a`)).toEqual(`SELECT DISTINCT a FROM t`);
      expect(unpipe(`FROM t |> SELECT a |> distinct`)).toEqual(`SELECT distinct a FROM t`);
      expect(unpipe(`FROM t |> WHERE x |> DISTINCT`)).toEqual(`SELECT DISTINCT * FROM t WHERE x`);
      expect(unpipe(`FROM t |> SELECT a |> LIMIT 5 |> DISTINCT`)).toEqual(
        `SELECT DISTINCT * FROM (SELECT a FROM t LIMIT 5)`,
      );
      expect(unpipe(`FROM t |> DISTINCT |> WHERE x`)).toEqual(
        `SELECT * FROM (SELECT DISTINCT * FROM t) WHERE x`,
      );
    });

    it('converts AS', () => {
      expect(unpipe(`FROM t |> AS a |> WHERE a.x`)).toEqual(`SELECT * FROM t AS a WHERE a.x`);
      expect(unpipe(`FROM t AS b |> AS a`)).toEqual(`SELECT * FROM t AS a`);
      expect(unpipe(`FROM t |> WHERE x |> AS a |> WHERE a.y`)).toEqual(
        `SELECT * FROM (SELECT * FROM t WHERE x) AS a WHERE a.y`,
      );
    });

    it('converts JOIN', () => {
      expect(unpipe(`FROM t |> AS a |> JOIN u AS b ON a.x = b.x`)).toEqual(
        `SELECT * FROM t AS a JOIN u AS b ON a.x = b.x`,
      );
      expect(unpipe(`FROM t JOIN u USING (x) |> LEFT JOIN v USING (y)`)).toEqual(
        `SELECT * FROM t JOIN u USING (x)\nLEFT JOIN v USING (y)`,
      );
    });

    it('keeps the name of the input when a JOIN has to go after a sub query', () => {
      expect(unpipe(`FROM t |> WHERE x |> JOIN u ON t.k = u.k`)).toEqual(
        `SELECT * FROM (SELECT * FROM t WHERE x) AS t JOIN u ON t.k = u.k`,
      );
      expect(unpipe(`FROM t AS a |> WHERE x |> JOIN u ON a.k = u.k`)).toEqual(
        `SELECT * FROM (SELECT * FROM t AS a WHERE x) AS a JOIN u ON a.k = u.k`,
      );
      expect(unpipe(`FROM t |> SELECT k |> JOIN u USING (k)`)).toEqual(
        `SELECT * FROM (SELECT k FROM t) JOIN u USING (k)`,
      );
    });

    it('converts RENAME when the input columns are known', () => {
      expect(unpipe(`FROM t |> SELECT a, b, c |> RENAME a AS x, c y`)).toEqual(sane`
        SELECT
          a AS x,
          b,
          c y
        FROM (SELECT a, b, c FROM t)
      `);
      expect(() => unpipe(`FROM t |> RENAME a AS x`)).toThrow(
        'can not unpipe |> RENAME because the columns of its input are not known',
      );
      expect(() => unpipe(`FROM t |> SELECT a |> RENAME b AS x`)).toThrow(
        `can not RENAME unknown column 'b'`,
      );
    });

    it('converts UNION ALL', () => {
      expect(
        unpipe(`FROM t |> SELECT a |> UNION ALL (FROM u |> SELECT a), (SELECT b FROM v)`),
      ).toEqual(`SELECT a FROM t UNION ALL SELECT a FROM u UNION ALL SELECT b FROM v`);
      expect(
        unpipe(`FROM t |> SELECT a |> UNION ALL (SELECT a FROM u LIMIT 1) |> WHERE a`),
      ).toEqual(
        `SELECT * FROM (SELECT a FROM t UNION ALL SELECT * FROM (SELECT a FROM u LIMIT 1)) WHERE a`,
      );
      expect(unpipe(`FROM t |> LIMIT 1 |> UNION ALL (FROM u)`)).toEqual(
        `SELECT * FROM (SELECT * FROM t LIMIT 1) UNION ALL SELECT * FROM u`,
      );
    });

    it('converts a UNION without ALL to a DISTINCT over a UNION ALL', () => {
      expect(unpipe(`FROM t |> SELECT a |> UNION (FROM u |> SELECT a)`)).toEqual(
        `SELECT DISTINCT * FROM (SELECT a FROM t UNION ALL SELECT a FROM u)`,
      );
      expect(unpipe(`FROM t |> SELECT a |> UNION DISTINCT (FROM u |> SELECT a)`)).toEqual(
        `SELECT DISTINCT * FROM (SELECT a FROM t UNION ALL SELECT a FROM u)`,
      );
    });

    it('turns the order suffixes of an AGGREGATE into an ORDER BY', () => {
      expect(unpipe(`FROM t |> AGGREGATE COUNT(*) AS c DESC GROUP BY a`)).toEqual(
        `SELECT a, COUNT(*) AS c FROM t GROUP BY a\nORDER BY c DESC`,
      );
      expect(
        unpipe(`FROM t |> AGGREGATE COUNT(*) DESC, SUM(x) AS s GROUP BY a AS k ASC NULLS LAST, b`),
      ).toEqual(
        `SELECT a AS k, b, COUNT(*), SUM(x) AS s FROM t GROUP BY a, b\nORDER BY k ASC NULLS LAST, COUNT(*) DESC`,
      );
      expect(unpipe(`FROM t |> AGGREGATE COUNT(*) AS c GROUP BY a DESC |> LIMIT 3`)).toEqual(
        `SELECT a, COUNT(*) AS c FROM t GROUP BY a\nORDER BY a DESC LIMIT 3`,
      );
    });

    it('converts every kind of FROM query', () => {
      expect(unpipe(`FROM t AS a, u |> WHERE a.x = u.x`)).toEqual(
        `SELECT * FROM t AS a, u WHERE a.x = u.x`,
      );
      expect(unpipe(`(FROM t) |> WHERE x`)).toEqual(`SELECT * FROM t WHERE x`);
      expect(unpipe(`WITH s AS (FROM t) FROM s |> WHERE x`)).toEqual(
        `WITH s AS (SELECT * FROM t) SELECT * FROM s WHERE x`,
      );
      expect(unpipe(`(FROM t) LIMIT 5 |> WHERE x`)).toEqual(
        `SELECT * FROM ((SELECT * FROM t) LIMIT 5) WHERE x`,
      );
    });

    it('converts nested pipe queries', () => {
      expect(
        unpipe(`FROM t |> WHERE a IN (FROM u |> SELECT a) |> UNION ALL (FROM v |> WHERE y)`),
      ).toEqual(`SELECT * FROM t WHERE a IN (SELECT a FROM u) UNION ALL SELECT * FROM v WHERE y`);
      expect(
        new SqlPipesQuery({
          query: parsePipes(`FROM t |> WHERE x`),
          pipeOperators: parsePipes(`FROM t |> LIMIT 1`).pipeOperators,
        })
          .unpipe()
          .toString(),
      ).toEqual(`SELECT * FROM t WHERE x\nLIMIT 1`);
    });

    it('converts a long query', () => {
      const query = parsePipes(sane`
        FROM store
        |> WHERE channel = '#en'
        |> EXTEND
             LOWER(site_name) AS site,
             TIME_FLOOR(__time, 'P1D') AS day_start
        -- Visitors per site per day
        |> AGGREGATE COUNT(DISTINCT client_ip) AS visitors GROUP BY site, day_start
        |> AGGREGATE
             SUM(visitors) FILTER (WHERE day_start >= TIMESTAMP '2026-01-01') AS current_visitors,
             AVG(visitors) FILTER (WHERE day_start < TIMESTAMP '2026-01-01') AS avg_visitors
           GROUP BY site
        |> EXTEND avg_visitors * 3 AS threshold
        |> WHERE current_visitors > threshold
        |> SET threshold = ROUND(threshold, 1)
        |> ORDER BY current_visitors DESC
        |> LIMIT 10
      `);

      const unpiped = query.unpipe();
      expect(unpiped.toString()).toMatchInlineSnapshot(`
        "SELECT
          site,
          current_visitors,
          avg_visitors,
          ROUND(threshold, 1) AS threshold
        FROM (
          SELECT *, avg_visitors * 3 AS threshold
          FROM (
            SELECT site,
                 SUM(visitors) FILTER (WHERE day_start >= TIMESTAMP '2026-01-01') AS current_visitors,
                 AVG(visitors) FILTER (WHERE day_start < TIMESTAMP '2026-01-01') AS avg_visitors
            FROM (
              SELECT site, day_start, COUNT(DISTINCT client_ip) AS visitors
              FROM (
                SELECT *,
                     LOWER(site_name) AS site,
                     TIME_FLOOR(__time, 'P1D') AS day_start
                FROM store
                WHERE channel = '#en'
              )
              -- Visitors per site per day
              GROUP BY site, day_start
            )
            GROUP BY site
          )
        )
        WHERE current_visitors > threshold
        ORDER BY current_visitors DESC
        LIMIT 10"
      `);
      expect(
        SqlExpression.parse(unpiped.toString()).some(ex => ex instanceof SqlPipesQuery),
      ).toEqual(false);
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
