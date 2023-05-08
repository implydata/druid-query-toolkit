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

import type { LiteralValue, SqlExpression } from '../sql';
import { C, F, SqlColumn, SqlFunction, SqlLiteral } from '../sql';
import { filterMap } from '../utils';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot } from './common';

export interface MvContainsFilterPattern {
  type: 'mvContains';
  negated: boolean;
  column: string;
  values: LiteralValue[];
}

export const MV_CONTAINS_PATTERN_DEFINITION: FilterPatternDefinition<MvContainsFilterPattern> = {
  name: 'MV contains',
  fit(possibleEx: SqlExpression) {
    const [negated, ex] = extractOuterNot(possibleEx);
    if (!(ex instanceof SqlFunction)) return;

    if (ex.getEffectiveFunctionName() !== 'MV_CONTAINS') return;

    const columnEx = ex.getArg(0);
    if (!(columnEx instanceof SqlColumn)) return;

    const valuesEx = ex.getArg(1);
    if (!(valuesEx instanceof SqlFunction) || valuesEx.getEffectiveFunctionName() !== 'ARRAY')
      return;

    const valueArgs = valuesEx.getArgArray();
    const values = filterMap(valueArgs, valueArg =>
      valueArg instanceof SqlLiteral ? valueArg.value : undefined,
    );
    if (valueArgs.length !== values.length) return;

    return {
      type: 'mvContains',
      negated,
      column: columnEx.getName(),
      values,
    };
  },
  isValid(pattern) {
    return Array.isArray(pattern.values) && Boolean(pattern.values.length);
  },
  toExpression(pattern) {
    return F('MV_CONTAINS', C(pattern.column), F.array(...pattern.values)).applyIf(
      pattern.negated,
      ex => ex.negate(),
    );
  },
  formatWithoutNegation(pattern) {
    return `${pattern.column} on of ${pattern.values
      .map(v => (v === '' ? 'empty' : String(v)))
      .join(', ')}`;
  },
  getColumn(pattern) {
    return pattern.column;
  },
  getThing(pattern) {
    return pattern.values.length ? String(pattern.values[0]) : undefined;
  },
};
