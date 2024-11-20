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

import { SqlExpression } from '../sql';

import type { ValuesFilterPattern } from './pattern-values';
import { VALUES_PATTERN_DEFINITION } from './pattern-values';

describe('pattern-values', () => {
  const expectations: { expression: string; pattern: ValuesFilterPattern }[] = [
    {
      expression: '"DIM:cityName" IS NULL',
      pattern: {
        type: 'values',
        negated: false,
        column: 'DIM:cityName',
        values: [null],
      },
    },
    {
      expression: '"DIM:cityName" IS NOT NULL',
      pattern: {
        type: 'values',
        negated: true,
        column: 'DIM:cityName',
        values: [null],
      },
    },
    {
      expression: `("DIM:cityName" IS NULL OR "DIM:cityName" IN ('Paris', 'Marseille'))`,
      pattern: {
        type: 'values',
        negated: false,
        column: 'DIM:cityName',
        values: [null, 'Paris', 'Marseille'],
      },
    },
    {
      expression: `("DIM:cityName" IS NOT NULL AND "DIM:cityName" NOT IN ('Paris', 'Marseille'))`,
      pattern: {
        type: 'values',
        negated: true,
        column: 'DIM:cityName',
        values: [null, 'Paris', 'Marseille'],
      },
    },
  ];

  describe('fit <-> toExpression', () => {
    expectations.forEach(({ expression, pattern }) => {
      it(`works with ${expression}`, () => {
        expect(VALUES_PATTERN_DEFINITION.fit(SqlExpression.parse(expression))).toEqual(pattern);
        expect(VALUES_PATTERN_DEFINITION.toExpression(pattern).toString()).toEqual(expression);
      });
    });
  });
});
