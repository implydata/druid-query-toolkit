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
import { C, F, RefName, SqlColumn, SqlComparison, SqlFunction, SqlLiteral } from '../sql';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot } from './common';

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
  floorDuration: string;
  shiftDuration?: string;
  shiftStep?: number;
}

export const TIME_RELATIVE_PATTERN_DEFINITION: FilterPatternDefinition<TimeRelativeFilterPattern> =
  {
    name: 'Time relative',
    fit(possibleEx: SqlExpression) {
      // Something like
      // TIME_FLOOR(__time, 'PT1H') = TIME_FLOOR(CURRENT_TIMESTAMP, 'PT1H')
      // TIME_FLOOR(__time, 'PT1H') = TIME_SHIFT(TIME_FLOOR(CURRENT_TIMESTAMP, 'PT1H'), 'PT1H', -1)
      let [negated, ex] = extractOuterNot(possibleEx);
      if (!(ex instanceof SqlComparison)) return;

      const { lhs, rhs, op } = ex;
      switch (op) {
        case '=':
          // Nothing to do
          break;

        case '<>':
          negated = !negated;
          break;

        default:
          return;
      }

      if (!(lhs instanceof SqlFunction) || lhs.getEffectiveFunctionName() !== 'TIME_FLOOR') return;
      const columnRef = lhs.getArg(0);
      const floorDuration = lhs.getArgAsString(1);
      if (!(columnRef instanceof SqlColumn) || !floorDuration) return;

      if (!(rhs instanceof SqlFunction)) return;
      let floorFn: SqlFunction;
      let shiftDuration: string | undefined;
      let shiftStep: number | undefined;
      switch (rhs.getEffectiveFunctionName()) {
        case 'TIME_FLOOR':
          floorFn = rhs;
          break;

        case 'TIME_SHIFT': {
          const a0 = rhs.getArg(0);
          if (!(a0 instanceof SqlFunction) || a0.getEffectiveFunctionName() !== 'TIME_FLOOR') {
            return;
          }
          floorFn = a0;

          shiftDuration = rhs.getArgAsString(1);
          if (!shiftDuration) return;

          const a2 = rhs.getArg(2);
          if (!(a2 instanceof SqlLiteral) || typeof a2.value !== 'number') return;
          shiftStep = a2.value;
          break;
        }

        default:
          return;
      }

      if (floorFn.getArgAsString(1) !== floorDuration) return;

      const anchorFn = floorFn.getArg(0);
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
        floorDuration,
        shiftDuration,
        shiftStep,
      };
    },
    isValid(_pattern): boolean {
      return true;
    },
    toExpression(pattern): SqlExpression {
      // TIME_FLOOR(__time, 'PT1H') = TIME_FLOOR(CURRENT_TIMESTAMP, 'PT1H')
      return F.timeFloor(C(pattern.column), pattern.floorDuration)
        .equal(
          F.timeFloor(getAnchor(pattern.anchor), pattern.floorDuration).applyIf(
            pattern.shiftDuration,
            ex => F('TIME_SHIFT', ex, pattern.shiftDuration!, pattern.shiftStep!),
          ),
        )
        .applyIf(pattern.negated, ex => ex.negate());
    },
    formatWithoutNegation(pattern) {
      return `${pattern.column} in ${pattern.floorDuration}`;
    },
    getColumn(pattern): string | undefined {
      return pattern.column;
    },
    getThing(_pattern): string | undefined {
      return;
    },
  };
