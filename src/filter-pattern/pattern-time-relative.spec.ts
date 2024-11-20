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
});
