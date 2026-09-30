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

  const pattern: ValuesFilterPattern = {
    type: 'values',
    negated: false,
    column: 'cityName',
    values: ['Paris', 'Marseille'],
  };

  function fit(sql: string) {
    return VALUES_PATTERN_DEFINITION.fit(SqlExpression.parse(sql));
  }

  describe('.fit', () => {
    it.each([
      `"cityName" <> 'Paris' OR "cityName" <> 'Marseille'`,
      `"cityName" = 'Paris' AND "cityName" = 'Marseille'`,
      `"cityName" = 'Paris' OR "cityName" <> 'Marseille'`,
      `"cityName" = 'Paris' OR "countryName" = 'France'`,
      `"cityName" = 'Paris' OR "cityName" > 'Marseille'`,
      `"cityName" = "countryName"`,
      `'Paris' = 'Paris'`,
      `'Paris' IS NULL`,
      `"cityName" IN ('Paris', "countryName")`,
      `"cityName" IN (SELECT 'Paris')`,
      `"cityName" > 'Paris'`,
      `"cityName" LIKE 'P%'`,
      `UPPER("cityName")`,
    ])('does not fit %s', sql => {
      expect(fit(sql)).toBeUndefined();
    });
  });

  describe('.isValid', () => {
    it('is valid when there are values', () => {
      expect(VALUES_PATTERN_DEFINITION.isValid(pattern)).toEqual(true);
    });

    it('is not valid when there are no values', () => {
      expect(VALUES_PATTERN_DEFINITION.isValid({ ...pattern, values: [] })).toEqual(false);
    });
  });

  describe('.toExpression', () => {
    it('returns FALSE when there are no values', () => {
      expect(String(VALUES_PATTERN_DEFINITION.toExpression({ ...pattern, values: [] }))).toEqual(
        'FALSE',
      );
    });

    it('makes a negated IN', () => {
      expect(String(VALUES_PATTERN_DEFINITION.toExpression({ ...pattern, negated: true }))).toEqual(
        `"cityName" NOT IN ('Paris', 'Marseille')`,
      );
    });
  });

  describe('.getThing', () => {
    it('returns the first value as a string', () => {
      expect(VALUES_PATTERN_DEFINITION.getThing({ ...pattern, values: [5, 'Paris'] })).toEqual('5');
    });

    it('returns nothing when there are no values', () => {
      expect(VALUES_PATTERN_DEFINITION.getThing({ ...pattern, values: [] })).toBeUndefined();
    });
  });

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
