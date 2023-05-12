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

import type { SqlExpression } from '../sql';
import { C, F, RefName, SqlColumn, SqlComparison, SqlFunction, SqlMulti } from '../sql';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot, oneOf } from './common';

function getAnchor(anchor: 'currentTimestamp' | 'maxDataTime') {
  if (anchor === 'currentTimestamp') {
    return new SqlFunction({
      functionName: new RefName({ name: 'CURRENT_TIMESTAMP', quotes: false }),
      specialParen: 'none',
    });
  } else {
    return new SqlFunction({
      functionName: new RefName({ name: 'MAX_DATA_TIME', quotes: false }),
    });
  }
}

export interface TimeRelativeFilterPattern {
  type: 'timeRelative';
  negated: boolean;
  column: string;
  anchor: 'currentTimestamp' | 'maxDataTime';
  rangeDuration: string;
  rangeStep?: number;
  alignType?: 'floor' | 'ceil';
  alignDuration?: string;
  shiftDuration?: string;
  shiftStep?: number;
  timezone?: string;
}

export const TIME_RELATIVE_PATTERN_DEFINITION: FilterPatternDefinition<TimeRelativeFilterPattern> =
  {
    name: 'Time relative',
    fit(possibleEx: SqlExpression) {
      // Something like
      // TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= __time AND __time < CURRENT_TIMESTAMP
      // TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1, 'Etc/UTC') <= __time AND __time < CURRENT_TIMESTAMP
      // TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'PT1H', -1) <= __time AND __time < TIME_CEIL(CURRENT_TIMESTAMP, 'P1D')
      // TIME_SHIFT(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1), 'PT1H', -1) <= __time AND __time < TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1)
      const [negated, ex] = extractOuterNot(possibleEx);

      if (!(ex instanceof SqlMulti) || ex.numArgs() !== 2) return;

      const a = ex.getArg(0);
      if (!(a instanceof SqlComparison) || a.op !== '<=') return;

      const b = ex.getArg(1);
      if (!(b instanceof SqlComparison) || b.op !== '<') return;

      const columnRef = a.rhs;
      if (!(columnRef instanceof SqlColumn) || !columnRef.equals(b.lhs)) return;

      const timeShift = a.lhs;
      if (
        !(timeShift instanceof SqlFunction) ||
        timeShift.getEffectiveFunctionName() !== 'TIME_SHIFT'
      ) {
        return;
      }

      let anchorFn = timeShift.getArg(0);
      if (!b.rhs.equals(anchorFn)) return;

      const rangeDuration = timeShift.getArgAsString(1);
      if (!rangeDuration) return;

      const rangeStep = -timeShift.getArgAsNumber(2)!;
      if (!(rangeStep > 0)) return;

      const timezone = timeShift.getArgAsString(3);

      let shiftDuration: string | undefined;
      let shiftStep: number | undefined;
      if (anchorFn instanceof SqlFunction && anchorFn.getEffectiveFunctionName() === 'TIME_SHIFT') {
        shiftDuration = anchorFn.getArgAsString(1);
        if (!shiftDuration) return;

        shiftStep = anchorFn.getArgAsNumber(2);
        if (!shiftStep) return;

        if (anchorFn.getArgAsString(3) !== timezone) return;

        anchorFn = anchorFn.getArg(0);
      }

      let alignType: 'floor' | 'ceil' | undefined;
      let alignDuration: string | undefined;
      if (
        anchorFn instanceof SqlFunction &&
        oneOf(anchorFn.getEffectiveFunctionName(), 'TIME_FLOOR', 'TIME_CEIL')
      ) {
        alignType = anchorFn.getEffectiveFunctionName() === 'TIME_FLOOR' ? 'floor' : 'ceil';

        alignDuration = anchorFn.getArgAsString(1);
        if (!alignDuration) return;

        if (anchorFn.getArgAsString(2) !== timezone) return;

        anchorFn = anchorFn.getArg(0);
      }

      if (!(anchorFn instanceof SqlFunction)) return;
      let anchor: 'currentTimestamp' | 'maxDataTime';
      switch (anchorFn.getEffectiveFunctionName()) {
        case 'CURRENT_TIMESTAMP':
          anchor = 'currentTimestamp';
          break;

        case 'MAX_DATA_TIME':
          anchor = 'maxDataTime';
          break;

        default:
          return;
      }

      return {
        type: 'timeRelative',
        negated,
        column: columnRef.getName(),
        anchor,
        rangeDuration,
        rangeStep: rangeStep !== 1 ? rangeStep : undefined,
        alignDuration,
        alignType,
        shiftDuration,
        shiftStep,
        timezone,
      };
    },
    isValid(_pattern): boolean {
      return true;
    },
    toExpression(pattern): SqlExpression {
      let anchor = getAnchor(pattern.anchor);

      if (pattern.alignType && pattern.alignDuration) {
        anchor = F(
          pattern.alignType === 'floor' ? 'TIME_FLOOR' : 'TIME_CEIL',
          anchor,
          pattern.alignDuration,
          pattern.timezone,
        );
      }

      if (pattern.shiftDuration && pattern.shiftStep) {
        anchor = F.timeShift(anchor, pattern.shiftDuration, pattern.shiftStep, pattern.timezone);
      }

      const column = C(pattern.column);
      return F.timeShift(anchor, pattern.rangeDuration, -(pattern.rangeStep || 1), pattern.timezone)
        .lessThanOrEqual(column)
        .and(column.lessThan(anchor))
        .ensureParens()
        .applyIf(pattern.negated, ex => ex.negate());
    },
    formatWithoutNegation(pattern) {
      return `${pattern.column} in ${pattern.rangeDuration}`;
    },
    getColumn(pattern): string | undefined {
      return pattern.column;
    },
    getThing(_pattern): string | undefined {
      return;
    },
  };
