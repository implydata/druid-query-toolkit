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

import { SeparatedArray, SqlColumn, SqlLiteral, SqlPartitionByClause } from '../../..';

describe('SqlPartitionByClause', () => {
  describe('.create', () => {
    it('creates a PARTITION BY clause from a single expression', () => {
      const column = SqlColumn.create('x');

      const partitionByClause = SqlPartitionByClause.create([column]);

      expect(partitionByClause).toBeInstanceOf(SqlPartitionByClause);
      expect(partitionByClause.toString()).toEqual(`PARTITION BY "x"`);
    });

    it('creates a PARTITION BY clause from multiple expressions', () => {
      const column1 = SqlColumn.create('x');
      const column2 = SqlColumn.create('y');

      const partitionByClause = SqlPartitionByClause.create([column1, column2]);

      expect(partitionByClause).toBeInstanceOf(SqlPartitionByClause);
      expect(partitionByClause.toString()).toEqual(`PARTITION BY "x", "y"`);
    });

    it('accepts a SeparatedArray of expressions', () => {
      const column1 = SqlColumn.create('x');
      const column2 = SqlColumn.create('y');
      const separatedArray = SeparatedArray.fromArray([column1, column2]);

      const partitionByClause = SqlPartitionByClause.create(separatedArray);

      expect(partitionByClause).toBeInstanceOf(SqlPartitionByClause);
      expect(partitionByClause.toString()).toEqual(`PARTITION BY "x", "y"`);
    });

    it('works with mixed expression types including literals', () => {
      const column = SqlColumn.create('x');
      const literal = SqlLiteral.create(123);

      const partitionByClause = SqlPartitionByClause.create([column, literal]);

      expect(partitionByClause).toBeInstanceOf(SqlPartitionByClause);
      expect(partitionByClause.toString()).toEqual(`PARTITION BY "x", 123`);
    });
  });

  describe('#changeExpressions', () => {
    it('returns a new instance with updated expressions', () => {
      const column = SqlColumn.create('x');
      const partitionByClause = SqlPartitionByClause.create([column]);

      const newColumn = SqlColumn.create('y');
      const updatedClause = partitionByClause.changeExpressions([newColumn]);

      expect(updatedClause).toBeInstanceOf(SqlPartitionByClause);
      expect(updatedClause.toString()).toEqual(`PARTITION BY "y"`);
      expect(updatedClause).not.toBe(partitionByClause);
    });

    it('accepts both arrays and SeparatedArrays', () => {
      const partitionByClause = SqlPartitionByClause.create([SqlColumn.create('x')]);

      const newColumn = SqlColumn.create('y');
      const withArray = partitionByClause.changeExpressions([newColumn]);
      const withSeparatedArray = partitionByClause.changeExpressions(
        SeparatedArray.fromSingleValue(newColumn),
      );

      expect(withArray.toString()).toEqual(`PARTITION BY "y"`);
      expect(withSeparatedArray.toString()).toEqual(`PARTITION BY "y"`);
    });

    it('changes multiple expressions to a single expression', () => {
      const column1 = SqlColumn.create('x');
      const column2 = SqlColumn.create('y');
      const partitionByClause = SqlPartitionByClause.create([column1, column2]);

      const newColumn = SqlColumn.create('z');
      const updatedClause = partitionByClause.changeExpressions([newColumn]);

      expect(updatedClause.toString()).toEqual(`PARTITION BY "z"`);
    });

    it('changes a single expression to multiple expressions', () => {
      const column = SqlColumn.create('x');
      const partitionByClause = SqlPartitionByClause.create([column]);

      const newColumn1 = SqlColumn.create('y');
      const newColumn2 = SqlColumn.create('z');
      const updatedClause = partitionByClause.changeExpressions([newColumn1, newColumn2]);

      expect(updatedClause.toString()).toEqual(`PARTITION BY "y", "z"`);
    });
  });
});
