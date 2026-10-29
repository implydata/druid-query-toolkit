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
import { SqlColumn, SqlExpression, SqlJoinPart, SqlJoinPipeOperator, SqlTable } from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlJoinPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlJoinPipeOperator', () => {
  describe('parses', () => {
    it.each([
      `|> JOIN u ON t.x = u.x`,
      `|> JOIN u AS b ON a.x = b.x`,
      `|> LEFT JOIN u USING (x, y)`,
      `|> left  outer  join  u  on  a.x = u.x`,
      `|> INNER JOIN (SELECT 'a' AS x) AS b ON a.x = b.x`,
      `|> CROSS JOIN u`,
      `|> CROSS JOIN UNNEST(ARRAY[1, 2]) AS u(n)`,
      `|> NATURAL JOIN u`,
      `|> FULL JOIN (FROM u |> WHERE y) AS b ON a.x = b.x`,
      `|> JOIN u`,
    ])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlJoinPipeOperator);
    });

    it('parses the join into a join part', () => {
      const { joinPart } = parseOperator(`|> LEFT JOIN u AS b ON a.x = b.x`);

      expect(joinPart.joinType).toEqual('LEFT');
      expect(String(joinPart.table)).toEqual(`u AS b`);
      expect(String(joinPart.onExpression)).toEqual(`a.x = b.x`);
    });
  });

  describe('does not parse', () => {
    it.each([`FROM t |> JOIN`, `FROM t |> LEFT u ON true`, `FROM t |> JOIN u ON`])(
      'rejects %s',
      sql => {
        expect(() => SqlExpression.parse(sql)).toThrow('Expected');
      },
    );
  });

  describe('.create', () => {
    it('works', () => {
      expect(
        SqlJoinPipeOperator.create(
          SqlJoinPart.create(
            'LEFT',
            SqlTable.optionalQuotes('u'),
            SqlColumn.optionalQuotes('x', 't').equal(SqlColumn.optionalQuotes('x', 'u')),
          ),
        ).toString(),
      ).toEqual(`|> LEFT JOIN u ON t.x = u.x`);
    });
  });

  describe('#changeJoinPart', () => {
    it('replaces the join part', () => {
      expect(
        parseOperator(`|>  JOIN u ON true`)
          .changeJoinPart(SqlJoinPart.cross(SqlTable.optionalQuotes('v')))
          .toString(),
      ).toEqual(`|>  CROSS JOIN v`);
    });

    it('returns the same operator for the same join part', () => {
      const operator = parseOperator(`|> JOIN u ON true`);

      expect(operator.changeJoinPart(operator.joinPart)).toBe(operator);
    });
  });

  describe('#walk', () => {
    it('walks the table and the condition', () => {
      expect(
        parseOperator(`|> JOIN u ON t.x = u.x`)
          .walk(ex => (ex instanceof SqlColumn ? ex.changeName('y') : ex))
          .toString(),
      ).toEqual(`|> JOIN u ON t.y = u.y`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> JOIN u ON t.x = u.x`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });
  });
});
