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

import type { NumberRangeFilterPattern } from './pattern-number-range';
import { NUMBER_RANGE_PATTERN_DEFINITION } from './pattern-number-range';

describe('pattern-number-range', () => {
  const range: NumberRangeFilterPattern = {
    type: 'numberRange',
    negated: false,
    column: 'hi',
    start: 0,
    end: 100,
    startBound: '(',
    endBound: ')',
  };

  function fit(sql: string) {
    return NUMBER_RANGE_PATTERN_DEFINITION.fit(SqlExpression.parse(sql));
  }

  function toSql(pattern: NumberRangeFilterPattern) {
    return String(NUMBER_RANGE_PATTERN_DEFINITION.toExpression(pattern));
  }

  describe('.fit', () => {
    it('fits a single lower bound', () => {
      expect(fit(`"hi" > 5`)).toEqual({
        ...range,
        start: 5,
        end: undefined,
        startBound: '(',
      });
      expect(fit(`"hi" >= 5`)).toEqual({
        ...range,
        start: 5,
        end: undefined,
        startBound: '[',
      });
    });

    it('fits a single upper bound', () => {
      expect(fit(`"hi" < 5`)).toEqual({
        ...range,
        start: undefined,
        end: 5,
        endBound: ')',
      });
      expect(fit(`"hi" <= 5`)).toEqual({
        ...range,
        start: undefined,
        end: 5,
        endBound: ']',
      });
    });

    it('picks up an outer NOT', () => {
      expect(fit(`NOT ("hi" > 5)`)).toEqual({
        ...range,
        negated: true,
        start: 5,
        end: undefined,
      });
    });

    it('fits a two sided range', () => {
      expect(fit(`"hi" > 0 AND "hi" < 100`)).toEqual(range);
      expect(fit(`"hi" >= 0 AND "hi" <= 100`)).toEqual({
        ...range,
        startBound: '[',
        endBound: ']',
      });
    });

    it('fits a two sided range written with the literal first', () => {
      expect(fit(`0 < "hi" AND 100 > "hi"`)).toEqual(range);
      expect(fit(`0 <= "hi" AND 100 >= "hi"`)).toEqual({
        ...range,
        startBound: '[',
        endBound: ']',
      });
    });

    it('fits a two sided range in either order', () => {
      expect(fit(`"hi" < 100 AND "hi" > 0`)).toEqual(range);
    });

    it('picks up an outer NOT on a range', () => {
      expect(fit(`NOT ("hi" > 0 AND "hi" < 100)`)).toEqual({ ...range, negated: true });
    });

    it.each([
      `"hi" = 5`,
      `5 < "hi"`,
      `"hi" > 'a'`,
      `"hi" > "lo"`,
      `"hi" > 0 OR "hi" < 100`,
      `"hi" > 0 AND "hi" < 100 AND "hi" > 3`,
      `"hi" > 0 AND "hi" IS NOT NULL`,
      `"hi" > 0 AND "hi" > 100`,
      `"hi" > 0 AND "lo" < 100`,
      `1 > 0 AND 2 < 3`,
      `"hi" > 'a' AND "hi" < 100`,
      `"hi" > 0 AND "hi" < 'z'`,
      `UPPER("hi")`,
    ])('does not fit %s', sql => {
      expect(fit(sql)).toBeUndefined();
    });
  });

  describe('.isValid', () => {
    it('is always valid', () => {
      expect(NUMBER_RANGE_PATTERN_DEFINITION.isValid(range)).toEqual(true);
    });
  });

  describe('.toExpression', () => {
    it('makes a lower bound', () => {
      expect(toSql({ ...range, end: undefined })).toEqual(`"hi" > 0`);
      expect(toSql({ ...range, end: undefined, startBound: '[' })).toEqual(`"hi" >= 0`);
    });

    it('negates a lower bound', () => {
      expect(toSql({ ...range, end: undefined, negated: true })).toEqual(`"hi" <= 0`);
      expect(toSql({ ...range, end: undefined, startBound: '[', negated: true })).toEqual(
        `"hi" < 0`,
      );
    });

    it('makes an upper bound', () => {
      expect(toSql({ ...range, start: undefined })).toEqual(`"hi" < 100`);
      expect(toSql({ ...range, start: undefined, endBound: ']' })).toEqual(`"hi" <= 100`);
    });

    it('negates an upper bound', () => {
      expect(toSql({ ...range, start: undefined, negated: true })).toEqual(`"hi" >= 100`);
      expect(toSql({ ...range, start: undefined, endBound: ']', negated: true })).toEqual(
        `"hi" > 100`,
      );
    });

    it('makes a two sided range', () => {
      expect(toSql(range)).toEqual(`("hi" > 0 AND "hi" < 100)`);
      expect(toSql({ ...range, startBound: '[', endBound: ']' })).toEqual(
        `("hi" >= 0 AND "hi" <= 100)`,
      );
    });

    it('negates a two sided range', () => {
      expect(toSql({ ...range, negated: true })).toEqual(`NOT ("hi" > 0 AND "hi" < 100)`);
    });

    it('defaults both ends when neither is set', () => {
      expect(toSql({ ...range, start: undefined, end: undefined })).toEqual(
        `("hi" > 0 AND "hi" < 1)`,
      );
    });
  });

  describe('.getThing', () => {
    it('returns nothing', () => {
      expect(NUMBER_RANGE_PATTERN_DEFINITION.getThing(range)).toBeUndefined();
    });
  });

  describe('fit <-> toExpression', () => {
    it.each([
      `"hi" > 0`,
      `"hi" <= 0`,
      `("hi" >= 0 AND "hi" < 100)`,
      `NOT ("hi" > 0 AND "hi" < 100)`,
    ])('round trips %s', sql => {
      expect(toSql(fit(sql)!)).toEqual(sql);
    });

    it('keeps a negated single bound equivalent', () => {
      expect(toSql(fit(`NOT ("hi" > 5)`)!)).toEqual(`"hi" <= 5`);
    });
  });
});
