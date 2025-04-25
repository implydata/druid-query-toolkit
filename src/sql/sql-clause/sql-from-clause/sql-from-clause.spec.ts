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

import {
  SeparatedArray,
  SqlExpression,
  SqlFromClause,
  SqlJoinPart,
  SqlQuery,
  SqlTable,
} from '../../..';

describe('SqlFromClause', () => {
  describe('.create', () => {
    it('creates a new SqlFromClause from a single table', () => {
      const table = SqlTable.create('tbl');

      const fromClause = SqlFromClause.create([table]);

      expect(fromClause).toBeInstanceOf(SqlFromClause);
      expect(fromClause.toString()).toEqual('FROM "tbl"');
    });

    it('creates a new SqlFromClause from multiple tables', () => {
      const table1 = SqlTable.create('tbl1');
      const table2 = SqlTable.create('tbl2');

      const fromClause = SqlFromClause.create([table1, table2]);

      expect(fromClause.toString()).toEqual('FROM "tbl1", "tbl2"');
    });

    it('wraps SqlQuery expressions in parentheses', () => {
      const query = SqlQuery.create('inner_table');

      const fromClause = SqlFromClause.create([query]);

      const result = fromClause.toString();
      expect(result).toContain('FROM (');
      // The exact formatting of the nested query depends on the QueryStyle,
      // so we just check for the key components
      expect(result).toContain('SELECT');
      expect(result).toContain('FROM');
      expect(result).toContain('inner_table');
      expect(result).toContain(')');
    });

    it('accepts a SeparatedArray of expressions', () => {
      const table1 = SqlTable.create('tbl1');
      const table2 = SqlTable.create('tbl2');
      const separatedArray = SeparatedArray.fromArray([table1, table2]);

      const fromClause = SqlFromClause.create(separatedArray);

      expect(fromClause.toString()).toEqual('FROM "tbl1", "tbl2"');
    });
  });

  describe('#changeExpressions', () => {
    it('returns a new instance with updated expressions', () => {
      const originalTable = SqlTable.create('original');
      const fromClause = SqlFromClause.create([originalTable]);

      const newTable = SqlTable.create('new');
      const updatedFromClause = fromClause.changeExpressions([newTable]);

      expect(updatedFromClause.toString()).toEqual('FROM "new"');
      expect(updatedFromClause).not.toBe(fromClause);
    });

    it('accepts both arrays and SeparatedArrays', () => {
      const fromClause = SqlFromClause.create([SqlTable.create('tbl1')]);

      const newTable = SqlTable.create('tbl2');
      const withArray = fromClause.changeExpressions([newTable]);
      const withSeparatedArray = fromClause.changeExpressions(
        SeparatedArray.fromSingleValue(newTable),
      );

      expect(withArray.toString()).toEqual('FROM "tbl2"');
      expect(withSeparatedArray.toString()).toEqual('FROM "tbl2"');
    });
  });

  describe('#changeJoinParts', () => {
    it('adds JOIN parts to the FROM clause', () => {
      const fromClause = SqlFromClause.create([SqlTable.create('tbl1')]);

      const joinPart = SqlJoinPart.create(
        'INNER',
        SqlTable.create('tbl2'),
        SqlExpression.parse('tbl1.id = tbl2.id'),
      );

      const withJoin = fromClause.changeJoinParts([joinPart]);

      expect(withJoin.toString()).toContain('FROM "tbl1"');
      expect(withJoin.toString()).toContain('INNER JOIN "tbl2" ON tbl1.id = tbl2.id');
    });

    it('removes all JOIN parts when undefined is passed', () => {
      const fromClause = SqlFromClause.create([SqlTable.create('tbl1')]);

      const joinPart = SqlJoinPart.create(
        'INNER',
        SqlTable.create('tbl2'),
        SqlExpression.parse('tbl1.id = tbl2.id'),
      );

      const withJoin = fromClause.changeJoinParts([joinPart]);
      const withoutJoin = withJoin.changeJoinParts(undefined);

      expect(withoutJoin.toString()).toEqual('FROM "tbl1"');
      expect(withoutJoin.hasJoin()).toBe(false);
    });
  });

  describe('#addJoin', () => {
    it('adds a join to an existing FROM clause without joins', () => {
      const fromClause = SqlFromClause.create([SqlTable.create('tbl1')]);

      const joinPart = SqlJoinPart.create(
        'LEFT',
        SqlTable.create('tbl2'),
        SqlExpression.parse('tbl1.id = tbl2.id'),
      );

      const withJoin = fromClause.addJoin(joinPart);

      expect(withJoin.toString()).toContain('FROM "tbl1"');
      expect(withJoin.toString()).toContain('LEFT JOIN "tbl2" ON tbl1.id = tbl2.id');
      expect(withJoin.hasJoin()).toBe(true);
    });

    it('adds a join to a FROM clause that already has joins', () => {
      const fromClause = SqlFromClause.create([SqlTable.create('tbl1')]);

      const firstJoin = SqlJoinPart.create(
        'LEFT',
        SqlTable.create('tbl2'),
        SqlExpression.parse('tbl1.id = tbl2.id'),
      );

      const secondJoin = SqlJoinPart.create(
        'RIGHT',
        SqlTable.create('tbl3'),
        SqlExpression.parse('tbl1.id = tbl3.id'),
      );

      const withBothJoins = fromClause.addJoin(firstJoin).addJoin(secondJoin);

      expect(withBothJoins.toString()).toContain('FROM "tbl1"');
      expect(withBothJoins.toString()).toContain('LEFT JOIN "tbl2" ON tbl1.id = tbl2.id');
      expect(withBothJoins.toString()).toContain('RIGHT JOIN "tbl3" ON tbl1.id = tbl3.id');
      expect(withBothJoins.getJoins().length).toBe(2);
    });
  });

  describe('#removeAllJoins', () => {
    it('removes all joins from a FROM clause', () => {
      const fromClause = SqlFromClause.create([SqlTable.create('tbl1')]);

      const joinPart = SqlJoinPart.create(
        'INNER',
        SqlTable.create('tbl2'),
        SqlExpression.parse('tbl1.id = tbl2.id'),
      );

      const withJoin = fromClause.addJoin(joinPart);
      const withoutJoin = withJoin.removeAllJoins();

      expect(withoutJoin.toString()).toEqual('FROM "tbl1"');
      expect(withoutJoin.hasJoin()).toBe(false);
      expect(withoutJoin.getJoins().length).toBe(0);
    });
  });
});
