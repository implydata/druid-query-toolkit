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

import type { MvContainsFilterPattern } from './pattern-mv-contains';
import { MV_CONTAINS_PATTERN_DEFINITION } from './pattern-mv-contains';

describe('pattern-mv-contains', () => {
  const pattern: MvContainsFilterPattern = {
    type: 'mvContains',
    negated: false,
    column: 'tags',
    values: ['v1', 2],
  };

  describe('.fit', () => {
    it('fits MV_CONTAINS with an array of literals', () => {
      expect(
        MV_CONTAINS_PATTERN_DEFINITION.fit(
          SqlExpression.parse(`MV_CONTAINS("tags", ARRAY['v1', 2])`),
        ),
      ).toEqual(pattern);
    });

    it('picks up an outer NOT', () => {
      expect(
        MV_CONTAINS_PATTERN_DEFINITION.fit(
          SqlExpression.parse(`NOT MV_CONTAINS("tags", ARRAY['v1', 2])`),
        ),
      ).toEqual({ ...pattern, negated: true });
    });

    it.each([
      `"tags" = 'v1'`,
      `MV_OVERLAP("tags", ARRAY['v1'])`,
      `MV_CONTAINS(UPPER("tags"), ARRAY['v1'])`,
      `MV_CONTAINS("tags", 'v1')`,
      `MV_CONTAINS("tags", ARRAY_CONCAT(ARRAY['v1'], ARRAY['v2']))`,
      `MV_CONTAINS("tags", ARRAY['v1', "other"])`,
    ])('does not fit %s', sql => {
      expect(MV_CONTAINS_PATTERN_DEFINITION.fit(SqlExpression.parse(sql))).toBeUndefined();
    });
  });

  describe('.isValid', () => {
    it('is valid when there are values', () => {
      expect(MV_CONTAINS_PATTERN_DEFINITION.isValid(pattern)).toEqual(true);
    });

    it('is not valid when there are no values', () => {
      expect(MV_CONTAINS_PATTERN_DEFINITION.isValid({ ...pattern, values: [] })).toEqual(false);
    });
  });

  describe('.toExpression', () => {
    it('makes an MV_CONTAINS expression', () => {
      expect(String(MV_CONTAINS_PATTERN_DEFINITION.toExpression(pattern))).toEqual(
        `MV_CONTAINS("tags", ARRAY['v1', 2])`,
      );
    });

    it('negates the expression when negated', () => {
      expect(
        String(MV_CONTAINS_PATTERN_DEFINITION.toExpression({ ...pattern, negated: true })),
      ).toEqual(`NOT MV_CONTAINS("tags", ARRAY['v1', 2])`);
    });
  });

  describe('.getThing', () => {
    it('returns the first value as a string', () => {
      expect(MV_CONTAINS_PATTERN_DEFINITION.getThing({ ...pattern, values: [2, 'v1'] })).toEqual(
        '2',
      );
    });

    it('returns nothing when there are no values', () => {
      expect(MV_CONTAINS_PATTERN_DEFINITION.getThing({ ...pattern, values: [] })).toBeUndefined();
    });
  });
});
