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

import { parseSql } from '../parser';

import { SqlExpression } from './sql-expression';

describe('SqlExpression', () => {
  it('plywood expressions should not parse', () => {
    const queries: string[] = [`$lol`, `#main.sum($count)`];

    for (const sql of queries) {
      let didNotError = false;
      try {
        parseSql(sql);
        didNotError = true;
      } catch {}
      if (didNotError) {
        throw new Error(`should not parse: ${sql}`);
      }
    }
  });

  describe('#decomposeViaAnd', () => {
    it('works without AND', () => {
      expect(String(SqlExpression.parse('a = 1').decomposeViaAnd())).toEqual('a = 1');
    });

    it('works with AND', () => {
      expect(String(SqlExpression.parse('a AND b And c').decomposeViaAnd())).toEqual('a,b,c');
    });
  });

  describe('#filterAnd', () => {
    it('works without AND', () => {
      expect(String(SqlExpression.parse('a = 1').filterAnd(ex => ex.toString() !== 'b'))).toEqual(
        'a = 1',
      );

      expect(String(SqlExpression.parse('a = 1').filterAnd(() => false))).toEqual('undefined');
    });

    it('works with AND', () => {
      expect(
        String(SqlExpression.parse('a AND b And c').filterAnd(ex => ex.toString() !== 'b')),
      ).toEqual('a And c');
    });
  });
});
