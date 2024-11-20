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
});
