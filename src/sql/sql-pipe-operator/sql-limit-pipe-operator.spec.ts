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
  SqlExpression,
  SqlLimitClause,
  SqlLimitPipeOperator,
  SqlLiteral,
  SqlOffsetClause,
} from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlLimitPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlLimitPipeOperator', () => {
  describe('parses', () => {
    it.each([`|> LIMIT 10`, `|> LIMIT 10 OFFSET 5`, `|> limit  10  offset 5`])(
      'does back and forth with %s',
      sql => {
        backAndForthPipeOperator(sql, SqlLimitPipeOperator);
      },
    );
  });

  describe('does not parse', () => {
    it.each([`FROM t |> LIMIT`, `FROM t |> OFFSET 5`, `FROM t |> LIMIT a`])('rejects %s', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works with numbers', () => {
      expect(SqlLimitPipeOperator.create(10).toString()).toEqual(`|> LIMIT 10`);
      expect(SqlLimitPipeOperator.create(10, 5).toString()).toEqual(`|> LIMIT 10 OFFSET 5`);
    });

    it('works with clauses', () => {
      expect(
        SqlLimitPipeOperator.create(SqlLimitClause.create(3), SqlOffsetClause.create(1)).toString(),
      ).toEqual(`|> LIMIT 3 OFFSET 1`);
    });
  });

  describe('#changeLimitClause', () => {
    it('keeps the offset', () => {
      expect(
        parseOperator(`|> LIMIT 10 OFFSET 5`)
          .changeLimitClause(SqlLimitClause.create(3))
          .toString(),
      ).toEqual(`|> LIMIT 3 OFFSET 5`);
    });
  });

  describe('#getLimitValue', () => {
    it('gets the limit', () => {
      expect(parseOperator(`|> LIMIT 10`).getLimitValue()).toEqual(10);
    });
  });

  describe('#changeOffsetClause', () => {
    it('adds an offset', () => {
      expect(
        parseOperator(`|> LIMIT 10`).changeOffsetClause(SqlOffsetClause.create(2)).toString(),
      ).toEqual(`|> LIMIT 10 OFFSET 2`);
    });

    it('removes the offset along with its spacing', () => {
      const operator = parseOperator(`|> LIMIT 10  OFFSET 5`).changeOffsetClause(undefined);

      expect(operator.toString()).toEqual(`|> LIMIT 10`);
      expect(operator.changeOffsetClause(SqlOffsetClause.create(1)).toString()).toEqual(
        `|> LIMIT 10 OFFSET 1`,
      );
    });

    it('returns the same operator when nothing changes', () => {
      const operator = parseOperator(`|> LIMIT 10`);

      expect(operator.changeOffsetClause(undefined)).toBe(operator);
    });
  });

  describe('#getOffsetValue', () => {
    it('gets the offset', () => {
      expect(parseOperator(`|> LIMIT 10 OFFSET 5`).getOffsetValue()).toEqual(5);
      expect(parseOperator(`|> LIMIT 10`).getOffsetValue()).toBeUndefined();
    });
  });

  describe('#walk', () => {
    it('walks the limit and the offset', () => {
      expect(
        parseOperator(`|> LIMIT 10 OFFSET 5`)
          .walk(ex => (ex instanceof SqlLiteral ? SqlLiteral.create(1) : ex))
          .toString(),
      ).toEqual(`|> LIMIT 1 OFFSET 1`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> LIMIT 10 OFFSET 5`);

      expect(
        operator.walk(ex => (ex instanceof SqlLiteral && ex.value === 5 ? undefined : ex)),
      ).toBe(operator);
    });
  });
});
