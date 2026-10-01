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
import { SqlColumn, SqlExpression, SqlWhereClause, SqlWherePipeOperator } from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlWherePipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlWherePipeOperator', () => {
  describe('parses', () => {
    it.each([
      `|> WHERE a = 1`,
      `|> where  a > 1 AND b < 2`,
      `|> WHERE zscore > 3 AND daily_bytes > 1000000`,
      `|> WHERE a IN (FROM u |> SELECT a)`,
    ])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlWherePipeOperator);
    });
  });

  describe('does not parse', () => {
    it('rejects a missing condition', () => {
      expect(() => SqlExpression.parse(`FROM t |> WHERE`)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works with an expression', () => {
      expect(SqlWherePipeOperator.create(SqlColumn.create('a').equal(1)).toString()).toEqual(
        `|> WHERE "a" = 1`,
      );
    });

    it('works with a where clause', () => {
      expect(
        SqlWherePipeOperator.create(SqlWhereClause.create(SqlColumn.create('a'))).toString(),
      ).toEqual(`|> WHERE "a"`);
    });
  });

  describe('#changeWhereClause', () => {
    it('replaces the clause', () => {
      expect(
        parseOperator(`|> WHERE a`)
          .changeWhereClause(SqlWhereClause.create(SqlColumn.create('b')))
          .toString(),
      ).toEqual(`|> WHERE "b"`);
    });
  });

  describe('#getExpression', () => {
    it('gets the condition', () => {
      expect(String(parseOperator(`|> WHERE a = 1`).getExpression())).toEqual(`a = 1`);
    });
  });

  describe('#changeExpression', () => {
    it('keeps the keyword spacing', () => {
      expect(
        parseOperator(`|> where  a`).changeExpression(SqlColumn.create('b')).toString(),
      ).toEqual(`|> where  "b"`);
    });
  });

  describe('#walk', () => {
    it('walks the condition', () => {
      expect(
        parseOperator(`|> WHERE a = 1`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('b') : ex))
          .toString(),
      ).toEqual(`|> WHERE "b" = 1`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> WHERE a = 1`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });
  });
});
