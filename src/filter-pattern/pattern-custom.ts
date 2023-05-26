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
import { SqlLiteral } from '../sql';

import type { FilterPatternDefinition } from './common';
import { extractOuterNot } from './common';

export interface CustomFilterPattern {
  type: 'custom';
  negated: boolean;
  expression?: SqlExpression;
}

export const CUSTOM_PATTERN_DEFINITION: FilterPatternDefinition<CustomFilterPattern> = {
  fit(possibleEx: SqlExpression) {
    const [negated, ex] = extractOuterNot(possibleEx);

    return {
      type: 'custom',
      negated,
      expression: ex,
    };
  },
  isValid(pattern): boolean {
    return Boolean(pattern.expression);
  },
  toExpression(pattern): SqlExpression {
    return (pattern.expression || SqlLiteral.TRUE).applyIf(pattern.negated, ex => ex.not());
  },
  getThing(_pattern): string | undefined {
    return;
  },
};
