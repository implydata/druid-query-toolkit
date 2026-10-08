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
import { SqlColumn, SqlDropPipeOperator, SqlExpression } from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlDropPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlDropPipeOperator', () => {
  describe('parses', () => {
    it.each([`|> DROP a`, `|> DROP a, "b c", t.d`, `|> drop  a ,b`])(
      'does back and forth with %s',
      sql => {
        backAndForthPipeOperator(sql, SqlDropPipeOperator);
      },
    );
  });

  describe('does not parse', () => {
    it.each([`FROM t |> DROP`, `FROM t |> DROP a + 1`, `FROM t |> DROP a AS b`])(
      'rejects %s',
      sql => {
        expect(() => SqlExpression.parse(sql)).toThrow('Expected');
      },
    );
  });

  describe('.create', () => {
    it('works', () => {
      expect(
        SqlDropPipeOperator.create([
          SqlColumn.create('a'),
          SqlColumn.optionalQuotes('b'),
        ]).toString(),
      ).toEqual(`|> DROP "a", b`);
    });
  });

  describe('#changeColumns', () => {
    it('replaces the columns', () => {
      expect(
        parseOperator(`|> DROP a`)
          .changeColumns([SqlColumn.optionalQuotes('b')])
          .toString(),
      ).toEqual(`|> DROP b`);
    });
  });

  describe('#walk', () => {
    it('walks the columns', () => {
      expect(
        parseOperator(`|> DROP a, b`)
          .walk(ex =>
            ex instanceof SqlColumn && ex.getName() === 'b' ? SqlColumn.create('c') : ex,
          )
          .toString(),
      ).toEqual(`|> DROP a, "c"`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> DROP a, b`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });

    it('returns the same operator when nothing changes', () => {
      const operator = parseOperator(`|> DROP a, b`);

      expect(operator.walk(ex => ex)).toBe(operator);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('clears the list separators', () => {
      expect(parseOperator(`|> DROP a ,b`).clearOwnSeparators().toString()).toEqual(`|> DROP a, b`);
    });
  });
});
