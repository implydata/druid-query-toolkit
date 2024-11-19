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

import { C, L } from '../shortcuts';
import { SqlColumn, SqlComparison, SqlExpression, SqlLiteral, SqlMulti } from '../sql';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot } from './common';

export interface NumberRangeFilterPattern {
  type: 'numberRange';
  negated: boolean;
  column: string;
  start: number | undefined;
  end: number | undefined;
  startBound: '(' | '[';
  endBound: ')' | ']';
}

export const NUMBER_RANGE_PATTERN_DEFINITION: FilterPatternDefinition<NumberRangeFilterPattern> = {
  fit(possibleEx: SqlExpression) {
    const [negated, ex] = extractOuterNot(possibleEx);

    if (ex instanceof SqlComparison) {
      if (!(ex.rhs instanceof SqlLiteral && ex.lhs instanceof SqlColumn)) return;

      const value = ex.rhs.value;

      if (typeof value !== 'number' || isNaN(value)) return;

      if (['>', '>='].includes(ex.op)) {
        return {
          type: 'numberRange',
          column: ex.getFirstColumnName()!,
          negated,
          start: value,
          end: undefined,
          startBound: ex.op === '>' ? '(' : '[',
          endBound: ')', // doesn't really matter
        };
      } else if (['<', '<='].includes(ex.op)) {
        const value = ex.rhs.value;
        if (typeof value !== 'number' || isNaN(value)) return;

        return {
          type: 'numberRange',
          column: ex.getFirstColumnName()!,
          negated,
          start: undefined,
          end: value,
          startBound: '(', // doesn't really matter
          endBound: ex.op === '<' ? ')' : ']',
        };
      }
    }

    if (!(ex instanceof SqlMulti)) return;
    const args = ex.getArgArray();

    if (args.length !== 2) return;

    if (!args.every(v => v instanceof SqlComparison)) return;

    const values = args as SqlComparison[];

    const left = values.find(v => {
      return (
        ((v.op === '>' || v.op === '>=') && v.rhs instanceof SqlLiteral) ||
        ((v.op === '<' || v.op === '<=') && v.rhs instanceof SqlColumn)
      );
    });
    const right = values.find(v => {
      return (
        ((v.op === '>' || v.op === '>=') && v.rhs instanceof SqlColumn) ||
        ((v.op === '<' || v.op === '<=') && v.rhs instanceof SqlLiteral)
      );
    });

    if (!left || !right) return;

    if (left.getFirstColumnName() !== right.getFirstColumnName()) return;
    const column = left.getFirstColumnName();

    if (!column) return;

    const leftValue =
      left.rhs instanceof SqlLiteral
        ? left.rhs.value
        : left.lhs instanceof SqlLiteral
        ? left.lhs.value
        : undefined;
    const rightValue =
      right.rhs instanceof SqlLiteral
        ? right.rhs.value
        : right.lhs instanceof SqlLiteral
        ? right.lhs.value
        : undefined;

    if (typeof leftValue !== 'number' || typeof rightValue !== 'number') return;
    if (isNaN(leftValue) || isNaN(rightValue)) return;

    return {
      type: 'numberRange',
      column,
      negated,
      start: leftValue,
      end: rightValue,
      startBound: left.op === '>' ? '(' : '[',
      endBound: right.op === '<' ? ')' : ']',
    };
  },
  isValid(_pattern): boolean {
    return true;
  },
  toExpression(pattern): SqlExpression {
    const c = C(pattern.column);

    if (pattern.end == null && pattern.start != null) {
      return pattern.startBound === '('
        ? SqlComparison.greaterThan(c, L(pattern.start))
        : SqlComparison.greaterThanOrEqual(c, L(pattern.start)).applyIf(pattern.negated, ex =>
            ex.negate(),
          );
    }

    if (pattern.start == null && pattern.end != null) {
      return pattern.endBound === ')'
        ? SqlComparison.lessThan(c, L(pattern.end))
        : SqlComparison.lessThanOrEqual(c, L(pattern.end)).applyIf(pattern.negated, ex =>
            ex.negate(),
          );
    }

    const start = pattern.start ?? 0;
    const end = pattern.end ?? 1;

    return SqlExpression.and(
      pattern.startBound === '('
        ? SqlComparison.greaterThan(c, L(start))
        : SqlComparison.greaterThanOrEqual(c, L(start)),
      pattern.endBound === ')'
        ? SqlComparison.lessThan(c, L(end))
        : SqlComparison.lessThanOrEqual(c, L(end)),
    )
      .ensureParens()
      .applyIf(pattern.negated, ex => ex.negate());
  },
  getThing(_pattern): string | undefined {
    return;
  },
};
