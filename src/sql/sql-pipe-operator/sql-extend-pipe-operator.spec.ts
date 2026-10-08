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
import { SqlColumn, SqlExpression, SqlExtendPipeOperator } from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlExtendPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlExtendPipeOperator', () => {
  describe('parses', () => {
    it.each([
      `|> EXTEND a + 1 AS b`,
      `|> EXTEND a + 1 b`,
      `|> extend  LOWER(a) AS la ,  UPPER(a) AS ua`,
      `|> EXTEND\n  TIME_FLOOR(__time, 'PT5M') AS bucket_start,\n  a AS b`,
    ])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlExtendPipeOperator);
    });
  });

  describe('does not parse', () => {
    it('rejects an empty list', () => {
      expect(() => SqlExpression.parse(`FROM t |> EXTEND`)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works', () => {
      expect(SqlExtendPipeOperator.create([SqlColumn.create('a').as('b')]).toString()).toEqual(
        `|> EXTEND "a" AS "b"`,
      );
    });
  });

  describe('#changeExpressions', () => {
    it('replaces the expressions', () => {
      expect(
        parseOperator(`|> EXTEND a AS b`)
          .changeExpressions([SqlColumn.create('c').as('d')])
          .toString(),
      ).toEqual(`|> EXTEND "c" AS "d"`);
    });
  });

  describe('#walk', () => {
    it('walks the expressions', () => {
      expect(
        parseOperator(`|> EXTEND a + 1 AS b`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('c') : ex))
          .toString(),
      ).toEqual(`|> EXTEND "c" + 1 AS b`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> EXTEND a + 1 AS b`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });

    it('returns the same operator when nothing changes', () => {
      const operator = parseOperator(`|> EXTEND a + 1 AS b`);

      expect(operator.walk(ex => ex)).toBe(operator);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('clears the list separators', () => {
      expect(parseOperator(`|> EXTEND a AS x ,b AS y`).clearOwnSeparators().toString()).toEqual(
        `|> EXTEND a AS x,\n  b AS y`,
      );
    });
  });
});
