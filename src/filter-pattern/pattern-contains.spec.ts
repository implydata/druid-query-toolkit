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

import type { ContainsFilterPattern } from './pattern-contains';
import { CONTAINS_PATTERN_DEFINITION } from './pattern-contains';

describe('pattern-contains', () => {
  const pattern: ContainsFilterPattern = {
    type: 'contains',
    negated: false,
    column: 'lol',
    contains: 'hello',
  };

  describe('.fit', () => {
    it('fits ICONTAINS_STRING on a cast column', () => {
      expect(
        CONTAINS_PATTERN_DEFINITION.fit(
          SqlExpression.parse(`ICONTAINS_STRING(CAST("lol" AS VARCHAR), 'hello')`),
        ),
      ).toEqual(pattern);
    });

    it('fits ICONTAINS_STRING on a bare column', () => {
      expect(
        CONTAINS_PATTERN_DEFINITION.fit(SqlExpression.parse(`ICONTAINS_STRING("lol", 'hello')`)),
      ).toEqual(pattern);
    });

    it('picks up an outer NOT', () => {
      expect(
        CONTAINS_PATTERN_DEFINITION.fit(
          SqlExpression.parse(`NOT ICONTAINS_STRING(CAST("lol" AS VARCHAR), 'hello')`),
        ),
      ).toEqual({ ...pattern, negated: true });
    });

    it.each([
      `"lol" = 'hello'`,
      `CONTAINS_STRING("lol", 'hello')`,
      `ICONTAINS_STRING()`,
      `ICONTAINS_STRING(UPPER("lol"), 'hello')`,
      `ICONTAINS_STRING("lol")`,
      `ICONTAINS_STRING("lol", '')`,
    ])('does not fit %s', sql => {
      expect(CONTAINS_PATTERN_DEFINITION.fit(SqlExpression.parse(sql))).toBeUndefined();
    });
  });

  describe('.isValid', () => {
    it('is valid when there is a needle', () => {
      expect(CONTAINS_PATTERN_DEFINITION.isValid(pattern)).toEqual(true);
    });

    it('is not valid when the needle is empty', () => {
      expect(CONTAINS_PATTERN_DEFINITION.isValid({ ...pattern, contains: '' })).toEqual(false);
    });
  });

  describe('.toExpression', () => {
    it('makes an ICONTAINS_STRING expression', () => {
      expect(String(CONTAINS_PATTERN_DEFINITION.toExpression(pattern))).toEqual(
        `ICONTAINS_STRING(CAST("lol" AS VARCHAR), 'hello')`,
      );
    });

    it('negates the expression when negated', () => {
      expect(
        String(CONTAINS_PATTERN_DEFINITION.toExpression({ ...pattern, negated: true })),
      ).toEqual(`NOT ICONTAINS_STRING(CAST("lol" AS VARCHAR), 'hello')`);
    });
  });

  describe('.getThing', () => {
    it('returns the needle', () => {
      expect(CONTAINS_PATTERN_DEFINITION.getThing(pattern)).toEqual('hello');
    });
  });
});
