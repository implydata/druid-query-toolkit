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
  SqlQuery,
  SqlReplaceClause,
  SqlSetStatement,
  SqlTable,
  SqlTableQuery,
  SqlValues,
} from '../..';
import { sane } from '../../utils';

import type { SqlQueryBase } from './sql-query-base';

function parseValues(sql: string): SqlValues {
  const parsed = SqlExpression.parse(sql);
  if (!(parsed instanceof SqlValues)) throw new Error(`not VALUES: ${sql}`);
  return parsed;
}

describe('SqlQueryBase', () => {
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
});
