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

import type { FilterPatternDefinition } from './common';
import type { ContainsFilterPattern } from './pattern-contains';
import { CONTAINS_PATTERN_DEFINITION } from './pattern-contains';
import type { CustomFilterPattern } from './pattern-custom';
import { CUSTOM_PATTERN_DEFINITION } from './pattern-custom';
import { MV_CONTAINS_PATTERN_DEFINITION, MvContainsFilterPattern } from './pattern-mv-contains';
import type { NumberRangeFilterPattern } from './pattern-number-range';
import { NUMBER_RANGE_PATTERN_DEFINITION } from './pattern-number-range';
import type { RegexpFilterPattern } from './pattern-regexp';
import { REGEXP_PATTERN_DEFINITION } from './pattern-regexp';
import type { TimeIntervalFilterPattern } from './pattern-time-interval';
import { TIME_INTERVAL_PATTERN_DEFINITION } from './pattern-time-interval';
import type { TimeRelativeFilterPattern } from './pattern-time-relative';
import { TIME_RELATIVE_PATTERN_DEFINITION } from './pattern-time-relative';
import type { ValuesFilterPattern } from './pattern-values';
import { VALUES_PATTERN_DEFINITION } from './pattern-values';

export type FilterPattern =
  | ValuesFilterPattern
  | ContainsFilterPattern
  | RegexpFilterPattern
  | TimeIntervalFilterPattern
  | TimeRelativeFilterPattern
  | NumberRangeFilterPattern
  | MvContainsFilterPattern
  | CustomFilterPattern;

export type FilterPatternType = FilterPattern['type'];

export const FILTER_PATTERN_TYPES: FilterPatternType[] = [
  'values',
  'contains',
  'regexp',
  'timeInterval',
  'timeRelative',
  'numberRange',
  'mvContains',
  'custom',
];

const TYPE_TO_DESCRIPTION: Record<FilterPatternType, FilterPatternDefinition<any>> = {
  values: VALUES_PATTERN_DEFINITION,
  contains: CONTAINS_PATTERN_DEFINITION,
  regexp: REGEXP_PATTERN_DEFINITION,
  timeInterval: TIME_INTERVAL_PATTERN_DEFINITION,
  timeRelative: TIME_RELATIVE_PATTERN_DEFINITION,
  numberRange: NUMBER_RANGE_PATTERN_DEFINITION,
  mvContains: MV_CONTAINS_PATTERN_DEFINITION,
  custom: CUSTOM_PATTERN_DEFINITION,
};

export function fitFilterPatterns(ex: SqlExpression): FilterPattern[] {
  // Check if the entire expression can fit a single pattern
  const wholeFit = fitFilterPattern(ex);
  if (wholeFit.type !== 'custom') return [wholeFit];

  return ex.decomposeViaAnd({ flatten: false }).map(fitFilterPattern);
}

export function fitFilterPattern(ex: SqlExpression): FilterPattern {
  for (const type of FILTER_PATTERN_TYPES) {
    const pattern = TYPE_TO_DESCRIPTION[type].fit(ex);
    if (pattern) return pattern;
  }
  return {
    type: 'custom',
    negated: false,
    expression: ex,
  };
}

export function filterPatternsToExpression(patterns: FilterPattern[]): SqlExpression {
  return SqlExpression.and(...patterns.map(filterPatternToExpression));
}

export function filterPatternToExpression(pattern: FilterPattern): SqlExpression {
  return TYPE_TO_DESCRIPTION[pattern.type].toExpression(pattern);
}

export function formatPatternWithoutNegation(pattern: FilterPattern): string {
  return TYPE_TO_DESCRIPTION[pattern.type].formatWithoutNegation(pattern);
}

function getColumnFromPattern(pattern: FilterPattern): string | undefined {
  return TYPE_TO_DESCRIPTION[pattern.type].getColumn(pattern);
}

function getThingFromPattern(pattern: FilterPattern): string | undefined {
  return TYPE_TO_DESCRIPTION[pattern.type].getThing(pattern);
}

export function changeFilterPatternType(
  pattern: FilterPattern,
  newType: FilterPatternType,
): FilterPattern {
  const column = getColumnFromPattern(pattern);
  const thing = getThingFromPattern(pattern);
  switch (newType) {
    case 'values':
      return {
        type: 'values',
        negated: pattern.negated,
        column: column || '?',
        values: thing ? [thing] : [],
      };

    case 'contains':
      return {
        type: 'contains',
        negated: pattern.negated,
        column: column || '?',
        contains: thing || '',
      };

    case 'regexp':
      return {
        type: 'regexp',
        negated: pattern.negated,
        column: column || '?',
        regexp: thing || '',
      };

    case 'timeInterval':
      return {
        type: 'timeInterval',
        negated: pattern.negated,
        column: column || '?',
        start: new Date('2020-01-01Z'),
        end: new Date('2022-01-01Z'),
      };

    case 'timeRelative':
      return {
        type: 'timeRelative',
        negated: pattern.negated,
        column: column || '?',
        anchor: 'currentTimestamp',
        rangeDuration: 'P1D',
      };

    case 'numberRange':
      return {
        type: 'numberRange',
        negated: pattern.negated,
        column: column || '?',
        start: 0,
        end: 100,
        startBound: '(',
        endBound: ')',
      };

    case 'mvContains':
      return {
        type: 'mvContains',
        negated: pattern.negated,
        column: column || '?',
        values: thing ? [thing] : [],
      };

    case 'custom':
      return {
        type: 'custom',
        negated: false,
        expression: filterPatternToExpression(pattern),
      };
  }
}

export function patternTypeToName(type: FilterPatternType): string {
  return TYPE_TO_DESCRIPTION[type].name;
}

export function initPatternForColumn(columnName: string, columnType: string): FilterPattern {
  switch (columnType) {
    case 'TIMESTAMP':
      return {
        type: 'timeInterval',
        negated: false,
        column: columnName,
        start: new Date('2020-01-01Z'),
        end: new Date('2022-01-01Z'),
      };

    default:
      return {
        type: 'values',
        negated: false,
        column: columnName,
        values: [],
      };
  }
}
