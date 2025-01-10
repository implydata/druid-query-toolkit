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
  const expectations: {
    fixedPoint: string;
    pattern: ValuesFilterPattern;
    otherForms?: string[];
  }[] = [
    {
      fixedPoint: `"cityName" = 'Paris'`,
      pattern: {
        type: 'values',
        negated: false,
        column: 'cityName',
        values: ['Paris'],
      },
      otherForms: [
        `'Paris' = "cityName"`,
        `"cityName" IN ('Paris')`,
        `NOT(NOT("cityName" = 'Paris'))`,
      ],
    },
    {
      fixedPoint: `"cityName" <> 'Paris'`,
      pattern: {
        type: 'values',
        negated: true,
        column: 'cityName',
        values: ['Paris'],
      },
      otherForms: [`'Paris' <> "cityName"`, `"cityName" NOT IN ('Paris')`],
    },
    {
      fixedPoint: '"cityName" IS NULL',
      pattern: {
        type: 'values',
        negated: false,
        column: 'cityName',
        values: [null],
      },
    },
    {
      fixedPoint: '"cityName" IS NOT NULL',
      pattern: {
        type: 'values',
        negated: true,
        column: 'cityName',
        values: [null],
      },
    },
    {
      fixedPoint: `("cityName" IS NULL OR "cityName" IN ('Paris', 'Marseille'))`,
      pattern: {
        type: 'values',
        negated: false,
        column: 'cityName',
        values: [null, 'Paris', 'Marseille'],
      },
      otherForms: [`"cityName" IS NULL OR "cityName" = 'Paris' OR "cityName" = 'Marseille'`],
    },
    {
      fixedPoint: `("cityName" IS NOT NULL AND "cityName" NOT IN ('Paris', 'Marseille'))`,
      pattern: {
        type: 'values',
        negated: true,
        column: 'cityName',
        values: [null, 'Paris', 'Marseille'],
      },
      otherForms: [
        `"cityName" IS NOT NULL AND "cityName" <> 'Paris' AND "cityName" <> 'Marseille'`,
      ],
    },
  ];

  describe('fit <-> toExpression', () => {
    expectations.forEach(({ fixedPoint, pattern, otherForms }) => {
      it(`works with ${fixedPoint}`, () => {
        expect(VALUES_PATTERN_DEFINITION.fit(SqlExpression.parse(fixedPoint))).toEqual(pattern);
        expect(VALUES_PATTERN_DEFINITION.toExpression(pattern).toString()).toEqual(fixedPoint);

        (otherForms || []).forEach(otherForm => {
          expect(VALUES_PATTERN_DEFINITION.fit(SqlExpression.parse(otherForm))).toEqual(pattern);
        });
      });
    });
  });
});
