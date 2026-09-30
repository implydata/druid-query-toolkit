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

import type { FilterPattern, FilterPatternType } from './unify';
import {
  changeFilterPatternType,
  FILTER_PATTERN_TYPES,
  filterPatternsToExpression,
  filterPatternToExpression,
  fitFilterPattern,
  fitFilterPatterns,
} from './unify';

function backAndForthNotCustom(expression: string): void {
  // Make sure it works for a single pattern
  const pattern = fitFilterPattern(SqlExpression.parse(expression));
  expect(pattern.type).not.toEqual('custom');
  expect(filterPatternToExpression(pattern).toString()).toEqual(expression);

  // Make sure it works for a multiple patterns
  const patterns = fitFilterPatterns(SqlExpression.parse(expression));
  for (const pattern of patterns) {
    expect(pattern.type).not.toEqual('custom');
  }
  expect(filterPatternsToExpression(patterns).toString()).toEqual(expression);
}

describe('unify', () => {
  describe('fitFilterPatterns', () => {
    it('returns a single pattern when the whole expression fits', () => {
      expect(fitFilterPatterns(SqlExpression.parse(`"hi" > 0 AND "hi" < 100`))).toEqual([
        {
          type: 'numberRange',
          negated: false,
          column: 'hi',
          start: 0,
          end: 100,
          startBound: '(',
          endBound: ')',
        },
      ]);
    });

    it('keeps the parts that do not fit as custom', () => {
      const patterns = fitFilterPatterns(
        SqlExpression.parse(`"lol" = 'hello' AND "a" + "b" > "c"`),
      );
      expect(patterns.map(p => p.type)).toEqual(['values', 'custom']);
      expect(String(filterPatternsToExpression(patterns))).toEqual(
        `"lol" = 'hello' AND "a" + "b" > "c"`,
      );
    });

    it('works in a general case', () => {
      expect(
        fitFilterPatterns(
          SqlExpression.parse(
            `(TIME_SHIFT(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1)) AND "lol" IN ('hello', 'goodbye')`,
          ),
        ),
      ).toEqual([
        {
          alignDuration: 'P1D',
          alignType: 'ceil',
          anchor: 'timestamp',
          column: '__time',
          negated: false,
          rangeDuration: 'PT1H',
          shiftDuration: 'P1D',
          shiftStep: -1,
          type: 'timeRelative',
          startBound: '[',
          endBound: ')',
        },
        {
          column: 'lol',
          negated: false,
          type: 'values',
          values: ['hello', 'goodbye'],
        },
      ]);
    });
  });

  describe('fitFilterPattern', () => {
    it('falls back to custom', () => {
      expect(fitFilterPattern(SqlExpression.parse(`"a" + "b" > "c"`))).toEqual({
        type: 'custom',
        negated: false,
        expression: SqlExpression.parse(`"a" + "b" > "c"`),
      });
    });

    it('works for (single)', () => {
      expect(fitFilterPattern(SqlExpression.parse(`"lol" = 'hello'`))).toEqual({
        column: 'lol',
        negated: false,
        type: 'values',
        values: ['hello'],
      });
    });

    it('works for values (single, not)', () => {
      expect(fitFilterPattern(SqlExpression.parse(`"lol" <> 'hello'`))).toEqual({
        column: 'lol',
        negated: true,
        type: 'values',
        values: ['hello'],
      });
    });

    it('works for values', () => {
      expect(fitFilterPattern(SqlExpression.parse(`"lol" IN ('hello', 'goodbye')`))).toEqual({
        column: 'lol',
        negated: false,
        type: 'values',
        values: ['hello', 'goodbye'],
      });
    });

    it('works for values (not)', () => {
      expect(fitFilterPattern(SqlExpression.parse(`"lol" NOT IN ('hello', 'goodbye')`))).toEqual({
        column: 'lol',
        negated: true,
        type: 'values',
        values: ['hello', 'goodbye'],
      });
    });

    it('works for contains', () => {
      expect(
        fitFilterPattern(SqlExpression.parse(`ICONTAINS_STRING(CAST("lol" AS VARCHAR), 'hello')`)),
      ).toEqual({
        column: 'lol',
        contains: 'hello',
        negated: false,
        type: 'contains',
      });
    });

    it('works for regexp', () => {
      expect(
        fitFilterPattern(SqlExpression.parse(`REGEXP_LIKE(CAST("lol" AS VARCHAR), 'hello')`)),
      ).toEqual({
        column: 'lol',
        negated: false,
        regexp: 'hello',
        type: 'regexp',
      });
    });

    it('works for timeInterval', () => {
      expect(
        fitFilterPattern(
          SqlExpression.parse(
            `TIME_IN_INTERVAL("lol", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')`,
          ),
        ),
      ).toEqual({
        column: 'lol',
        end: new Date('2022-06-30T22:56:15.923Z'),
        negated: false,
        start: new Date('2022-06-30T22:56:14.123Z'),
        type: 'timeInterval',
        startBound: '[',
        endBound: ')',
      });
    });

    it('works for timeRelative', () => {
      expect(
        fitFilterPattern(
          SqlExpression.parse(
            `TIME_SHIFT(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1)`,
          ),
        ),
      ).toEqual({
        alignDuration: 'P1D',
        alignType: 'ceil',
        anchor: 'timestamp',
        column: '__time',
        negated: false,
        rangeDuration: 'PT1H',
        shiftDuration: 'P1D',
        shiftStep: -1,
        type: 'timeRelative',
        startBound: '[',
        endBound: ')',
      });
    });

    it('works for timeRelative with anchorTimestamp', () => {
      expect(
        fitFilterPattern(
          SqlExpression.parse(
            `TIME_SHIFT(TIME_SHIFT(TIME_CEIL(TIMESTAMP '2024-01-12 18:30:00', 'P1D'), 'P1D', -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(TIMESTAMP '2024-01-12 18:30:00', 'P1D'), 'P1D', -1)`,
          ),
        ),
      ).toEqual({
        alignDuration: 'P1D',
        alignType: 'ceil',
        anchor: 'timestamp',
        anchorTimestamp: new Date('2024-01-12T18:30:00Z'),
        column: '__time',
        negated: false,
        rangeDuration: 'PT1H',
        shiftDuration: 'P1D',
        shiftStep: -1,
        type: 'timeRelative',
        startBound: '[',
        endBound: ')',
      });
    });

    it('works for timeRelative with timezones', () => {
      expect(
        fitFilterPattern(
          SqlExpression.parse(
            `TIME_SHIFT(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D', NULL, 'Europe/Paris'), 'P1D', -1, 'Europe/Paris'), 'PT1H', -1, 'Europe/Paris') <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D', NULL, 'Europe/Paris'), 'P1D', -1, 'Europe/Paris')`,
          ),
        ),
      ).toEqual({
        alignDuration: 'P1D',
        alignType: 'ceil',
        anchor: 'timestamp',
        column: '__time',
        negated: false,
        rangeDuration: 'PT1H',
        shiftDuration: 'P1D',
        shiftStep: -1,
        type: 'timeRelative',
        timezone: 'Europe/Paris',
        startBound: '[',
        endBound: ')',
      });

      // it should not work if different timezones are found
      expect(
        fitFilterPattern(
          SqlExpression.parse(
            `(TIME_SHIFT(TIME_SHIFT(TIME_CEIL(MAX_DATA_TIME(), 'P1D', 'Etc/UTC'), NULL, 'P1D', -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(MAX_DATA_TIME(), 'P1D'), 'P1D', -1))`,
          ),
        ).type,
      ).toEqual('custom');
    });

    it('works for mvContains', () => {
      expect(
        fitFilterPattern(SqlExpression.parse(`MV_CONTAINS("hello", ARRAY['v1', 'v2'])`)),
      ).toEqual({
        column: 'hello',
        negated: false,
        type: 'mvContains',
        values: ['v1', 'v2'],
      });
    });

    it.each([
      `"__time" >= TIMESTAMP '2022-06-30 22:56:15.923' AND TIMESTAMP '2021-06-30 22:56:14.123' >= "__time"`,
      `TIMESTAMP '2021-06-30 22:56:14.123' >= "__time" AND "__time" >= TIMESTAMP '2022-06-30 22:56:15.923'`,
    ])('falls back to custom for invalid expression: %s', expression => {
      const pattern = fitFilterPattern(SqlExpression.parse(expression));
      expect(pattern.type).toEqual('custom');
    });
  });

  describe('filterPatternsToExpression', () => {
    it('ANDs the patterns together', () => {
      expect(
        String(
          filterPatternsToExpression([
            { type: 'values', negated: false, column: 'a', values: ['x'] },
            { type: 'contains', negated: true, column: 'b', contains: 'y' },
          ]),
        ),
      ).toEqual(`"a" = 'x' AND NOT ICONTAINS_STRING(CAST("b" AS VARCHAR), 'y')`);
    });

    it('returns TRUE for no patterns', () => {
      expect(String(filterPatternsToExpression([]))).toEqual('TRUE');
    });
  });

  describe('filterPatternToExpression', () => {
    it('uses the definition for the pattern type', () => {
      expect(
        String(
          filterPatternToExpression({
            type: 'mvContains',
            negated: false,
            column: 'tags',
            values: ['a'],
          }),
        ),
      ).toEqual(`MV_CONTAINS("tags", ARRAY['a'])`);
    });
  });

  describe('changeFilterPatternType', () => {
    const valuesPattern: FilterPattern = {
      type: 'values',
      negated: true,
      column: 'city',
      values: ['Paris'],
    };

    function changeAll(pattern: FilterPattern): Record<FilterPatternType, FilterPattern> {
      const ret = {} as Record<FilterPatternType, FilterPattern>;
      for (const type of FILTER_PATTERN_TYPES) {
        ret[type] = changeFilterPatternType(pattern, type);
      }
      return ret;
    }

    it('carries over the column, the negation and the thing', () => {
      const changed = changeAll(valuesPattern);
      expect(changed.values).toEqual(valuesPattern);
      expect(changed.contains).toEqual({
        type: 'contains',
        negated: true,
        column: 'city',
        contains: 'Paris',
      });
      expect(changed.regexp).toEqual({
        type: 'regexp',
        negated: true,
        column: 'city',
        regexp: 'Paris',
      });
      expect(changed.timeInterval).toEqual({
        type: 'timeInterval',
        negated: true,
        column: 'city',
        start: new Date('2020-01-01Z'),
        end: new Date('2022-01-01Z'),
        startBound: '[',
        endBound: ')',
      });
      expect(changed.timeRelative).toEqual({
        type: 'timeRelative',
        negated: true,
        column: 'city',
        anchor: 'timestamp',
        rangeDuration: 'P1D',
        startBound: '[',
        endBound: ')',
      });
      expect(changed.numberRange).toEqual({
        type: 'numberRange',
        negated: true,
        column: 'city',
        start: 0,
        end: 100,
        startBound: '(',
        endBound: ')',
      });
      expect(changed.mvContains).toEqual({
        type: 'mvContains',
        negated: true,
        column: 'city',
        values: ['Paris'],
      });
    });

    it('turns the pattern into its expression when changing to custom', () => {
      expect(changeFilterPatternType(valuesPattern, 'custom')).toEqual({
        type: 'custom',
        negated: false,
        expression: filterPatternToExpression(valuesPattern),
      });
      expect(String((changeFilterPatternType(valuesPattern, 'custom') as any).expression)).toEqual(
        `"city" <> 'Paris'`,
      );
    });

    it('uses the first column of a custom expression', () => {
      const changed = changeFilterPatternType(
        { type: 'custom', negated: false, expression: SqlExpression.parse(`"x" + "y" > 3`) },
        'contains',
      );
      expect(changed).toEqual({ type: 'contains', negated: false, column: 'x', contains: '' });
    });

    it('uses placeholders when there is no column or thing', () => {
      const changed = changeAll({ type: 'custom', negated: false });
      expect(changed.values).toEqual({ type: 'values', negated: false, column: '?', values: [] });
      expect(changed.contains).toEqual({
        type: 'contains',
        negated: false,
        column: '?',
        contains: '',
      });
      expect(changed.regexp).toEqual({ type: 'regexp', negated: false, column: '?', regexp: '' });
      expect((changed.timeInterval as any).column).toEqual('?');
      expect((changed.timeRelative as any).column).toEqual('?');
      expect((changed.numberRange as any).column).toEqual('?');
      expect(changed.mvContains).toEqual({
        type: 'mvContains',
        negated: false,
        column: '?',
        values: [],
      });
    });
  });

  describe('fixed point expressions', () => {
    it.each([
      `"lol" = 'hello'`,
      `"lol" <> 'hello'`,
      `"lol" IN ('hello', 'goodbye')`,
      `"lol" NOT IN ('hello', 'goodbye')`,
      `ICONTAINS_STRING(CAST("lol" AS VARCHAR), 'hello')`,
      `NOT ICONTAINS_STRING(CAST("lol" AS VARCHAR), 'hello')`,
      `REGEXP_LIKE(CAST("lol" AS VARCHAR), 'hello')`,
      `NOT REGEXP_LIKE(CAST("lol" AS VARCHAR), 'hello')`,
      `TIME_IN_INTERVAL("lol", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')`,
      `NOT TIME_IN_INTERVAL("lol", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
      `(TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1, 'Europe/Paris') <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
      `NOT (TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= "__time" AND "__time" < CURRENT_TIMESTAMP)`,
      `(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'PT1H', -1) <= "__time" AND "__time" < TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'))`,
      `(TIME_SHIFT(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1))`,
      `(TIME_SHIFT(TIME_SHIFT(TIME_CEIL(MAX_DATA_TIME(), 'P1D'), 'P1D', -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(MAX_DATA_TIME(), 'P1D'), 'P1D', -1))`,
      `(TIME_SHIFT(TIME_SHIFT(TIME_CEIL(MAX_DATA_TIME(), 'P1D', NULL, 'Europe/Paris'), 'P1D', -1, 'Europe/Paris'), 'PT1H', -1, 'Europe/Paris') <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(MAX_DATA_TIME(), 'P1D', NULL, 'Europe/Paris'), 'P1D', -1, 'Europe/Paris'))`,
      `(TIME_SHIFT(TIME_SHIFT(TIME_CEIL(TIMESTAMP '2024-01-12 18:30:00', 'P1D'), 'P1D', -1), 'PT1H', -1) <= "__time" AND "__time" < TIME_SHIFT(TIME_CEIL(TIMESTAMP '2024-01-12 18:30:00', 'P1D'), 'P1D', -1))`,
      `(TIME_SHIFT(TIMESTAMP '2024-01-12 18:31:00', 'P1D', -1, 'Etc/UTC') <= "__time" AND "__time" < TIMESTAMP '2024-01-12 18:31:00')`,
      `MV_CONTAINS("hello", ARRAY['v1', 'v2'])`,
      `("hi" > 0 AND "hi" < 100)`,
      `"hi" > 0`,
      `"hi" >= 0`,
      `"hi" < 0`,
      `"hi" <= 0`,
      `NOT ("hi" > 0 AND "hi" < 100)`,
      `TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" <= TIMESTAMP '2022-06-30 22:56:15.923'`,
      `TIMESTAMP '2022-06-30 22:56:14.123' < "__time" AND "__time" <= TIMESTAMP '2022-06-30 22:56:15.923'`,
      `(TIME_FLOOR(MAX_DATA_TIME(), 'P3M', NULL, 'Etc/UTC') <= "DIM:__time" AND "DIM:__time" < TIME_SHIFT(TIME_FLOOR(MAX_DATA_TIME(), 'P3M', NULL, 'Etc/UTC'), 'P1D', 1, 'Etc/UTC'))`,
    ])('correctly handles expression: %s', expression => {
      backAndForthNotCustom(expression);
    });
  });
});
