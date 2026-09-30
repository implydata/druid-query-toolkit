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

import type { TimeIntervalFilterPattern } from './pattern-time-interval';
import { TIME_INTERVAL_PATTERN_DEFINITION } from './pattern-time-interval';

describe('pattern-time-interval', () => {
  const pattern: TimeIntervalFilterPattern = {
    type: 'timeInterval',
    negated: false,
    column: '__time',
    start: new Date('2022-06-30T22:56:14.123Z'),
    end: new Date('2022-06-30T22:56:15.923Z'),
    startBound: '[',
    endBound: ')',
  };

  function fit(sql: string) {
    return TIME_INTERVAL_PATTERN_DEFINITION.fit(SqlExpression.parse(sql));
  }

  describe('.fit', () => {
    it('picks up an outer NOT on TIME_IN_INTERVAL', () => {
      expect(
        fit(`NOT TIME_IN_INTERVAL("__time", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')`),
      ).toEqual({ ...pattern, negated: true });
    });

    it('picks up an outer NOT on a comparison pair', () => {
      expect(
        fit(
          `NOT (TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" < TIMESTAMP '2022-06-30 22:56:15.923')`,
        ),
      ).toEqual({ ...pattern, negated: true });
    });

    it.each([
      `"__time" = TIMESTAMP '2022-06-30 22:56:14.123'`,
      `UPPER("__time")`,
      `TIME_FLOOR("__time", 'P1D')`,
      `TIME_IN_INTERVAL(UPPER("__time"), '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')`,
      `TIME_IN_INTERVAL("__time")`,
      `TIME_IN_INTERVAL("__time", '2022-06-30T22:56:14.123Z')`,
      `TIME_IN_INTERVAL("__time", 'blah/2022-06-30T22:56:15.923Z')`,
      `TIME_IN_INTERVAL("__time", '2022-06-30T22:56:14.123Z/blah')`,
      `TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" < TIMESTAMP '2022-06-30 22:56:15.923' AND "x" = 1`,
      `TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" IS NOT NULL`,
      `TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" < "other"`,
      `"__time" <= TIMESTAMP '2022-06-30 22:56:14.123' AND "__time" < TIMESTAMP '2022-06-30 22:56:15.923'`,
      `1 <= "__time" AND "__time" < TIMESTAMP '2022-06-30 22:56:15.923'`,
      `TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" < 2`,
      `TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "other" < TIMESTAMP '2022-06-30 22:56:15.923'`,
    ])('does not fit %s', sql => {
      expect(fit(sql)).toBeUndefined();
    });
  });

  describe('.isValid', () => {
    it('is always valid', () => {
      expect(TIME_INTERVAL_PATTERN_DEFINITION.isValid(pattern)).toEqual(true);
    });
  });

  describe('.toExpression', () => {
    it('uses TIME_IN_INTERVAL for [) bounds', () => {
      expect(String(TIME_INTERVAL_PATTERN_DEFINITION.toExpression(pattern))).toEqual(
        `TIME_IN_INTERVAL("__time", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')`,
      );
    });

    it('negates TIME_IN_INTERVAL', () => {
      expect(
        String(TIME_INTERVAL_PATTERN_DEFINITION.toExpression({ ...pattern, negated: true })),
      ).toEqual(
        `NOT TIME_IN_INTERVAL("__time", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')`,
      );
    });

    it('uses comparisons for (] bounds', () => {
      expect(
        String(
          TIME_INTERVAL_PATTERN_DEFINITION.toExpression({
            ...pattern,
            startBound: '(',
            endBound: ']',
          }),
        ),
      ).toEqual(
        `TIMESTAMP '2022-06-30 22:56:14.123' < "__time" AND "__time" <= TIMESTAMP '2022-06-30 22:56:15.923'`,
      );
    });

    it('negates comparisons', () => {
      expect(
        String(
          TIME_INTERVAL_PATTERN_DEFINITION.toExpression({
            ...pattern,
            negated: true,
            endBound: ']',
          }),
        ),
      ).toEqual(
        `NOT (TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" <= TIMESTAMP '2022-06-30 22:56:15.923')`,
      );
    });
  });

  describe('.getThing', () => {
    it('returns nothing', () => {
      expect(TIME_INTERVAL_PATTERN_DEFINITION.getThing(pattern)).toBeUndefined();
    });
  });

  describe('fit <-> toExpression', () => {
    it('should work', () => {
      const expression = `TIME_IN_INTERVAL("__time", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')`;
      const pattern: TimeIntervalFilterPattern = {
        type: 'timeInterval',
        negated: false,
        column: '__time',
        start: new Date('2022-06-30T22:56:14.123Z'),
        end: new Date('2022-06-30T22:56:15.923Z'),
        startBound: '[',
        endBound: ')',
      };
      expect(TIME_INTERVAL_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_INTERVAL_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should work with [] bounds and uses a regular comparison', () => {
      const expression = `TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" <= TIMESTAMP '2022-06-30 22:56:15.923'`;
      const pattern: TimeIntervalFilterPattern = {
        type: 'timeInterval',
        negated: false,
        column: '__time',
        start: new Date('2022-06-30T22:56:14.123Z'),
        end: new Date('2022-06-30T22:56:15.923Z'),
        startBound: '[',
        endBound: ']',
      };
      expect(TIME_INTERVAL_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_INTERVAL_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should work with (] bounds and uses a regular comparison', () => {
      const expression = `TIMESTAMP '2022-06-30 22:56:14.123' < "__time" AND "__time" <= TIMESTAMP '2022-06-30 22:56:15.923'`;
      const pattern: TimeIntervalFilterPattern = {
        type: 'timeInterval',
        negated: false,
        column: '__time',
        start: new Date('2022-06-30T22:56:14.123Z'),
        end: new Date('2022-06-30T22:56:15.923Z'),
        startBound: '(',
        endBound: ']',
      };
      expect(TIME_INTERVAL_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_INTERVAL_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should NOT work with outer interval', () => {
      const expression = `TIMESTAMP '2021-06-30 22:56:14.123' >= "__time" AND "__time" >= TIMESTAMP '2022-06-30 22:56:15.923'`;
      expect(TIME_INTERVAL_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toBeUndefined();
    });

    it('should NOT work with flipped expressions', () => {
      // This is theoretically valid, but not supported by the pattern
      const expression = `"__time" >= TIMESTAMP '2022-06-30 22:56:15.923' AND TIMESTAMP '2021-06-30 22:56:14.123' >= "__time"`;
      expect(TIME_INTERVAL_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toBeUndefined();
    });

    it('round trips a negated comparison pair', () => {
      const expression = `NOT (TIMESTAMP '2022-06-30 22:56:14.123' < "__time" AND "__time" <= TIMESTAMP '2022-06-30 22:56:15.923')`;
      expect(String(TIME_INTERVAL_PATTERN_DEFINITION.toExpression(fit(expression)!))).toEqual(
        expression,
      );
    });
  });
});
