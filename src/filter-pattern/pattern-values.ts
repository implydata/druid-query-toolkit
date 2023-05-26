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

import { C } from '../shortcuts';
import type { LiteralValue, SqlExpression } from '../sql';
import { SqlColumn, SqlComparison, SqlLiteral, SqlPlaceholder, SqlRecord } from '../sql';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot, sqlRecordGetLiteralValues } from './common';
import { xor } from './utils';

export interface ValuesFilterPattern {
  type: 'values';
  negated: boolean;
  column: string;
  values: LiteralValue[];
}

export const VALUES_PATTERN_DEFINITION: FilterPatternDefinition<ValuesFilterPattern> = {
  fit(possibleEx: SqlExpression) {
    const [negated, ex] = extractOuterNot(possibleEx);
    if (!(ex instanceof SqlComparison)) return;

    const { lhs, rhs, op } = ex;
    switch (op) {
      case '=':
        if (lhs instanceof SqlColumn && rhs instanceof SqlLiteral) {
          return {
            type: 'values',
            negated,
            column: lhs.getName(),
            values: [rhs.value],
          };
        }
        return;

      case '<>':
        if (lhs instanceof SqlColumn && rhs instanceof SqlLiteral) {
          return {
            type: 'values',
            negated: !negated,
            column: lhs.getName(),
            values: [rhs.value],
          };
        }
        return;

      case 'IN':
        if (lhs instanceof SqlColumn && rhs instanceof SqlRecord) {
          const values = sqlRecordGetLiteralValues(rhs);
          if (values) {
            return {
              type: 'values',
              negated: xor(ex.negated, negated),
              column: lhs.getName(),
              values,
            };
          }
        }
        return;

      default:
        return;
    }
  },
  isValid(pattern) {
    return Array.isArray(pattern.values) && Boolean(pattern.values.length);
  },
  toExpression(pattern) {
    return C(pattern.column)
      .apply(ex =>
        pattern.values.length <= 1
          ? ex.equal(pattern.values[0] ?? SqlPlaceholder.PLACEHOLDER)
          : ex.in(pattern.values),
      )
      .applyIf(pattern.negated, ex => ex.negate());
  },
  getThing(pattern) {
    return pattern.values.length ? String(pattern.values[0]) : undefined;
  },
};
