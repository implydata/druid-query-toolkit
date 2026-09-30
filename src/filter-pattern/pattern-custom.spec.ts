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

import type { CustomFilterPattern } from './pattern-custom';
import { CUSTOM_PATTERN_DEFINITION } from './pattern-custom';

describe('pattern-custom', () => {
  describe('.fit', () => {
    it('fits any expression', () => {
      const pattern = CUSTOM_PATTERN_DEFINITION.fit(SqlExpression.parse(`"a" + "b" > 3`));
      expect(pattern?.type).toEqual('custom');
      expect(pattern?.negated).toEqual(false);
      expect(String(pattern?.expression)).toEqual(`"a" + "b" > 3`);
    });

    it('picks up an outer NOT', () => {
      const pattern = CUSTOM_PATTERN_DEFINITION.fit(SqlExpression.parse(`NOT ("a" + "b" > 3)`));
      expect(pattern?.negated).toEqual(true);
      expect(String(pattern?.expression)).toEqual(`"a" + "b" > 3`);
    });
  });

  describe('.isValid', () => {
    it('is valid when there is an expression', () => {
      expect(
        CUSTOM_PATTERN_DEFINITION.isValid({
          type: 'custom',
          negated: false,
          expression: SqlExpression.parse('x > 1'),
        }),
      ).toEqual(true);
    });

    it('is not valid without an expression', () => {
      expect(CUSTOM_PATTERN_DEFINITION.isValid({ type: 'custom', negated: false })).toEqual(false);
    });
  });

  describe('.toExpression', () => {
    it('returns the expression', () => {
      expect(
        String(
          CUSTOM_PATTERN_DEFINITION.toExpression({
            type: 'custom',
            negated: false,
            expression: SqlExpression.parse('x > 1'),
          }),
        ),
      ).toEqual('x > 1');
    });

    it('wraps the expression in NOT when negated', () => {
      expect(
        String(
          CUSTOM_PATTERN_DEFINITION.toExpression({
            type: 'custom',
            negated: true,
            expression: SqlExpression.parse('x > 1'),
          }),
        ),
      ).toEqual('NOT (x > 1)');
    });

    it('falls back to TRUE without an expression', () => {
      const pattern: CustomFilterPattern = { type: 'custom', negated: false };
      expect(String(CUSTOM_PATTERN_DEFINITION.toExpression(pattern))).toEqual('TRUE');
      expect(String(CUSTOM_PATTERN_DEFINITION.toExpression({ ...pattern, negated: true }))).toEqual(
        'NOT TRUE',
      );
    });
  });

  describe('.getThing', () => {
    it('returns nothing', () => {
      expect(
        CUSTOM_PATTERN_DEFINITION.getThing({
          type: 'custom',
          negated: false,
          expression: SqlExpression.parse(`"x" = 'hello'`),
        }),
      ).toBeUndefined();
    });
  });
});
