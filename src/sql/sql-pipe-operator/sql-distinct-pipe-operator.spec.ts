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

import { SqlDistinctPipeOperator, SqlExpression } from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

describe('SqlDistinctPipeOperator', () => {
  describe('parses', () => {
    it.each([`|> DISTINCT`, `|> distinct`, `|>DISTINCT`])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlDistinctPipeOperator);
    });
  });

  describe('does not parse', () => {
    it.each([`FROM t |> DISTINCT a`, `FROM t |> DISTINCTa`])('rejects %s', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works', () => {
      expect(SqlDistinctPipeOperator.create().toString()).toEqual(`|> DISTINCT`);
    });
  });

  describe('#walk', () => {
    it('has nothing to walk', () => {
      const operator = SqlDistinctPipeOperator.create();

      expect(operator.walk(ex => ex)).toBe(operator);
    });
  });
});
