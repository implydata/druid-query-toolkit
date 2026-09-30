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

import type { SqlPipesQuery, SqlSetPipeOperator } from '../..';
import { SqlColumn, SqlColumnAssignment, SqlExpression, SqlLiteral } from '../..';

function parseAssignment(sql: string): SqlColumnAssignment {
  const query = SqlExpression.parse(`FROM t |> SET ${sql}`) as SqlPipesQuery;
  return (query.getLastPipeOperator() as SqlSetPipeOperator).assignments.first();
}

describe('SqlColumnAssignment', () => {
  describe('parses', () => {
    it.each([`a = 1`, `a=1`, `"a"  =  ROUND(a, 1)`, `a /* c */ = b + 1`])(
      'does back and forth with %s',
      sql => {
        const assignment = parseAssignment(sql);

        expect(assignment).toBeInstanceOf(SqlColumnAssignment);
        expect(assignment.toString()).toEqual(sql);
      },
    );
  });

  describe('.create', () => {
    it('works with a column name', () => {
      expect(SqlColumnAssignment.create('a', SqlLiteral.create(1)).toString()).toEqual(`a = 1`);
    });

    it('works with a column', () => {
      expect(
        SqlColumnAssignment.create(SqlColumn.create('a'), SqlLiteral.create(1)).toString(),
      ).toEqual(`"a" = 1`);
    });
  });

  describe('#getColumnName', () => {
    it('gets the column name', () => {
      expect(parseAssignment(`"a" = 1`).getColumnName()).toEqual('a');
    });
  });

  describe('#changeColumn', () => {
    it('keeps the spacing', () => {
      expect(parseAssignment(`a  =  1`).changeColumn(SqlColumn.create('b')).toString()).toEqual(
        `"b"  =  1`,
      );
    });
  });

  describe('#changeExpression', () => {
    it('keeps the spacing', () => {
      expect(parseAssignment(`a=1`).changeExpression(SqlLiteral.create(2)).toString()).toEqual(
        `a=2`,
      );
    });
  });

  describe('#walk', () => {
    it('walks the column and the expression', () => {
      expect(
        parseAssignment(`a = a + 1`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('b') : ex))
          .toString(),
      ).toEqual(`"b" = "b" + 1`);
    });

    it('throws when the column is replaced with something else', () => {
      expect(() =>
        parseAssignment(`a = 1`).walk(ex => (ex instanceof SqlColumn ? SqlLiteral.create(1) : ex)),
      ).toThrow('must return a sql column');
    });

    it('stops when the substitutor returns undefined', () => {
      const assignment = parseAssignment(`a = 1`);

      expect(assignment.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(assignment);
    });
  });
});
