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

import { backAndForth } from '../../../test-utils';
import { sane } from '../../../utils';
import {
  SeparatedArray,
  SqlAlias,
  SqlColumn,
  SqlExpression,
  SqlOrderByClause,
  SqlOrderByExpression,
  SqlQuery,
} from '../..';

function orderBy(sql: string): SqlOrderByClause {
  return SqlQuery.parse(`SELECT * FROM t ${sql}`).orderByClause!;
}

describe('SqlOrderByClause', () => {
  describe('parses', () => {
    it('round trips', () => {
      const queries: string[] = [
        'SELECT * FROM t ORDER BY x',
        'SELECT * FROM t order  by x DESC, 2 asc',
        'SELECT * FROM t ORDER BY /* c */ x ,y',
        'SELECT * FROM t ORDER BY x DESC LIMIT 5',
      ];

      for (const sql of queries) {
        try {
          backAndForth(sql, SqlQuery);
        } catch (e) {
          console.log(`Problem with: \`${sql}\``);
          throw e;
        }
      }
    });
  });

  describe('.create', () => {
    const x = SqlOrderByExpression.create(SqlColumn.create('x'), 'DESC');
    const y = SqlOrderByExpression.create(SqlColumn.create('y'));

    it('creates a clause from a single expression', () => {
      expect(SqlOrderByClause.create(x).toString()).toEqual('ORDER BY "x" DESC');
    });

    it('creates a clause from an array', () => {
      expect(SqlOrderByClause.create([x, y]).toString()).toEqual('ORDER BY "x" DESC, "y"');
    });

    it('creates a clause from a separated array', () => {
      expect(SqlOrderByClause.create(SeparatedArray.fromArray([y, x])).toString()).toEqual(
        'ORDER BY "y", "x" DESC',
      );
    });
  });

  describe('#changeExpressions', () => {
    it('replaces the expressions and keeps the keyword', () => {
      expect(
        orderBy('order by x')
          .changeExpressions([SqlOrderByExpression.index(0, 'ASC')])
          .toString(),
      ).toEqual('order by 1 ASC');
    });
  });

  describe('#addExpression', () => {
    const z = SqlOrderByExpression.create(SqlColumn.create('z'), 'DESC');

    it('adds at the end by default', () => {
      expect(orderBy('ORDER BY x').addExpression(z).toString()).toEqual('ORDER BY x, "z" DESC');
    });

    it('adds at the start', () => {
      expect(orderBy('ORDER BY x').addExpression(z, 'start').toString()).toEqual(
        'ORDER BY "z" DESC, x',
      );
    });
  });

  describe('#_walkInner', () => {
    it('substitutes inner expressions', () => {
      expect(
        orderBy('ORDER BY x DESC, 2')
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('y') : ex))
          .toString(),
      ).toEqual('ORDER BY "y" DESC, 2');
    });

    it('returns the same instance when nothing changes', () => {
      const clause = orderBy('ORDER BY x DESC, 2');
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('stops when the walker returns undefined', () => {
      const clause = orderBy('ORDER BY x DESC, 2');
      expect(clause.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(clause);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('resets the separators between expressions', () => {
      expect(orderBy('ORDER BY x  ,y DESC').clearOwnSeparators().toString()).toEqual(
        'ORDER BY x, y DESC',
      );
    });
  });

  describe('#toArray', () => {
    it('returns the order by expressions', () => {
      expect(orderBy('ORDER BY x, 2 DESC').toArray().map(String)).toEqual(['x', '2 DESC']);
    });
  });

  describe('#addFirst', () => {
    it('prepends an expression', () => {
      expect(
        orderBy('ORDER BY x').addFirst(SqlOrderByExpression.index(2, 'DESC')).toString(),
      ).toEqual('ORDER BY 3 DESC, x');
    });
  });

  describe('#removeExpression', () => {
    const clause = orderBy('ORDER BY 1 DESC, b, 3, 4 ASC');

    it('removes the matching index and shifts the later ones down', () => {
      expect(clause.removeExpression(SqlColumn.create('zzz'), 2)?.toString()).toEqual(
        'ORDER BY 1 DESC, b, 3 ASC',
      );
    });

    it('leaves indexes below the removed one alone', () => {
      expect(clause.removeExpression(SqlColumn.create('zzz'), 3)?.toString()).toEqual(
        'ORDER BY 1 DESC, b, 3',
      );
    });

    it('removes an expression equal to the underlying select expression', () => {
      const selectExpression = SqlAlias.create(SqlExpression.parse('b'), 'B');
      expect(clause.removeExpression(selectExpression, 1)?.toString()).toEqual(
        'ORDER BY 1 DESC, 2, 3 ASC',
      );
    });

    it('returns undefined when everything is removed', () => {
      expect(orderBy('ORDER BY 1').removeExpression(SqlColumn.create('a'), 0)).toBeUndefined();
    });
  });

  describe('#shiftIndexes', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        isAnonymous,
        COUNT(*) AS "Count",
        SUM(added) AS "sum_added",
        SUM(deleted) AS "sum_deleted"
      FROM wikipedia
      GROUP BY 1
      ORDER BY 2 DESC, 3, 4 ASC
    `);

    it('works', () => {
      expect(sql.orderByClause!.shiftIndexes(0).toString()).toEqual(`ORDER BY 3 DESC, 4, 5 ASC`);
      expect(sql.orderByClause!.shiftIndexes(1).toString()).toEqual(`ORDER BY 3 DESC, 4, 5 ASC`);
      expect(sql.orderByClause!.shiftIndexes(2).toString()).toEqual(`ORDER BY 2 DESC, 4, 5 ASC`);
      expect(sql.orderByClause!.shiftIndexes(3).toString()).toEqual(`ORDER BY 2 DESC, 3, 5 ASC`);
      expect(sql.orderByClause!.shiftIndexes(4).toString()).toEqual(`ORDER BY 2 DESC, 3, 4 ASC`);
    });

    it('leaves non index expressions alone', () => {
      expect(orderBy('ORDER BY x DESC, 1').shiftIndexes(0).toString()).toEqual(
        'ORDER BY x DESC, 2',
      );
    });
  });
});
