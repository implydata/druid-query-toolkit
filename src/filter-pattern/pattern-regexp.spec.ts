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

import type { RegexpFilterPattern } from './pattern-regexp';
import { REGEXP_PATTERN_DEFINITION } from './pattern-regexp';

describe('pattern-regexp', () => {
  const pattern: RegexpFilterPattern = {
    type: 'regexp',
    negated: false,
    column: 'lol',
    regexp: '^h.*o$',
  };

  describe('.fit', () => {
    it('fits REGEXP_LIKE on a cast column', () => {
      expect(
        REGEXP_PATTERN_DEFINITION.fit(
          SqlExpression.parse(`REGEXP_LIKE(CAST("lol" AS VARCHAR), '^h.*o$')`),
        ),
      ).toEqual(pattern);
    });

    it('fits REGEXP_LIKE on a bare column', () => {
      expect(
        REGEXP_PATTERN_DEFINITION.fit(SqlExpression.parse(`REGEXP_LIKE("lol", '^h.*o$')`)),
      ).toEqual(pattern);
    });

    it('picks up an outer NOT', () => {
      expect(
        REGEXP_PATTERN_DEFINITION.fit(SqlExpression.parse(`NOT REGEXP_LIKE("lol", '^h.*o$')`)),
      ).toEqual({ ...pattern, negated: true });
    });

    it.each([
      `"lol" = 'hello'`,
      `REGEXP_EXTRACT("lol", 'x')`,
      `REGEXP_LIKE()`,
      `REGEXP_LIKE(UPPER("lol"), 'x')`,
      `REGEXP_LIKE("lol", "other")`,
    ])('does not fit %s', sql => {
      expect(REGEXP_PATTERN_DEFINITION.fit(SqlExpression.parse(sql))).toBeUndefined();
    });
  });

  describe('.isValid', () => {
    it('is valid when there is a regexp', () => {
      expect(REGEXP_PATTERN_DEFINITION.isValid(pattern)).toEqual(true);
    });

    it('is not valid when the regexp is empty', () => {
      expect(REGEXP_PATTERN_DEFINITION.isValid({ ...pattern, regexp: '' })).toEqual(false);
    });
  });

  describe('.toExpression', () => {
    it('makes a REGEXP_LIKE expression', () => {
      expect(String(REGEXP_PATTERN_DEFINITION.toExpression(pattern))).toEqual(
        `REGEXP_LIKE(CAST("lol" AS VARCHAR), '^h.*o$')`,
      );
    });

    it('negates the expression when negated', () => {
      expect(String(REGEXP_PATTERN_DEFINITION.toExpression({ ...pattern, negated: true }))).toEqual(
        `NOT REGEXP_LIKE(CAST("lol" AS VARCHAR), '^h.*o$')`,
      );
    });
  });

  describe('.getThing', () => {
    it('returns the regexp', () => {
      expect(REGEXP_PATTERN_DEFINITION.getThing(pattern)).toEqual('^h.*o$');
    });
  });
});
