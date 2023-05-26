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
import { castAsVarchar, extractOuterNot, unwrapCastAsVarchar } from './common';

export interface ContainsFilterPattern {
  type: 'contains';
  negated: boolean;
  column: string;
  contains: string;
}

export const CONTAINS_PATTERN_DEFINITION: FilterPatternDefinition<ContainsFilterPattern> = {
  fit(possibleEx: SqlExpression) {
    // ICONTAINS_STRING(CAST("lol" AS VARCHAR), 'hello')
    const [negated, ex] = extractOuterNot(possibleEx);
    if (!(ex instanceof SqlFunction)) return;

    if (ex.getEffectiveFunctionName() !== 'ICONTAINS_STRING') return;

    let columnEx = ex.getArg(0);
    if (!columnEx) return;
    columnEx = unwrapCastAsVarchar(columnEx);
    if (!(columnEx instanceof SqlColumn)) return;

    const needle = ex.getArgAsString(1);
    if (!needle) return;

    return {
      type: 'contains',
      negated,
      column: columnEx.getName(),
      contains: needle,
    };
  },
  isValid(pattern): boolean {
    return Boolean(pattern.contains);
  },
  toExpression(pattern): SqlExpression {
    return F('ICONTAINS_STRING', castAsVarchar(C(pattern.column)), L(pattern.contains)).applyIf(
      pattern.negated,
      ex => ex.negate(),
    );
  },
  getThing(pattern): string | undefined {
    return pattern.contains;
  },
};
