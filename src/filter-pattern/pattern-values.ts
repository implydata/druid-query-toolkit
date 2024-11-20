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
import { SqlColumn, SqlComparison, SqlLiteral, SqlMulti, SqlPlaceholder, SqlRecord } from '../sql';

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

    if (ex instanceof SqlMulti && (ex.op === 'OR' || ex.op === 'AND')) {
      const args = ex.getArgArray();
      const patterns = args.map(VALUES_PATTERN_DEFINITION.fit).filter(Boolean);

      const pattern = patterns[0];
      if (pattern && args.length === patterns.length) {
        if (pattern.negated && ex.op === 'OR') {
          return;
        }

        if (!pattern.negated && ex.op === 'AND') {
          return;
        }

        for (const p of patterns.slice(1)) {
          if (!p || p.negated !== pattern.negated || p.column !== pattern.column) {
            return;
          }

          pattern.values.push(...p.values);
        }

        return pattern;
      }
    }

    if (!(ex instanceof SqlComparison)) return;

    const { lhs, rhs, op } = ex;
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (op) {
      case '=':
      case '<>':
        if (lhs instanceof SqlColumn && rhs instanceof SqlLiteral) {
          return {
            type: 'values',
            negated: xor(op === '<>', negated),
            column: lhs.getName(),
            values: [rhs.value],
          };
        }
        return;

      case 'IS':
      case 'IS NOT':
        if (lhs instanceof SqlColumn && rhs instanceof SqlLiteral) {
          return {
            type: 'values',
            negated: xor(op === 'IS NOT', negated),
            column: lhs.getName(),
            values: [rhs.value],
          };
        }
        return;

      case 'IN':
      case 'NOT IN':
        if (lhs instanceof SqlColumn && rhs instanceof SqlRecord) {
          const values = sqlRecordGetLiteralValues(rhs);
          if (values) {
            return {
              type: 'values',
              negated: xor(ex.hasNot(), negated),
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
  toExpression({ column, values, negated }): SqlExpression {
    if (!values.length) return SqlLiteral.TRUE;

    return C(column).apply(ex => {
      if (values.length === 1) {
        if (values[0] === null) {
          return negated ? ex.isNotNull() : ex.isNull();
        }

        return ex
          .equal(values[0] ?? SqlPlaceholder.PLACEHOLDER)
          .applyIf(negated, ex => ex.negate());
      } else {
        if (values.includes(null)) {
          if (negated) {
            return ex
              .isNotNull()
              .and(ex.notIn(values.filter(v => v !== null)))
              .addParens();
          }
          return ex
            .isNull()
            .or(ex.in(values.filter(v => v !== null)))
            .addParens();
        }

        return ex.in(values).applyIf(negated, ex => ex.negate());
      }
    });
  },
  getThing(pattern) {
    return pattern.values.length ? String(pattern.values[0]) : undefined;
  },
};
