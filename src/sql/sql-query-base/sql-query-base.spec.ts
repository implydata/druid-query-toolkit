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

import type { SqlBase } from '../..';
import {
  C,
  SqlClusteredByClause,
  SqlColumn,
  SqlExpression,
  SqlInsertClause,
  SqlLimitClause,
  SqlLiteral,
  SqlOffsetClause,
  SqlOrderByExpression,
  SqlPartitionedByClause,
  SqlPipesQuery,
  SqlQuery,
  SqlReplaceClause,
  SqlSetStatement,
  SqlTable,
  SqlTableQuery,
  SqlValues,
  SqlWithQuery,
} from '../..';
import { sane } from '../../utils';

import { SqlQueryBase } from './sql-query-base';

function parseValues(sql: string): SqlValues {
  const parsed = SqlExpression.parse(sql);
  if (!(parsed instanceof SqlValues)) throw new Error(`not VALUES: ${sql}`);
  return parsed;
}

describe('SqlQueryBase', () => {
  describe('.parse', () => {
    it('parses any kind of query', () => {
      expect(SqlQueryBase.parse('SELECT 1')).toBeInstanceOf(SqlQuery);
      expect(SqlQueryBase.parse('TABLE t')).toBeInstanceOf(SqlTableQuery);
      expect(SqlQueryBase.parse('FROM t |> WHERE a = 1')).toBeInstanceOf(SqlPipesQuery);
    });

    it('returns a query it is given', () => {
      const query = SqlQuery.parse('SELECT 1');
      expect(SqlQueryBase.parse(query)).toBe(query);
    });

    it('throws on an expression that is not a query', () => {
      expect(() => SqlQueryBase.parse('a + 1')).toThrow('Provided SQL was not a query');
    });
  });

  describe('.maybeParse', () => {
    it('returns undefined for what is not a query', () => {
      expect(SqlQueryBase.maybeParse('TABLE t')).toBeInstanceOf(SqlTableQuery);
      expect(SqlQueryBase.maybeParse('a + 1')).toBeUndefined();
      expect(SqlQueryBase.maybeParse('SELEC')).toBeUndefined();
    });
  });

  describe('.getSelectExpressionOutput', () => {
    it('uses the output name or makes up a phony one', () => {
      expect(SqlQuery.getSelectExpressionOutput(SqlExpression.parse(`x AS y`), 0)).toEqual('y');
      expect(SqlQuery.getSelectExpressionOutput(SqlExpression.parse(`t.channel`), 1)).toEqual(
        'channel',
      );
      expect(SqlQuery.getSelectExpressionOutput(SqlExpression.parse(`1 + 2`), 3)).toEqual('EXPR$3');
    });
  });

  describe('.isPhonyOutputName', () => {
    it('works', () => {
      expect(SqlQuery.isPhonyOutputName('EXPR$0')).toEqual(true);
      expect(SqlQuery.isPhonyOutputName('EXPR$12')).toEqual(true);
      expect(SqlQuery.isPhonyOutputName('EXPR$01')).toEqual(false);
      expect(SqlQuery.isPhonyOutputName('expr$')).toEqual(false);
    });
  });

  describe('#walk', () => {
    const insertQuery = parseValues(sane`
      SET a = 1;
      INSERT INTO t
      VALUES (1)
      ORDER BY 1
      LIMIT 5
      OFFSET 2
      PARTITIONED BY FLOOR(__time TO DAY)
      CLUSTERED BY x
      UNION ALL VALUES (2)
    `);

    const replaceQuery = parseValues(`REPLACE INTO t OVERWRITE ALL VALUES (1) PARTITIONED BY ALL`);

    it.each<[string, SqlQueryBase, (q: SqlQueryBase) => SqlBase]>([
      ['a SET statement', insertQuery, q => q.contextStatements!.first()],
      ['the INSERT clause', insertQuery, q => q.insertClause!],
      ['the REPLACE clause', replaceQuery, q => q.replaceClause!],
      ['the body', insertQuery, q => (q as SqlValues).records.first()],
      ['the ORDER BY clause', insertQuery, q => q.orderByClause!],
      ['the LIMIT clause', insertQuery, q => q.limitClause!],
      ['the OFFSET clause', insertQuery, q => q.offsetClause!],
      ['the PARTITIONED BY clause', insertQuery, q => q.partitionedByClause!],
      ['the CLUSTERED BY clause', insertQuery, q => q.clusteredByClause!],
      ['the UNION query', insertQuery, q => q.unionQuery!],
    ])('stops at %s when the substitutor returns undefined', (_name, query, getTarget) => {
      const target = getTarget(query);
      const visited: SqlBase[] = [];

      const ret = query.walk(ex => {
        visited.push(ex);
        return ex === target ? undefined : ex;
      });

      expect(ret).toBe(query);
      expect(visited[visited.length - 1]).toBe(target);
    });

    it('substitutes inside every wrapper part', () => {
      expect(
        String(
          insertQuery.walk(ex => {
            if (ex instanceof SqlTable) return ex.changeName('t2');
            if (ex instanceof SqlColumn) return ex.changeName(`${ex.getName()}_2`);
            if (ex instanceof SqlLiteral && ex.value === 1) return SqlLiteral.create(10);
            if (ex instanceof SqlLiteral && ex.value === 2) return SqlLiteral.create(20);
            if (ex instanceof SqlLiteral && ex.value === 5) return SqlLiteral.create(50);
            return ex;
          }),
        ),
      ).toMatchInlineSnapshot(`
        "SET a = 10;
        INSERT INTO t2
        VALUES (10)
        ORDER BY 10
        LIMIT 50
        OFFSET 20
        PARTITIONED BY FLOOR(__time_2 TO DAY)
        CLUSTERED BY x_2
        UNION ALL VALUES (20)"
      `);

      expect(
        String(replaceQuery.walk(ex => (ex instanceof SqlTable ? ex.changeName('t2') : ex))),
      ).toEqual(`REPLACE INTO t2 OVERWRITE ALL VALUES (1) PARTITIONED BY ALL`);
    });
  });

  describe('#changeContextStatements', () => {
    it('sets the statements from an array', () => {
      expect(
        String(
          parseValues(`VALUES (1)`).changeContextStatements([
            SqlSetStatement.create('a', SqlLiteral.create(1)),
          ]),
        ),
      ).toEqual(`SET a = 1;\nVALUES (1)`);
    });

    it('removes the statements and their spacing when given an empty array', () => {
      expect(String(parseValues(`SET a = 1;  VALUES (1)`).changeContextStatements([]))).toEqual(
        `VALUES (1)`,
      );
    });
  });

  describe('#changeExplain', () => {
    it('returns the same instance when nothing changes', () => {
      const values = parseValues(`EXPLAIN PLAN FOR VALUES (1)`);

      expect(values.changeExplain(true)).toBe(values);

      const notExplain = parseValues(`VALUES (1)`);
      expect(notExplain.changeExplain(false)).toBe(notExplain);
    });

    it('removes the EXPLAIN and its spacing', () => {
      expect(String(parseValues(`EXPLAIN PLAN FOR   VALUES (1)`).changeExplain(false))).toEqual(
        `VALUES (1)`,
      );
    });
  });

  describe('#makeExplain', () => {
    it('adds EXPLAIN PLAN FOR', () => {
      expect(String(parseValues(`VALUES (1)`).makeExplain())).toEqual(
        `EXPLAIN PLAN FOR\nVALUES (1)`,
      );
    });
  });

  describe('#changeInsertClause', () => {
    it('sets and removes the clause', () => {
      const values = parseValues(`VALUES (1)`).changeInsertClause(SqlInsertClause.create('t'));

      expect(String(values)).toEqual(`INSERT INTO "t"\nVALUES (1)`);
      expect(String(values.changeInsertClause(undefined))).toEqual(`VALUES (1)`);
    });

    it('can not be combined with a REPLACE clause', () => {
      const values = parseValues(`REPLACE INTO t OVERWRITE ALL VALUES (1)`);

      expect(() => values.changeInsertClause(SqlInsertClause.create('t'))).toThrow(
        'a query can not have both an insertClause and a replaceClause',
      );
    });

    it('returns the same instance when nothing changes', () => {
      const values = parseValues(`INSERT INTO t VALUES (1)`);

      expect(values.changeInsertClause(values.insertClause)).toBe(values);
    });
  });

  describe('#getInsertIntoTable', () => {
    it('returns the insert target', () => {
      expect(String(parseValues(`INSERT INTO t VALUES (1)`).getInsertIntoTable())).toEqual('t');
      expect(parseValues(`VALUES (1)`).getInsertIntoTable()).toBeUndefined();
    });
  });

  describe('#changeInsertIntoTable', () => {
    it('changes the target of an existing clause', () => {
      expect(String(parseValues(`INSERT INTO t VALUES (1)`).changeInsertIntoTable('u'))).toEqual(
        `INSERT INTO "u" VALUES (1)`,
      );
    });

    it('removes the clause when given nothing', () => {
      expect(
        String(parseValues(`INSERT INTO t VALUES (1)`).changeInsertIntoTable(undefined)),
      ).toEqual(`VALUES (1)`);
    });
  });

  describe('#changeReplaceClause', () => {
    it('sets and removes the clause', () => {
      const values = parseValues(`VALUES (1)`).changeReplaceClause(SqlReplaceClause.create('t'));

      expect(String(values)).toEqual(`REPLACE INTO "t" OVERWRITE ALL\nVALUES (1)`);
      expect(String(values.changeReplaceClause(undefined))).toEqual(`VALUES (1)`);
    });

    it('returns the same instance when nothing changes', () => {
      const values = parseValues(`REPLACE INTO t OVERWRITE ALL VALUES (1)`);

      expect(values.changeReplaceClause(values.replaceClause)).toBe(values);
    });
  });

  describe('#getReplaceIntoTable', () => {
    it('returns the replace target', () => {
      expect(
        String(parseValues(`REPLACE INTO t OVERWRITE ALL VALUES (1)`).getReplaceIntoTable()),
      ).toEqual('t');
      expect(parseValues(`VALUES (1)`).getReplaceIntoTable()).toBeUndefined();
    });
  });

  describe('#changeReplaceIntoTable', () => {
    const replaceValues = parseValues(`REPLACE INTO t OVERWRITE ALL VALUES (1)`);

    it('adds a clause', () => {
      expect(String(parseValues(`VALUES (1)`).changeReplaceIntoTable('t'))).toEqual(
        `REPLACE INTO "t" OVERWRITE ALL\nVALUES (1)`,
      );
    });

    it('changes the target of an existing clause', () => {
      expect(String(replaceValues.changeReplaceIntoTable('u'))).toEqual(
        `REPLACE INTO "u" OVERWRITE ALL VALUES (1)`,
      );
    });

    it('removes the clause when given nothing', () => {
      expect(String(replaceValues.changeReplaceIntoTable(undefined))).toEqual(`VALUES (1)`);
    });
  });

  describe('#getIngestTable', () => {
    it('returns the INSERT or REPLACE target', () => {
      expect(String(parseValues(`INSERT INTO t VALUES (1)`).getIngestTable())).toEqual('t');
      expect(
        String(parseValues(`REPLACE INTO u OVERWRITE ALL VALUES (1)`).getIngestTable()),
      ).toEqual('u');
      expect(parseValues(`VALUES (1)`).getIngestTable()).toBeUndefined();
    });
  });

  describe('#flattenWith', () => {
    it('returns the same instance for a query form without a WITH clause', () => {
      const values = parseValues(`VALUES (1)`);

      expect(values.flattenWith()).toBe(values);
    });
  });

  describe('#isValidSelectIndex', () => {
    it('checks the index against the select expressions', () => {
      const query = SqlQuery.parse(`SELECT a, b FROM t`);

      expect(query.isValidSelectIndex(0)).toEqual(true);
      expect(query.isValidSelectIndex(1)).toEqual(true);
      expect(query.isValidSelectIndex(2)).toEqual(false);
      expect(query.isValidSelectIndex(-1)).toEqual(false);
    });

    it('is false when there are no select expressions', () => {
      expect(SqlQuery.from('t').isValidSelectIndex(0)).toEqual(false);
    });
  });

  describe('#getSelectExpressionForIndex', () => {
    it('returns the expression of an output column', () => {
      const query = SqlQuery.parse('SELECT a, b AS "B" FROM t');

      expect(String(query.getSelectExpressionForIndex(1))).toEqual('b AS "B"');
      expect(String(query.getSelectExpressionForIndex(-1))).toEqual('b AS "B"');
      expect(query.getSelectExpressionForIndex(2)).toBeUndefined();
    });
  });

  describe('#hasStarInSelect', () => {
    it('works when there is no star', () => {
      const sql = SqlQuery.parse(sane`
        SELECT
          isAnonymous,
          cityName
        FROM wikipedia
      `);

      expect(sql.hasStarInSelect()).toBe(false);
    });

    it('works when there is a star', () => {
      const sql = SqlQuery.parse(sane`
        SELECT
          *,
          cityName
        FROM wikipedia
      `);

      expect(sql.hasStarInSelect()).toBe(true);
    });

    it('works when there is a star from a table', () => {
      const sql = SqlQuery.parse(sane`
        SELECT
          t.*,
          cityName
        FROM wikipedia AS t
      `);

      expect(sql.hasStarInSelect()).toBe(true);
    });
  });

  describe('#getOutputColumns', () => {
    it('lists the output name of every select expression', () => {
      expect(
        SqlQuery.parse(`SELECT channel, COUNT(*), SUM(x) AS s FROM t`).getOutputColumns(),
      ).toEqual(['channel', 'EXPR$1', 's']);
    });
  });

  describe('#getSelectIndexesForColumn', () => {
    it('finds every select expression that uses the column', () => {
      const query = SqlQuery.parse(`SELECT channel, UPPER(channel) AS u, page FROM t`);

      expect(query.getSelectIndexesForColumn('channel')).toEqual([0, 1]);
      expect(query.getSelectIndexesForColumn('page')).toEqual([2]);
      expect(query.getSelectIndexesForColumn('nope')).toEqual([]);
    });
  });

  describe('#getGroupedSelectIndexesForColumn', () => {
    it('keeps only the grouped select expressions', () => {
      const query = SqlQuery.parse(
        `SELECT channel, LATEST(channel) AS l, UPPER(channel) AS u FROM t GROUP BY 1, 3`,
      );

      expect(query.getGroupedSelectIndexesForColumn('channel')).toEqual([0, 2]);
    });
  });

  describe('#isRealOutputColumnAtSelectIndex', () => {
    it('tells if the select expression has a real output name', () => {
      const query = SqlQuery.parse(`SELECT channel, COUNT(*), SUM(x) AS s FROM t`);

      expect(query.isRealOutputColumnAtSelectIndex(0)).toEqual(true);
      expect(query.isRealOutputColumnAtSelectIndex(1)).toEqual(false);
      expect(query.isRealOutputColumnAtSelectIndex(2)).toEqual(true);
      expect(query.isRealOutputColumnAtSelectIndex(3)).toEqual(false);
    });
  });

  describe('#isGroupedSelectIndex', () => {
    it('is false without a GROUP BY or for an invalid index', () => {
      expect(SqlQuery.parse(`SELECT a FROM t`).isGroupedSelectIndex(0)).toEqual(false);
      expect(SqlQuery.parse(`SELECT a FROM t GROUP BY 1`).isGroupedSelectIndex(0)).toEqual(true);
      expect(SqlQuery.parse(`SELECT a FROM t GROUP BY 1`).isGroupedSelectIndex(1)).toEqual(false);
    });
  });

  describe('#isGroupedOutputColumn', () => {
    it('tells if the output column is grouped on', () => {
      const query = SqlQuery.parse(`SELECT a, COUNT(*) AS c FROM t GROUP BY 1`);

      expect(query.isGroupedOutputColumn('a')).toEqual(true);
      expect(query.isGroupedOutputColumn('c')).toEqual(false);
      expect(query.isGroupedOutputColumn('nope')).toEqual(false);
    });
  });

  describe('#isAggregateSelectIndex', () => {
    it('is false without a GROUP BY or for an invalid index', () => {
      expect(SqlQuery.parse(`SELECT COUNT(*) FROM t`).isAggregateSelectIndex(0)).toEqual(false);
      expect(
        SqlQuery.parse(`SELECT a, COUNT(*) FROM t GROUP BY 1`).isAggregateSelectIndex(2),
      ).toEqual(false);
    });
  });

  describe('#isAggregateOutputColumn', () => {
    it('tells if the output column is an aggregate', () => {
      const query = SqlQuery.parse(`SELECT a, COUNT(*) AS c FROM t GROUP BY 1`);

      expect(query.isAggregateOutputColumn('a')).toEqual(false);
      expect(query.isAggregateOutputColumn('c')).toEqual(true);
      expect(query.isAggregateOutputColumn('nope')).toEqual(false);
    });
  });

  describe('#hasWhere', () => {
    it('tells if there is a WHERE clause', () => {
      expect(SqlQuery.parse(`SELECT a FROM t WHERE b`).hasWhere()).toEqual(true);
      expect(SqlQuery.parse(`SELECT a FROM t`).hasWhere()).toEqual(false);
    });
  });

  describe('#getEffectiveWhereExpression', () => {
    it('returns the WHERE expression or TRUE', () => {
      expect(
        String(SqlQuery.parse(`SELECT a FROM t WHERE b = 1`).getEffectiveWhereExpression()),
      ).toEqual('b = 1');
      expect(SqlQuery.parse(`SELECT a FROM t`).getEffectiveWhereExpression()).toBe(SqlLiteral.TRUE);
    });
  });

  describe('#hasGroupBy', () => {
    it('tells if there is a GROUP BY clause', () => {
      expect(SqlQuery.parse(`SELECT a FROM t GROUP BY a`).hasGroupBy()).toEqual(true);
      expect(SqlQuery.parse(`SELECT a FROM t`).hasGroupBy()).toEqual(false);
    });
  });

  describe('#hasHaving', () => {
    it('tells if there is a HAVING clause', () => {
      expect(SqlQuery.parse(`SELECT a FROM t GROUP BY a HAVING COUNT(*) > 1`).hasHaving()).toEqual(
        true,
      );
      expect(SqlQuery.parse(`SELECT a FROM t GROUP BY a`).hasHaving()).toEqual(false);
    });
  });

  describe('#getEffectiveHavingExpression', () => {
    it('returns the HAVING expression or TRUE', () => {
      expect(
        String(
          SqlQuery.parse(
            `SELECT a FROM t GROUP BY a HAVING COUNT(*) > 1`,
          ).getEffectiveHavingExpression(),
        ),
      ).toEqual('COUNT(*) > 1');
      expect(SqlQuery.parse(`SELECT a FROM t`).getEffectiveHavingExpression()).toBe(
        SqlLiteral.TRUE,
      );
    });
  });

  describe('#changeOrderByClause', () => {
    it('removes the clause and its spacing', () => {
      expect(
        String(parseValues(`VALUES (1)   ORDER BY 1 LIMIT 1`).changeOrderByClause(undefined)),
      ).toEqual(`VALUES (1) LIMIT 1`);
    });
  });

  describe('#changeOrderByExpressions', () => {
    it('creates a clause', () => {
      expect(
        String(parseValues(`VALUES (1)`).changeOrderByExpressions([SqlOrderByExpression.index(0)])),
      ).toEqual(`VALUES (1)\nORDER BY 1`);
    });

    it('changes an existing clause', () => {
      expect(
        String(
          parseValues(`VALUES (1) ORDER BY 1`).changeOrderByExpressions([
            SqlOrderByExpression.index(0, 'DESC'),
          ]),
        ),
      ).toEqual(`VALUES (1) ORDER BY 1 DESC`);
    });

    it('removes the clause when given nothing', () => {
      const values = parseValues(`VALUES (1) ORDER BY 1`);

      expect(String(values.changeOrderByExpressions([]))).toEqual(`VALUES (1)`);
      expect(String(values.changeOrderByExpressions(undefined))).toEqual(`VALUES (1)`);
    });
  });

  describe('#changeOrderByExpression', () => {
    it('sets a single expression', () => {
      expect(
        String(parseValues(`VALUES (1)`).changeOrderByExpression(SqlOrderByExpression.index(0))),
      ).toEqual(`VALUES (1)\nORDER BY 1`);
    });

    it('removes the clause when given nothing', () => {
      expect(
        String(parseValues(`VALUES (1) ORDER BY 1`).changeOrderByExpression(undefined)),
      ).toEqual(`VALUES (1)`);
    });
  });

  describe('#hasOrderBy', () => {
    it('tells if there is an ORDER BY clause', () => {
      expect(parseValues(`VALUES (1) ORDER BY 1`).hasOrderBy()).toEqual(true);
      expect(parseValues(`VALUES (1)`).hasOrderBy()).toEqual(false);
    });
  });

  describe('#getOrderByExpressions', () => {
    it('returns the expressions', () => {
      expect(
        parseValues(`VALUES (1, 2) ORDER BY 1, 2 DESC`).getOrderByExpressions().map(String),
      ).toEqual(['1', '2 DESC']);
      expect(parseValues(`VALUES (1)`).getOrderByExpressions()).toEqual([]);
    });
  });

  describe('#getOrderByForExpression', () => {
    const query = SqlQuery.parse(`SELECT a, b FROM t ORDER BY b DESC`);

    it('finds the ORDER BY expression', () => {
      expect(String(query.getOrderByForExpression(SqlExpression.parse('b')))).toEqual('b DESC');
      expect(query.getOrderByForExpression(SqlExpression.parse('a'))).toBeUndefined();
    });

    it('returns nothing when there is no ORDER BY clause', () => {
      expect(
        query.changeOrderByClause(undefined).getOrderByForExpression(SqlExpression.parse('b')),
      ).toBeUndefined();
    });
  });

  describe('#getOrderByForSelectIndex', () => {
    const query = SqlQuery.parse(`SELECT a, b AS bb, c FROM t ORDER BY bb DESC, 1`);

    it('finds the ORDER BY expression by alias or by index', () => {
      expect(String(query.getOrderByForSelectIndex(0))).toEqual('1');
      expect(String(query.getOrderByForSelectIndex(1))).toEqual('bb DESC');
      expect(query.getOrderByForSelectIndex(2)).toBeUndefined();
    });

    it('returns nothing for an invalid index or without an ORDER BY clause', () => {
      expect(query.getOrderByForSelectIndex(3)).toBeUndefined();
      expect(SqlQuery.parse(`SELECT a FROM t`).getOrderByForSelectIndex(0)).toBeUndefined();
    });
  });

  describe('#getOrderedSelectExpressions', () => {
    it('lists the select expressions that are ordered on', () => {
      expect(
        SqlQuery.parse(`SELECT a, b AS bb, c FROM t ORDER BY bb DESC, 1`)
          .getOrderedSelectExpressions()
          .map(String),
      ).toEqual(['a', 'b AS bb']);
      expect(SqlQuery.parse(`SELECT a FROM t`).getOrderedSelectExpressions()).toEqual([]);
    });
  });

  describe('#addOrderBy', () => {
    it('creates the clause or adds to the front of it', () => {
      const values = parseValues(`VALUES (1, 2)`).addOrderBy(SqlOrderByExpression.index(0));

      expect(String(values)).toEqual(`VALUES (1, 2)\nORDER BY 1`);
      expect(String(values.addOrderBy(SqlOrderByExpression.index(1, 'DESC')))).toEqual(
        `VALUES (1, 2)\nORDER BY 2 DESC, 1`,
      );
    });
  });

  describe('#changeLimitClause', () => {
    it('sets and removes the clause', () => {
      const values = parseValues(`VALUES (1)`).changeLimitClause(SqlLimitClause.create(3));

      expect(String(values)).toEqual(`VALUES (1)\nLIMIT 3`);
      expect(String(values.changeLimitClause(undefined))).toEqual(`VALUES (1)`);
    });
  });

  describe('#getLimitValue', () => {
    it('returns the limit', () => {
      expect(parseValues(`VALUES (1) LIMIT 3`).getLimitValue()).toEqual(3);
      expect(parseValues(`VALUES (1)`).getLimitValue()).toBeUndefined();
    });

    it('reads the limit of a union from the last query', () => {
      expect(parseValues(`VALUES (1) UNION ALL VALUES (2) LIMIT 5`).getLimitValue()).toEqual(5);
    });
  });

  describe('#changeLimitValue', () => {
    it('changes the value of an existing clause', () => {
      expect(String(parseValues(`VALUES (1) LIMIT 3`).changeLimitValue(4))).toEqual(
        `VALUES (1) LIMIT 4`,
      );
    });

    it('accepts a literal', () => {
      expect(String(parseValues(`VALUES (1)`).changeLimitValue(SqlLiteral.create(7)))).toEqual(
        `VALUES (1)\nLIMIT 7`,
      );
    });

    it('puts the limit of a union after the last query', () => {
      expect(String(parseValues(`VALUES (1) UNION ALL VALUES (2)`).changeLimitValue(5))).toEqual(
        `VALUES (1) UNION ALL VALUES (2)\nLIMIT 5`,
      );
    });

    it('keeps a trailing comment before the new clause', () => {
      expect(String(parseValues(`VALUES (1) /* one row */`).changeLimitValue(10))).toEqual(
        `VALUES (1) /* one row */\nLIMIT 10`,
      );
    });
  });

  describe('#hasLimit', () => {
    it('tells if there is a LIMIT clause', () => {
      expect(parseValues(`VALUES (1) LIMIT 3`).hasLimit()).toEqual(true);
      expect(parseValues(`VALUES (1)`).hasLimit()).toEqual(false);
    });
  });

  describe('#combineWithLimitClause', () => {
    it('keeps the smaller of two limits', () => {
      const values = parseValues(`VALUES (1) LIMIT 3`);

      expect(values.combineWithLimitClause(SqlLimitClause.create(10)).getLimitValue()).toEqual(3);
      expect(values.combineWithLimitClause(SqlLimitClause.create(2)).getLimitValue()).toEqual(2);
    });

    it('uses the other clause when there is no limit', () => {
      expect(
        String(parseValues(`VALUES (1)`).combineWithLimitClause(SqlLimitClause.create(10))),
      ).toEqual(`VALUES (1)\nLIMIT 10`);
    });
  });

  describe('#changeOffsetClause', () => {
    it('sets and removes the clause', () => {
      const values = parseValues(`VALUES (1)`).changeOffsetClause(SqlOffsetClause.create(3));

      expect(String(values)).toEqual(`VALUES (1)\nOFFSET 3`);
      expect(String(values.changeOffsetClause(undefined))).toEqual(`VALUES (1)`);
    });

    it('returns the same instance when nothing changes', () => {
      const values = parseValues(`VALUES (1) OFFSET 1`);

      expect(values.changeOffsetClause(values.offsetClause)).toBe(values);
    });
  });

  describe('#getOffsetValue', () => {
    it('returns the offset', () => {
      expect(parseValues(`VALUES (1) OFFSET 3`).getOffsetValue()).toEqual(3);
      expect(parseValues(`VALUES (1)`).getOffsetValue()).toBeUndefined();
    });
  });

  describe('#changeOffsetValue', () => {
    it('creates a clause', () => {
      expect(String(parseValues(`VALUES (1)`).changeOffsetValue(5))).toEqual(
        `VALUES (1)\nOFFSET 5`,
      );
    });

    it('changes the value of an existing clause', () => {
      expect(String(parseValues(`VALUES (1) OFFSET 3`).changeOffsetValue(4))).toEqual(
        `VALUES (1) OFFSET 4`,
      );
    });

    it('removes the clause when given nothing', () => {
      expect(String(parseValues(`VALUES (1) OFFSET 3`).changeOffsetValue(undefined))).toEqual(
        `VALUES (1)`,
      );
    });
  });

  describe('#hasOffset', () => {
    it('tells if there is an OFFSET clause', () => {
      expect(parseValues(`VALUES (1) OFFSET 3`).hasOffset()).toEqual(true);
      expect(parseValues(`VALUES (1)`).hasOffset()).toEqual(false);
    });
  });

  describe('#combineWithOffsetClause', () => {
    it('adds the two offsets', () => {
      expect(
        parseValues(`VALUES (1) OFFSET 3`)
          .combineWithOffsetClause(SqlOffsetClause.create(4))
          .getOffsetValue(),
      ).toEqual(7);
    });

    it('uses the other clause when there is no offset', () => {
      expect(
        String(parseValues(`VALUES (1)`).combineWithOffsetClause(SqlOffsetClause.create(4))),
      ).toEqual(`VALUES (1)\nOFFSET 4`);
    });
  });

  describe('#changePartitionedByClause', () => {
    it('sets and removes the clause', () => {
      const values = parseValues(`INSERT INTO t VALUES (1)`).changePartitionedByClause(
        SqlPartitionedByClause.create(undefined),
      );

      expect(String(values)).toEqual(`INSERT INTO t VALUES (1)\nPARTITIONED BY ALL`);
      expect(values.changePartitionedByClause(values.partitionedByClause)).toBe(values);
      expect(String(values.changePartitionedByClause(undefined))).toEqual(
        `INSERT INTO t VALUES (1)`,
      );
    });
  });

  describe('#changeClusteredByClause', () => {
    it('sets and removes the clause', () => {
      const values = parseValues(`VALUES (1)`).changeClusteredByClause(
        SqlClusteredByClause.create([C('a')]),
      );

      expect(String(values)).toEqual(`VALUES (1)\nCLUSTERED BY "a"`);
      expect(String(values.changeClusteredByClause(undefined))).toEqual(`VALUES (1)`);
    });

    it('returns the same instance when nothing changes', () => {
      const values = parseValues(`VALUES (1) CLUSTERED BY a`);

      expect(values.changeClusteredByClause(values.clusteredByClause)).toBe(values);
    });
  });

  describe('#changeClusteredByExpressions', () => {
    it('creates a clause', () => {
      expect(String(parseValues(`VALUES (1)`).changeClusteredByExpressions([C('a')]))).toEqual(
        `VALUES (1)\nCLUSTERED BY "a"`,
      );
    });

    it('changes an existing clause', () => {
      expect(
        String(parseValues(`VALUES (1) CLUSTERED BY a`).changeClusteredByExpressions([C('b')])),
      ).toEqual(`VALUES (1) CLUSTERED BY "b"`);
    });

    it('removes the clause when given nothing', () => {
      const values = parseValues(`VALUES (1) CLUSTERED BY a`);

      expect(String(values.changeClusteredByExpressions([]))).toEqual(`VALUES (1)`);
      expect(String(values.changeClusteredByExpressions(undefined))).toEqual(`VALUES (1)`);
    });
  });

  describe('#changeUnionQuery', () => {
    it('sets a union query', () => {
      expect(String(parseValues(`VALUES (1)`).changeUnionQuery(SqlTableQuery.create('t')))).toEqual(
        `VALUES (1)\nUNION ALL TABLE "t"`,
      );
    });

    it('removes the union query with its keyword and spacing', () => {
      const values = parseValues(`VALUES (1)  union all  VALUES (2)`);

      expect(values.changeUnionQuery(values.unionQuery)).toBe(values);
      expect(String(values.changeUnionQuery(undefined))).toEqual(`VALUES (1)`);
    });
  });

  describe('construction', () => {
    it('does not allow both an INSERT and a REPLACE clause', () => {
      const values = parseValues(`VALUES (1)`);

      expect(
        () =>
          new SqlValues({
            ...values.valueOf(),
            insertClause: SqlInsertClause.create('t'),
            replaceClause: SqlReplaceClause.create('t'),
          }),
      ).toThrow('a query can not have both an insertClause and a replaceClause');
    });
  });

  describe('questions about each kind of query', () => {
    it('answers like SELECT * for TABLE and FROM', () => {
      for (const sql of ['TABLE t', 'FROM t']) {
        const query = SqlQueryBase.parse(sql);
        expect(query.hasStarInSelect()).toBe(true);
        expect(query.getOutputColumns()).toEqual(['EXPR$0']);
        expect(query.isRealOutputColumnAtSelectIndex(0)).toBe(false);
        expect(query.getEffectiveWhereExpression()).toBe(SqlLiteral.TRUE);
        expect(query.hasGroupBy()).toBe(false);
      }
    });

    it('answers with nothing when the output columns can not be told', () => {
      for (const sql of [
        'VALUES (1, 2)',
        'FROM t |> WHERE a = 1 |> AGGREGATE COUNT(*) GROUP BY b',
      ]) {
        const query = SqlQueryBase.parse(sql);
        expect(query.getSelectExpressionsArray()).toEqual([]);
        expect(query.getSelectExpressionForIndex(0)).toBeUndefined();
        expect(query.isValidSelectIndex(0)).toBe(false);
        expect(query.getOutputColumns()).toEqual([]);
        expect(query.getWhereExpression()).toBeUndefined();
        expect(query.getEffectiveWhereExpression()).toBe(SqlLiteral.TRUE);
        expect(query.getEffectiveHavingExpression()).toBe(SqlLiteral.TRUE);
        expect(query.hasGroupBy()).toBe(false);
        expect(query.getGroupingExpressions()).toEqual([]);
      }
    });

    it('answers for a WITH query from the query it wraps', () => {
      const query = SqlQueryBase.parse(sane`
        WITH x AS (SELECT * FROM t)
        (SELECT a, COUNT(*) AS c FROM x WHERE b = 1 GROUP BY 1 HAVING COUNT(*) > 1)
      `);

      expect(query).toBeInstanceOf(SqlWithQuery);
      expect(query.getOutputColumns()).toEqual(['a', 'c']);
      expect(String(query.getEffectiveWhereExpression())).toEqual('b = 1');
      expect(String(query.getEffectiveHavingExpression())).toEqual('COUNT(*) > 1');
      expect(query.isGroupedOutputColumn('a')).toBe(true);
      expect(query.isAggregateOutputColumn('c')).toBe(true);
      expect(query.getGroupingExpressions().map(String)).toEqual(['a']);
    });
  });
});
