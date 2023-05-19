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

import { C, F, L } from '../shortcuts';
import type { SqlExpression } from '../sql';
import { SqlColumn, SqlFunction } from '../sql';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot } from './common';

function invalidDate(date: Date): boolean {
  return isNaN(date.valueOf());
}

export interface TimeIntervalFilterPattern {
  type: 'timeInterval';
  negated: boolean;
  column: string;
  start: Date;
  end: Date;
}

export const TIME_INTERVAL_PATTERN_DEFINITION: FilterPatternDefinition<TimeIntervalFilterPattern> =
  {
    name: 'Time interval',
    fit(possibleEx: SqlExpression) {
      // Something like
      // TIME_IN_INTERVAL("lol", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')
      const [negated, ex] = extractOuterNot(possibleEx);
      if (!(ex instanceof SqlFunction)) return;

      const name = ex.getEffectiveFunctionName();
      if (name !== 'TIME_IN_INTERVAL') return;

      const a0 = ex.getArg(0);
      if (!(a0 instanceof SqlColumn)) return;

      const a1 = ex.getArgAsString(1);
      if (!a1) return;

      const intervalParts = a1.split('/');
      if (intervalParts.length !== 2) return;

      const start = new Date(intervalParts[0]!);
      if (invalidDate(start)) return;

      const end = new Date(intervalParts[1]!);
      if (invalidDate(end)) return;

      return {
        type: 'timeInterval',
        negated,
        column: a0.getName(),
        start,
        end,
      };
    },
    isValid(_pattern): boolean {
      return true;
    },
    toExpression(pattern): SqlExpression {
      return F(
        'TIME_IN_INTERVAL',
        C(pattern.column),
        L(`${pattern.start.toISOString()}/${pattern.end.toISOString()}`),
      ).applyIf(pattern.negated, ex => ex.negate());
    },
    formatWithoutNegation(pattern) {
      let startString = pattern.start.toISOString().replace(/Z$/, '');
      let endString = pattern.end.toISOString().replace(/Z$/, '');

      if (startString.endsWith('.000') && endString.endsWith('.000')) {
        startString = startString.replace(/\.000$/, '');
        endString = endString.replace(/\.000$/, '');
      }

      if (startString.endsWith(':00') && endString.endsWith(':00')) {
        startString = startString.replace(/:00$/, '');
        endString = endString.replace(/:00$/, '');
      }

      return `${startString}/${endString}`;
    },
    getColumn(pattern): string | undefined {
      return pattern.column;
    },
    getThing(_pattern): string | undefined {
      return;
    },
  };
