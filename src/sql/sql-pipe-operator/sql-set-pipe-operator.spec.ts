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

import type { SqlPipesQuery } from '../..';
import {
  SqlColumn,
  SqlColumnAssignment,
  SqlExpression,
  SqlLiteral,
  SqlSetPipeOperator,
} from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlSetPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlSetPipeOperator', () => {
  describe('parses', () => {
    it.each([
      `|> SET a = 1`,
      `|> SET a = ROUND(a, 1), b = ROUND(b)`,
      `|> set  a=1 ,b=2`,
      `|> SET\n  a = ROUND(a, 1),\n  b = ROUND(b, 1)`,
    ])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlSetPipeOperator);
    });
  });

  describe('does not parse', () => {
    it.each([`FROM t |> SET`, `FROM t |> SET a`, `FROM t |> SET 1 = a`])('rejects %s', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works', () => {
      expect(
        SqlSetPipeOperator.create([
          SqlColumnAssignment.create('a', SqlLiteral.create(1)),
        ]).toString(),
      ).toEqual(`|> SET a = 1`);
    });
  });

  describe('#changeAssignments', () => {
    it('replaces the assignments', () => {
      expect(
        parseOperator(`|> SET a = 1`)
          .changeAssignments([SqlColumnAssignment.create('b', SqlLiteral.create(2))])
          .toString(),
      ).toEqual(`|> SET b = 2`);
    });
  });

  describe('#walk', () => {
    it('walks the assignments', () => {
      expect(
        parseOperator(`|> SET a = a + 1`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('b') : ex))
          .toString(),
      ).toEqual(`|> SET "b" = "b" + 1`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> SET a = a + 1`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });

    it('returns the same operator when nothing changes', () => {
      const operator = parseOperator(`|> SET a = a + 1`);

      expect(operator.walk(ex => ex)).toBe(operator);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('clears the list separators', () => {
      expect(parseOperator(`|> SET a = 1 ,b = 2`).clearOwnSeparators().toString()).toEqual(
        `|> SET a = 1,\n  b = 2`,
      );
    });
  });
});
