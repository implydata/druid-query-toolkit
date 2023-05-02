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
import { C, L, SqlColumn, SqlComparison, SqlLiteral, SqlMulti } from '../sql';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot } from './common';

export interface NumberRangeFilterPattern {
  type: 'numberRange';
  negated: boolean;
  column: string;
  start: number;
  end: number;
  startBound: '(' | '[';
  endBound: ')' | ']';
}

export const NUMBER_RANGE_PATTERN_DEFINITION: FilterPatternDefinition<NumberRangeFilterPattern> = {
  name: 'Number range',
  fit(possibleEx: SqlExpression) {
    const [negated, ex] = extractOuterNot(possibleEx);
    if (!(ex instanceof SqlMulti)) return;
    if (ex.args.values.length !== 2) return;

    if (!ex.args.values.every(v => v instanceof SqlComparison)) return;

    const values = ex.args.values as SqlComparison[];

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
    return SqlMulti.and(
      pattern.startBound === '('
        ? SqlComparison.greaterThan(C(pattern.column), L(pattern.start))
        : SqlComparison.greaterThanOrEqual(C(pattern.column), L(pattern.start)),
      pattern.endBound === ')'
        ? SqlComparison.lessThan(C(pattern.column), L(pattern.end))
        : SqlComparison.lessThanOrEqual(C(pattern.column), L(pattern.end)),
    ).applyIf(pattern.negated, ex => ex.negate());
  },
  formatWithoutNegation(pattern) {
    return `${pattern.startBound}${pattern.start}, ${pattern.end}${pattern.endBound}`;
  },
  getColumn(pattern): string | undefined {
    return pattern.column;
  },
  getThing(_pattern): string | undefined {
    return;
  },
};
