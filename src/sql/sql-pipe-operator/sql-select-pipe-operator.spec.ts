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
import { SqlColumn, SqlExpression, SqlSelectPipeOperator, SqlStar } from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlSelectPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlSelectPipeOperator', () => {
  describe('parses', () => {
    it.each([
      `|> SELECT *`,
      `|> SELECT a`,
      `|> SELECT a, b AS c, t.*`,
      `|> select  a ,b`,
      `|>SELECT a + 1 AS x`,
      `|> SELECT\n  a,\n  b`,
    ])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlSelectPipeOperator);
    });
  });

  describe('does not parse', () => {
    it('rejects an empty select list', () => {
      expect(() => SqlExpression.parse(`FROM t |> SELECT`)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works', () => {
      expect(
        SqlSelectPipeOperator.create([SqlStar.PLAIN, SqlColumn.create('a').as('b')]).toString(),
      ).toEqual(`|> SELECT\n  *,\n  "a" AS "b"`);
    });
  });

  describe('#changeSelectExpressions', () => {
    it('keeps the keyword spacing', () => {
      expect(
        parseOperator(`|> select  a`)
          .changeSelectExpressions([SqlColumn.create('b')])
          .toString(),
      ).toEqual(`|> select  "b"`);
    });
  });

  describe('#walk', () => {
    it('walks the select expressions', () => {
      expect(
        parseOperator(`|> SELECT a, b`)
          .walk(ex =>
            ex instanceof SqlColumn && ex.getName() === 'a' ? SqlColumn.create('c') : ex,
          )
          .toString(),
      ).toEqual(`|> SELECT "c", b`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> SELECT a`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('clears the list separators', () => {
      expect(parseOperator(`|> SELECT a ,b`).clearOwnSeparators().toString()).toEqual(
        `|> SELECT a,\n  b`,
      );
    });
  });
});
