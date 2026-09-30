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

import type { TimeRelativeFilterPattern } from './pattern-time-relative';
import { TIME_RELATIVE_PATTERN_DEFINITION } from './pattern-time-relative';

describe('pattern-time-relative', () => {
  const pattern: TimeRelativeFilterPattern = {
    type: 'timeRelative',
    negated: false,
    column: '__time',
    anchor: 'timestamp',
    rangeDuration: 'PT1H',
    startBound: '[',
    endBound: ')',
  };

  function fit(sql: string) {
    return TIME_RELATIVE_PATTERN_DEFINITION.fit(SqlExpression.parse(sql));
  }

  function toSql(pattern: TimeRelativeFilterPattern) {
    return String(TIME_RELATIVE_PATTERN_DEFINITION.toExpression(pattern));
  }

  describe('.fit', () => {
    it('picks up an outer NOT', () => {
      expect(
        fit(
          `NOT (TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
        ),
      ).toEqual({ ...pattern, negated: true });
    });

    it('records a range step other than 1', () => {
      expect(
        fit(
          `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -3) <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
        ),
      ).toEqual({ ...pattern, rangeStep: 3 });
    });

    it('records the origin of the alignment', () => {
      expect(
        fit(
          `(TIME_SHIFT(TIME_FLOOR(CURRENT_TIMESTAMP, 'P1D', '2000-01-01', 'Etc/UTC'), 'PT1H', -1, 'Etc/UTC') <= "__time" AND "__time" < TIME_FLOOR(CURRENT_TIMESTAMP, 'P1D', '2000-01-01', 'Etc/UTC'))`,
        ),
      ).toEqual({
        ...pattern,
        alignType: 'floor',
        alignDuration: 'P1D',
        origin: '2000-01-01',
        timezone: 'Etc/UTC',
      });
    });

    it.each([
      `"__time" > 1`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" < CURRENT_TIMESTAMP AND "x" = 1)`,
      `("__time" IS NOT NULL AND "__time" < CURRENT_TIMESTAMP)`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) > "__time" AND "__time" < CURRENT_TIMESTAMP)`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" IS NOT NULL)`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" > CURRENT_TIMESTAMP)`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "other" < CURRENT_TIMESTAMP)`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" < MAX_DATA_TIME())`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', 1) <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
      `(CURRENT_TIMESTAMP <= "__time" AND "__time" < TIME_SHIFT(MAX_DATA_TIME(), 'PT1H', 1))`,
      `(CURRENT_TIMESTAMP <= "__time" AND "__time" < TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1))`,
      `(CURRENT_TIMESTAMP <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 1, -1) <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
      `(TIME_SHIFT(TIME_SHIFT(CURRENT_TIMESTAMP, 1, -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(CURRENT_TIMESTAMP, 1, -1))`,
      `(TIME_SHIFT(TIME_SHIFT(CURRENT_TIMESTAMP, 'P1D', 0), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(CURRENT_TIMESTAMP, 'P1D', 0))`,
      `(TIME_SHIFT(TIME_SHIFT(CURRENT_TIMESTAMP, 'P1D', -1, 'Europe/Paris'), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(CURRENT_TIMESTAMP, 'P1D', -1, 'Europe/Paris'))`,
      `(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 1), 'PT1H', -1) <= "__time" AND "__time" < TIME_CEIL(CURRENT_TIMESTAMP, 1))`,
      `(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D', NULL, 'Europe/Paris'), 'PT1H', -1) <= "__time" AND "__time" < TIME_CEIL(CURRENT_TIMESTAMP, 'P1D', NULL, 'Europe/Paris'))`,
      `(TIME_SHIFT(NOW(), 'PT1H', -1) <= "__time" AND "__time" < NOW())`,
      `(TIME_SHIFT("t", 'PT1H', -1) <= "__time" AND "__time" < "t")`,
      `(TIME_SHIFT('hello', 'PT1H', -1) <= "__time" AND "__time" < 'hello')`,
    ])('does not fit %s', sql => {
      expect(fit(sql)).toBeUndefined();
    });
  });

  describe('.isValid', () => {
    it('is always valid', () => {
      expect(TIME_RELATIVE_PATTERN_DEFINITION.isValid(pattern)).toEqual(true);
    });
  });

  describe('.toExpression', () => {
    it('uses MAX_DATA_TIME() as the anchor', () => {
      expect(toSql({ ...pattern, anchor: 'maxDataTime' })).toEqual(
        `(TIME_SHIFT(MAX_DATA_TIME(), 'PT1H', -1) <= "__time" AND "__time" < MAX_DATA_TIME())`,
      );
    });

    it('uses an anchor timestamp', () => {
      expect(toSql({ ...pattern, anchorTimestamp: new Date('2024-01-12T18:31:00Z') })).toEqual(
        `(TIME_SHIFT(TIMESTAMP '2024-01-12 18:31:00', 'PT1H', -1) <= "__time" AND "__time" < TIMESTAMP '2024-01-12 18:31:00')`,
      );
    });

    it('puts the shifted anchor at the end for a negative range step', () => {
      expect(toSql({ ...pattern, rangeStep: -2 })).toEqual(
        `(CURRENT_TIMESTAMP <= "__time" AND "__time" < TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', 2))`,
      );
    });

    it('includes the origin when there is a timezone', () => {
      expect(
        toSql({
          ...pattern,
          alignType: 'floor',
          alignDuration: 'P1D',
          origin: '2000-01-01',
          timezone: 'Etc/UTC',
        }),
      ).toEqual(
        `(TIME_SHIFT(TIME_FLOOR(CURRENT_TIMESTAMP, 'P1D', '2000-01-01', 'Etc/UTC'), 'PT1H', -1, 'Etc/UTC') <= "__time" AND "__time" < TIME_FLOOR(CURRENT_TIMESTAMP, 'P1D', '2000-01-01', 'Etc/UTC'))`,
      );
    });

    it('negates the expression', () => {
      expect(toSql({ ...pattern, negated: true })).toEqual(
        `NOT (TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
      );
    });
  });

  describe('.getThing', () => {
    it('returns nothing', () => {
      expect(TIME_RELATIVE_PATTERN_DEFINITION.getThing(pattern)).toBeUndefined();
    });
  });

  describe('fit <-> toExpression', () => {
    it('should work', () => {
      const expression = `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" < CURRENT_TIMESTAMP)`;
      const pattern: TimeRelativeFilterPattern = {
        type: 'timeRelative',
        negated: false,
        column: '__time',
        anchor: 'timestamp',
        rangeDuration: 'PT1H',
        startBound: '[',
        endBound: ')',
      };
      expect(TIME_RELATIVE_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_RELATIVE_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should work with different bounds', () => {
      const expression = `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) < "__time" AND "__time" <= CURRENT_TIMESTAMP)`;
      const pattern: TimeRelativeFilterPattern = {
        type: 'timeRelative',
        negated: false,
        column: '__time',
        anchor: 'timestamp',
        rangeDuration: 'PT1H',
        startBound: '(',
        endBound: ']',
      };
      expect(TIME_RELATIVE_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_RELATIVE_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should work with timezone', () => {
      const expression = `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1, 'Etc/UTC') <= "__time" AND "__time" < CURRENT_TIMESTAMP)`;
      const pattern: TimeRelativeFilterPattern = {
        type: 'timeRelative',
        negated: false,
        column: '__time',
        anchor: 'timestamp',
        rangeDuration: 'PT1H',
        startBound: '[',
        endBound: ')',
        timezone: 'Etc/UTC', // <---
      };
      expect(TIME_RELATIVE_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_RELATIVE_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should work when ceiled', () => {
      const expression = `(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'PT1H', -1) <= "__time" AND "__time" < TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'))`;
      const pattern: TimeRelativeFilterPattern = {
        type: 'timeRelative',
        negated: false,
        column: '__time',
        anchor: 'timestamp',
        rangeDuration: 'PT1H',
        startBound: '[',
        endBound: ')',
        alignDuration: 'P1D', // <---
        alignType: 'ceil', // <---
      };
      expect(TIME_RELATIVE_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_RELATIVE_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should work when floored', () => {
      const expression = `(TIME_FLOOR(MAX_DATA_TIME(), 'P3M', NULL, 'Etc/UTC') <= "DIM:__time" AND "DIM:__time" < TIME_SHIFT(TIME_FLOOR(MAX_DATA_TIME(), 'P3M', NULL, 'Etc/UTC'), 'P1D', 1, 'Etc/UTC'))`;

      const pattern: TimeRelativeFilterPattern = {
        type: 'timeRelative',
        negated: false,
        column: 'DIM:__time',
        rangeDuration: 'P1D',
        rangeStep: -1,
        alignType: 'floor',
        alignDuration: 'P3M',
        anchor: 'maxDataTime',
        timezone: 'Etc/UTC',
        startBound: '[',
        endBound: ')',
      };

      expect(TIME_RELATIVE_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_RELATIVE_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should work when shifted twice', () => {
      const expression = `(TIME_SHIFT(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1))`;
      const pattern: TimeRelativeFilterPattern = {
        type: 'timeRelative',
        negated: false,
        column: '__time',
        anchor: 'timestamp',
        rangeDuration: 'PT1H',
        startBound: '[',
        endBound: ')',
        alignDuration: 'P1D', // <---
        alignType: 'ceil', // <---
        shiftDuration: 'P1D', // <---
        shiftStep: -1, // <---
      };
      expect(TIME_RELATIVE_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toStrictEqual(
        pattern,
      );
      expect(TIME_RELATIVE_PATTERN_DEFINITION.toExpression(pattern).toString()).toStrictEqual(
        expression,
      );
    });

    it('should work with a negative range step', () => {
      const expression = `(CURRENT_TIMESTAMP <= "__time" AND "__time" < TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', 2))`;
      expect(fit(expression)).toEqual({ ...pattern, rangeStep: -2 });
      expect(toSql(fit(expression)!)).toEqual(expression);
    });
  });
});
