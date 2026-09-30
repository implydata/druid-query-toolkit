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
  SqlGroupByClause,
  SqlLiteral,
  SqlQuery,
} from '../..';

function groupBy(sql: string): SqlGroupByClause {
  return SqlQuery.parse(`SELECT * FROM t ${sql}`).groupByClause!;
}

describe('SqlGroupByClause', () => {
  describe('parses', () => {
    it('round trips the plain and decorated forms', () => {
      const queries: string[] = [
        'SELECT a FROM t GROUP BY a',
        'SELECT a FROM t group  by a ,b',
        'SELECT a FROM t GROUP BY 1, 2',
        'SELECT a FROM t GROUP BY ()',
        'SELECT a FROM t GROUP BY (  )',
        'SELECT a FROM t GROUP BY ( a, b )',
        'SELECT a FROM t GROUP BY ROLLUP (a, b)',
        'SELECT a FROM t GROUP BY cube(a,b)',
        'SELECT a FROM t GROUP BY GROUPING SETS ((a, b), (a), ())',
        'SELECT a FROM t GROUP BY grouping  sets ( (a), () )',
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

    it('normalizes the decorator', () => {
      expect(groupBy('GROUP BY rollup (a)').decorator).toEqual('ROLLUP');
      expect(groupBy('GROUP BY Cube (a)').decorator).toEqual('CUBE');
      expect(groupBy('GROUP BY grouping  sets ((a))').decorator).toEqual('GROUPING SETS');
      expect(groupBy('GROUP BY a').decorator).toBeUndefined();
    });

    it('tracks inner parens and empty groupings', () => {
      expect(groupBy('GROUP BY a').innerParens).toEqual(false);
      expect(groupBy('GROUP BY (a)').innerParens).toEqual(true);

      const empty = groupBy('GROUP BY ()');
      expect(empty.innerParens).toEqual(false);
      expect(empty.expressions).toBeUndefined();
    });
  });

  describe('.create', () => {
    it('creates a clause from an array', () => {
      expect(
        SqlGroupByClause.create([SqlColumn.create('a'), SqlLiteral.index(1)]).toString(),
      ).toEqual('GROUP BY "a", 2');
    });

    it('creates a clause from a separated array', () => {
      expect(
        SqlGroupByClause.create(
          SeparatedArray.fromArray([SqlColumn.create('a'), SqlColumn.create('b')]),
        ).toString(),
      ).toEqual('GROUP BY "a", "b"');
    });

    it('creates an empty grouping when there are no expressions', () => {
      expect(SqlGroupByClause.create([]).toString()).toEqual('GROUP BY ()');
      expect(SqlGroupByClause.create().toString()).toEqual('GROUP BY ()');
      expect(SqlGroupByClause.create().expressions).toBeUndefined();
    });
  });

  describe('#valueOf', () => {
    it('includes innerParens only when set', () => {
      expect(groupBy('GROUP BY (a)').valueOf().innerParens).toEqual(true);
      expect('innerParens' in groupBy('GROUP BY a').valueOf()).toEqual(false);
    });
  });

  describe('#changeExpressions', () => {
    it('replaces the expressions', () => {
      expect(
        groupBy('GROUP BY a')
          .changeExpressions([SqlColumn.create('x'), SqlColumn.create('y')])
          .toString(),
      ).toEqual('GROUP BY "x", "y"');
    });

    it('keeps the decorator and inner parens', () => {
      expect(
        groupBy('group by ROLLUP ( a )')
          .changeExpressions([SqlColumn.create('x')])
          .toString(),
      ).toEqual('group by ROLLUP ( "x" )');
    });

    it('drops the expressions and inner parens when given nothing', () => {
      const clause = groupBy('GROUP BY (a, b)');

      const emptied = clause.changeExpressions([]);
      expect(emptied.toString()).toEqual('GROUP BY ()');
      expect(emptied.expressions).toBeUndefined();
      expect(emptied.innerParens).toEqual(false);

      expect(clause.changeExpressions(undefined).toString()).toEqual('GROUP BY ()');
    });
  });

  describe('#changeInnerParens', () => {
    it('adds and removes the inner parens', () => {
      const clause = groupBy('GROUP BY a, b');

      const withParens = clause.changeInnerParens(true);
      expect(withParens.toString()).toEqual('GROUP BY (a, b)');

      const withoutParens = withParens.changeInnerParens(false);
      expect(withoutParens.toString()).toEqual('GROUP BY a, b');
      expect(withoutParens.innerParens).toEqual(false);
    });
  });

  describe('#addExpression', () => {
    it('adds at the end by default', () => {
      expect(groupBy('GROUP BY a').addExpression(SqlColumn.create('b')).toString()).toEqual(
        'GROUP BY a, "b"',
      );
    });

    it('adds at the start', () => {
      expect(
        groupBy('GROUP BY a').addExpression(SqlColumn.create('b'), 'start').toString(),
      ).toEqual('GROUP BY "b", a');
    });

    it('fills an empty grouping', () => {
      expect(groupBy('GROUP BY ()').addExpression(SqlColumn.create('b')).toString()).toEqual(
        'GROUP BY "b"',
      );
    });
  });

  describe('#_walkInner', () => {
    it('substitutes inner expressions', () => {
      const clause = groupBy('GROUP BY a, 2');

      expect(
        clause
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create(ex.getName() + '_x') : ex))
          .toString(),
      ).toEqual('GROUP BY "a_x", 2');
    });

    it('returns the same instance when nothing changes', () => {
      const clause = groupBy('GROUP BY a, 2');
      expect(clause.walk(ex => ex)).toBe(clause);

      const empty = groupBy('GROUP BY ()');
      expect(empty.walk(ex => ex)).toBe(empty);
    });

    it('stops when the walker returns undefined', () => {
      const clause = groupBy('GROUP BY a, b');
      expect(clause.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(clause);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('resets the separators between expressions', () => {
      expect(groupBy('GROUP BY a  ,b').clearOwnSeparators().toString()).toEqual('GROUP BY a, b');
    });

    it('returns the same instance when there are no expressions', () => {
      const empty = groupBy('GROUP BY ()');
      expect(empty.clearOwnSeparators()).toBe(empty);
    });
  });

  describe('#toArray', () => {
    it('returns the expressions', () => {
      expect(groupBy('GROUP BY a, 2').toArray().map(String)).toEqual(['a', '2']);
    });

    it('returns an empty array for an empty grouping', () => {
      expect(groupBy('GROUP BY ()').toArray()).toEqual([]);
    });
  });

  describe('#removeExpression', () => {
    const clause = groupBy('GROUP BY 1, b, 3, 4');

    it('removes the matching index and shifts the later ones down', () => {
      expect(clause.removeExpression(SqlColumn.create('zzz'), 2).toString()).toEqual(
        'GROUP BY 1, b, 3',
      );
    });

    it('leaves indexes below the removed one alone', () => {
      expect(clause.removeExpression(SqlColumn.create('zzz'), 3).toString()).toEqual(
        'GROUP BY 1, b, 3',
      );
    });

    it('removes an expression equal to the underlying select expression', () => {
      const selectExpression = SqlAlias.create(SqlExpression.parse('b'), 'B');
      expect(clause.removeExpression(selectExpression, 1).toString()).toEqual('GROUP BY 1, 2, 3');
    });

    it('becomes an empty grouping when everything is removed', () => {
      expect(groupBy('GROUP BY 1').removeExpression(SqlColumn.create('a'), 0).toString()).toEqual(
        'GROUP BY ()',
      );
    });

    it('returns the same instance when there are no expressions', () => {
      const empty = groupBy('GROUP BY ()');
      expect(empty.removeExpression(SqlColumn.create('a'), 0)).toBe(empty);
    });
  });

  describe('#shiftIndexes', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        COUNT(*) AS "Count",
        isAnonymous,
        cityName,
        flags,
        SUM(added) AS "sum_added"
      FROM wikipedia
      GROUP BY 2, 3, 4
      ORDER BY 4 DESC
    `);

    it('works', () => {
      expect(sql.groupByClause!.shiftIndexes(0).toString()).toEqual(`GROUP BY 3, 4, 5`);
      expect(sql.groupByClause!.shiftIndexes(1).toString()).toEqual(`GROUP BY 3, 4, 5`);
      expect(sql.groupByClause!.shiftIndexes(2).toString()).toEqual(`GROUP BY 2, 4, 5`);
      expect(sql.groupByClause!.shiftIndexes(3).toString()).toEqual(`GROUP BY 2, 3, 5`);
      expect(sql.groupByClause!.shiftIndexes(4).toString()).toEqual(`GROUP BY 2, 3, 4`);
      expect(sql.groupByClause!.shiftIndexes(5).toString()).toEqual(`GROUP BY 2, 3, 4`);
    });

    it('leaves non index expressions alone', () => {
      expect(groupBy('GROUP BY a, 1').shiftIndexes(0).toString()).toEqual('GROUP BY a, 2');
    });

    it('returns the same instance when there are no expressions', () => {
      const empty = groupBy('GROUP BY ()');
      expect(empty.shiftIndexes(0)).toBe(empty);
    });
  });
});
