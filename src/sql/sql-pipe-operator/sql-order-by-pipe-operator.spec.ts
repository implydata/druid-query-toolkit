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
  SqlExpression,
  SqlOrderByClause,
  SqlOrderByExpression,
  SqlOrderByPipeOperator,
} from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlOrderByPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlOrderByPipeOperator', () => {
  describe('parses', () => {
    it.each([`|> ORDER BY a`, `|> ORDER BY a DESC, b ASC`, `|> order  by a desc`])(
      'does back and forth with %s',
      sql => {
        backAndForthPipeOperator(sql, SqlOrderByPipeOperator);
      },
    );
  });

  describe('does not parse', () => {
    it('rejects a missing ordering', () => {
      expect(() => SqlExpression.parse(`FROM t |> ORDER BY`)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works with an expression', () => {
      expect(
        SqlOrderByPipeOperator.create(
          SqlOrderByExpression.create(SqlColumn.create('a'), 'DESC'),
        ).toString(),
      ).toEqual(`|> ORDER BY "a" DESC`);
    });

    it('works with a clause', () => {
      expect(
        SqlOrderByPipeOperator.create(
          SqlOrderByClause.create(SqlOrderByExpression.create(SqlColumn.create('a'))),
        ).toString(),
      ).toEqual(`|> ORDER BY "a"`);
    });
  });

  describe('#changeOrderByClause', () => {
    it('replaces the clause', () => {
      expect(
        parseOperator(`|> ORDER BY a`)
          .changeOrderByClause(
            SqlOrderByClause.create(SqlOrderByExpression.create(SqlColumn.create('b'))),
          )
          .toString(),
      ).toEqual(`|> ORDER BY "b"`);
    });
  });

  describe('#walk', () => {
    it('walks the ordering', () => {
      expect(
        parseOperator(`|> ORDER BY a DESC`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('b') : ex))
          .toString(),
      ).toEqual(`|> ORDER BY "b" DESC`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> ORDER BY a`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });

    it('returns the same operator when nothing changes', () => {
      const operator = parseOperator(`|> ORDER BY a`);

      expect(operator.walk(ex => ex)).toBe(operator);
    });
  });
});
