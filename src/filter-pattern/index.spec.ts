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

import { filterPatternToExpression, fitFilterPattern } from '.';

function backAndForthNotCustom(expression: string): void {
  const pattern = fitFilterPattern(SqlExpression.parse(expression));
  expect(pattern.type).not.toEqual('custom');
  expect(filterPatternToExpression(pattern).toString()).toEqual(expression);
}

describe('filter-pattern', () => {
  it('fixed points', () => {
    const expressions: string[] = [
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
      `TIME_FLOOR("__time", 'PT1H') = TIME_FLOOR(CURRENT_TIMESTAMP, 'PT1H')`,
      `TIME_FLOOR("__time", 'PT1H') <> TIME_FLOOR(CURRENT_TIMESTAMP, 'PT1H')`,
      `TIME_FLOOR("__time", 'PT1H') = TIME_SHIFT(TIME_FLOOR(CURRENT_TIMESTAMP, 'PT1H'), 'PT1H', -1)`,
      `TIME_FLOOR("__time", 'PT1H') = TIME_SHIFT(TIME_FLOOR(MAX_DATA_TIME(), 'PT1H'), 'PT1H', -1)`,
    ];

    for (const expression of expressions) {
      try {
        backAndForthNotCustom(expression);
      } catch (e) {
        console.log(`Problem with: \`${expression}\``);
        throw e;
      }
    }
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
    });
  });

  it('works for timeRelative', () => {
    expect(
      fitFilterPattern(
        SqlExpression.parse(`TIME_FLOOR("__time", 'PT1H') = TIME_FLOOR(CURRENT_TIMESTAMP, 'PT1H')`),
      ),
    ).toEqual({
      anchor: 'currentTimestamp',
      column: '__time',
      floorDuration: 'PT1H',
      negated: false,
      type: 'timeRelative',
    });
  });
});
