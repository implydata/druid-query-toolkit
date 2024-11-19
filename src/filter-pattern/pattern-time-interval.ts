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
import { SqlColumn, SqlComparison, SqlFunction, SqlLiteral, SqlMulti } from '../sql';

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
  startBound: '(' | '[';
  endBound: ')' | ']';
}

/**
 * Returns the decomposed comparison if the expression is a comparison with a column and a literal
 * Handles column on the left and literal on the right and vice versa
 *
 * @param expression the expression to decompose
 */
function decomposeComparison(expression: SqlExpression | undefined) {
  if (!(expression instanceof SqlComparison)) return;

  if (!['<', '<='].includes(expression.op)) return;

  // TIMESTAMP '2022-06-30 22:56:14.123' <= "__time"
  if (expression.lhs instanceof SqlLiteral && expression.rhs instanceof SqlColumn) {
    return {
      column: expression.rhs,
      value: expression.lhs,
      // not using SqlComparison.reverseOperator here because
      // it transforms '<' to '>=' and we need '>'
      op: expression.op === '<' ? '>' : '>=',
    };
  }

  // "__time" <= TIMESTAMP '2022-06-30 22:56:14.123'
  if (expression.lhs instanceof SqlColumn && expression.rhs instanceof SqlLiteral) {
    return {
      column: expression.lhs,
      value: expression.rhs,
      op: expression.op,
    };
  }

  return undefined;
}

export const TIME_INTERVAL_PATTERN_DEFINITION: FilterPatternDefinition<TimeIntervalFilterPattern> =
  {
    fit(possibleEx: SqlExpression) {
      // Something like
      // TIME_IN_INTERVAL("lol", '2022-06-30T22:56:14.123Z/2022-06-30T22:56:15.923Z')
      // TIMESTAMP '2022-06-30 22:56:14.123' <= "__time" AND "__time" >= TIMESTAMP '2022-06-30 22:56:15.923'

      const [negated, ex] = extractOuterNot(possibleEx);

      if (ex instanceof SqlMulti && ex.op === 'AND') {
        const args = ex.getArgArray();
        if (args.length !== 2) return;

        const start = args[0];
        const end = args[1];

        const decomposedStart = decomposeComparison(start);
        const decomposedEnd = decomposeComparison(end);
        if (!decomposedStart || !decomposedEnd) return;

        const { column: startColumn, value: startLiteral, op: startOp } = decomposedStart;
        const { column: endColumn, value: endLiteral, op: endOp } = decomposedEnd;

        if (!(startLiteral instanceof SqlLiteral) || !(endLiteral instanceof SqlLiteral)) return;

        const startValue = startLiteral.value;
        if (!(startValue instanceof Date)) return;

        const endValue = endLiteral.value;
        if (!(endValue instanceof Date)) return;

        if (startColumn.getName() !== endColumn.getName()) return;

        return {
          type: 'timeInterval',
          negated,
          column: startColumn.getName(),
          start: startValue,
          end: endValue,
          startBound: startOp === '>' ? '(' : '[',
          endBound: endOp === '<' ? ')' : ']',
        };
      }

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
        startBound: '[',
        endBound: ')',
      };
    },
    isValid(_pattern): boolean {
      return true;
    },
    toExpression(pattern): SqlExpression {
      // TIME_IN_INTERVAL assumes the interval is closed on the start and open on the end
      // so we need to handle other cases here with a regular AND
      if (pattern.startBound !== '[' || pattern.endBound !== ')') {
        return SqlLiteral.create(pattern.start)
          .applyIf(pattern.startBound === '[', c => c.lessThanOrEqual(C(pattern.column)))
          .applyIf(pattern.startBound === '(', c => c.lessThan(C(pattern.column)))
          .and(
            SqlColumn.create(pattern.column)
              .applyIf(pattern.endBound === ']', c => c.lessThanOrEqual(pattern.end))
              .applyIf(pattern.endBound === ')', c => c.lessThan(pattern.end)),
          );
      }

      return F(
        'TIME_IN_INTERVAL',
        C(pattern.column),
        L(`${pattern.start.toISOString()}/${pattern.end.toISOString()}`),
      ).applyIf(pattern.negated, ex => ex.negate());
    },
    getThing(_pattern): string | undefined {
      return;
    },
  };
