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
import {
  RefName,
  SqlColumn,
  SqlComparison,
  SqlExpression,
  SqlFunction,
  SqlLiteral,
  SqlMulti,
} from '../sql';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot, oneOf } from './common';

export interface TimeRelativeFilterPattern {
  type: 'timeRelative';
  negated: boolean;
  column: string;
  anchor: 'timestamp' | 'maxDataTime';
  anchorTimestamp?: Date;
  rangeDuration: string;
  rangeStep?: number;
  alignType?: 'floor' | 'ceil';
  alignDuration?: string;
  shiftDuration?: string;
  shiftStep?: number;
  timezone?: string;
  origin?: string;
  startBound: '(' | '[';
  endBound: ')' | ']';
}

function getAnchor(pattern: TimeRelativeFilterPattern) {
  if (pattern.anchor === 'timestamp') {
    if (pattern.anchorTimestamp) {
      return L(pattern.anchorTimestamp);
    } else {
      return new SqlFunction({
        functionName: new RefName({ name: 'CURRENT_TIMESTAMP', quotes: false }),
        specialParen: 'none',
      });
    }
  } else {
    return new SqlFunction({
      functionName: new RefName({ name: 'MAX_DATA_TIME', quotes: false }),
    });
  }
}

export const TIME_RELATIVE_PATTERN_DEFINITION: FilterPatternDefinition<TimeRelativeFilterPattern> =
  {
    fit(possibleEx: SqlExpression) {
      // Something like
      // TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1) <= __time AND __time < CURRENT_TIMESTAMP
      // CURRENT_TIMESTAMP <= __time AND __time < TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', 1)
      // TIME_SHIFT(CURRENT_TIMESTAMP, 'PT1H', -1, 'Etc/UTC') <= __time AND __time < CURRENT_TIMESTAMP
      // TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'PT1H', -1) <= __time AND __time < TIME_CEIL(CURRENT_TIMESTAMP, 'P1D')
      // TIME_SHIFT(TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1), 'PT1H', -1) <= __time AND __time < TIME_SHIFT(TIME_CEIL(CURRENT_TIMESTAMP, 'P1D'), 'P1D', -1)
      const [negated, ex] = extractOuterNot(possibleEx);

      if (!(ex instanceof SqlMulti) || ex.numArgs() !== 2) return;

      const a = ex.getArg(0);
      if (!(a instanceof SqlComparison) || (a.op !== '<=' && a.op !== '<')) return;

      const b = ex.getArg(1);
      if (!(b instanceof SqlComparison) || (b.op !== '<' && b.op !== '<=')) return;

      const startBound = a.op === '<=' ? '[' : '(';
      const endBound = b.op === '<' ? ')' : ']';

      // Check that we use the same column in both comparisons
      const columnRef = a.rhs;
      if (!(columnRef instanceof SqlColumn) || !columnRef.equals(b.lhs)) return;

      // Fit the outer timeShift it could be in a.lhs OR b.rhs
      // a.lhs <= columnRef AND columnRef < b.rhs

      let timeShift: SqlFunction;
      let anchorEx: SqlExpression | undefined;
      let rangeStep: number;
      if (a.lhs instanceof SqlFunction && a.lhs.getEffectiveFunctionName() === 'TIME_SHIFT') {
        timeShift = a.lhs;
        anchorEx = timeShift.getArg(0);
        if (!b.rhs.equals(anchorEx)) return;

        rangeStep = -timeShift.getArgAsNumber(2)!;
        if (!(rangeStep > 0)) return;
      } else if (
        b.rhs instanceof SqlFunction &&
        b.rhs.getEffectiveFunctionName() === 'TIME_SHIFT'
      ) {
        timeShift = b.rhs;
        anchorEx = timeShift.getArg(0);
        if (!a.lhs.equals(anchorEx)) return;

        rangeStep = -timeShift.getArgAsNumber(2)!;
        if (!(rangeStep < 0)) return;
      } else {
        return;
      }

      const rangeDuration = timeShift.getArgAsString(1);
      if (!rangeDuration) return;

      const timezone = timeShift.getArgAsString(3);

      let origin;

      let shiftDuration: string | undefined;
      let shiftStep: number | undefined;
      if (anchorEx instanceof SqlFunction && anchorEx.getEffectiveFunctionName() === 'TIME_SHIFT') {
        shiftDuration = anchorEx.getArgAsString(1);
        if (!shiftDuration) return;

        shiftStep = anchorEx.getArgAsNumber(2);
        if (!shiftStep) return;

        if (anchorEx.getArgAsString(3) !== timezone) return;

        anchorEx = anchorEx.getArg(0);
      }

      let alignType: 'floor' | 'ceil' | undefined;
      let alignDuration: string | undefined;
      if (
        anchorEx instanceof SqlFunction &&
        oneOf(anchorEx.getEffectiveFunctionName(), 'TIME_FLOOR', 'TIME_CEIL')
      ) {
        alignType = anchorEx.getEffectiveFunctionName() === 'TIME_FLOOR' ? 'floor' : 'ceil';

        alignDuration = anchorEx.getArgAsString(1);
        if (!alignDuration) return;

        if (anchorEx.getArgAsString(3) !== timezone) return;
        origin = anchorEx.getArgAsString(2);

        anchorEx = anchorEx.getArg(0);
      }

      let anchor: TimeRelativeFilterPattern['anchor'];
      let anchorTimestamp: Date | undefined;
      if (anchorEx instanceof SqlFunction) {
        switch (anchorEx.getEffectiveFunctionName()) {
          case 'CURRENT_TIMESTAMP':
            anchor = 'timestamp';
            break;

          case 'MAX_DATA_TIME':
            anchor = 'maxDataTime';
            break;

          default:
            return;
        }
      } else if (anchorEx instanceof SqlLiteral) {
        anchorTimestamp = anchorEx.getDateValue();
        if (!anchorTimestamp) return;
        anchor = 'timestamp';
      } else {
        return;
      }

      const result: TimeRelativeFilterPattern = {
        type: 'timeRelative',
        negated,
        column: columnRef.getName(),
        anchor,
        rangeDuration,
        startBound,
        endBound,
      };

      if (anchorTimestamp !== undefined) result.anchorTimestamp = anchorTimestamp;
      if (rangeStep !== 1) result.rangeStep = rangeStep;
      if (alignDuration !== undefined) result.alignDuration = alignDuration;
      if (alignType !== undefined) result.alignType = alignType;
      if (shiftDuration !== undefined) result.shiftDuration = shiftDuration;
      if (shiftStep !== undefined) result.shiftStep = shiftStep;
      if (timezone !== undefined) result.timezone = timezone;
      if (origin !== undefined) result.origin = origin;

      return result;
    },
    isValid(_pattern): boolean {
      return true;
    },
    toExpression(pattern): SqlExpression {
      let anchor = getAnchor(pattern);

      if (pattern.alignType && pattern.alignDuration) {
        anchor = F(
          pattern.alignType === 'floor' ? 'TIME_FLOOR' : 'TIME_CEIL',
          anchor,
          pattern.alignDuration,
          // Origin is required if a timezone is included
          // passing null will appear in the arguments as NULL
          // undefined will not appear in the list of arguments.
          pattern.timezone ? pattern.origin || null : undefined,
          pattern.timezone,
        );
      }

      if (pattern.shiftDuration && pattern.shiftStep) {
        anchor = F.timeShift(anchor, pattern.shiftDuration, pattern.shiftStep, pattern.timezone);
      }

      const rangeStep = pattern.rangeStep || 1;
      const anchorWithRange = F.timeShift(
        anchor,
        pattern.rangeDuration,
        -rangeStep,
        pattern.timezone,
      );

      const start = rangeStep >= 0 ? anchorWithRange : anchor;
      const end = rangeStep < 0 ? anchorWithRange : anchor;
      const column = C(pattern.column);
      return SqlExpression.and(
        pattern.startBound === '[' ? start.lessThanOrEqual(column) : start.lessThan(column),
        pattern.endBound === ']' ? column.lessThanOrEqual(end) : column.lessThan(end),
      )
        .ensureParens()
        .applyIf(pattern.negated, ex => ex.negate());
    },
    getThing(_pattern): string | undefined {
      return;
    },
  };
