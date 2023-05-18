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
import { SqlColumn, SqlFunction, SqlLiteral } from '../sql';

import type { FilterPatternDefinition } from './common';
import { castAsVarchar, extractOuterNot, unwrapCastAsVarchar } from './common';

export interface RegexpFilterPattern {
  type: 'regexp';
  negated: boolean;
  column: string;
  regexp: string;
}

export const REGEXP_PATTERN_DEFINITION: FilterPatternDefinition<RegexpFilterPattern> = {
  name: 'Regular expression',
  fit(possibleEx: SqlExpression) {
    const [negated, ex] = extractOuterNot(possibleEx);
    if (!(ex instanceof SqlFunction)) return;

    const name = ex.getEffectiveFunctionName();
    if (name !== 'REGEXP_LIKE') return;

    let a0 = ex.getArg(0);
    if (!a0) return;
    a0 = unwrapCastAsVarchar(a0);
    if (!(a0 instanceof SqlColumn)) return;

    const a1 = ex.getArg(1);
    if (!(a1 instanceof SqlLiteral)) return;

    return {
      type: 'regexp',
      negated,
      column: a0.getName(),
      regexp: a1.value as string,
    };
  },
  isValid(pattern): boolean {
    return Boolean(pattern.regexp);
  },
  toExpression(pattern): SqlExpression {
    return F('REGEXP_LIKE', castAsVarchar(C(pattern.column)), L(pattern.regexp)).applyIf(
      pattern.negated,
      ex => ex.negate(),
    );
  },
  formatWithoutNegation(pattern) {
    return `${pattern.column} ~ /${pattern.regexp}/`;
  },
  getColumn(pattern): string | undefined {
    return pattern.column;
  },
  getThing(pattern): string | undefined {
    return pattern.regexp;
  },
};
