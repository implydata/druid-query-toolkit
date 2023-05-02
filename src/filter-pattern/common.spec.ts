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

import { SqlExpression } from '../sql';

import { extractOuterNot, unwrapCastAsVarchar } from './common';

describe('common', () => {
  describe('extractOuterNot', () => {
    it('works without not', () => {
      const [negate, ex] = extractOuterNot(SqlExpression.parse('x > 5'));
      expect(negate).toEqual(false);
      expect(String(ex)).toEqual('x > 5');
    });

    it('works with not', () => {
      const [negate, ex] = extractOuterNot(SqlExpression.parse('NOT (x > 5)'));
      expect(negate).toEqual(true);
      expect(String(ex)).toEqual('x > 5');
    });
  });

  describe('unwrapCastAsVarchar', () => {
    it('works when there is something to unwrap', () => {
      expect(
        String(unwrapCastAsVarchar(SqlExpression.parse('CAST(t."channel" AS VARCHAR)'))),
      ).toEqual('t."channel"');
    });

    it('works when there is nothing to unwrap', () => {
      expect(String(unwrapCastAsVarchar(SqlExpression.parse('t."channel"')))).toEqual(
        't."channel"',
      );
    });
  });
});
