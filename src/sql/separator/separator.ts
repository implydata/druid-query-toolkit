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

import { SqlMulti } from '..';
import { SqlBase } from '../sql-base';

export interface SeparatorValue {
  left?: string;
  right?: string;
  separator: string;
}

export class Separator {
  public left?: string;
  public right?: string;
  public separator: string;

  // return a separator with only right space
  static bothSeparator(separator: string) {
    return new Separator({ left: ' ', separator: separator, right: ' ' });
  }
  // return a separator with a single space for bpth left and right
  static rightSeparator(separator: string) {
    return new Separator({ separator: separator, right: ' ' });
  }

  // return  a list of separators with n-1 elements in them, filed with fillWith
  static fillBetween(existingSeparator: Separator[], listLength: number, fillWith: Separator) {
    for (let i = existingSeparator.length; i < listLength - 1; i++) {
      existingSeparator = existingSeparator.concat(fillWith);
    }
    return existingSeparator;
  }

  static filterStringFromList(column: string, values: SqlBase[], separators?: Separator[]) {
    let index = -1;
    const filteredValues: SqlBase[] = [];
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (
        SqlBase.getColumnName(value) === column ||
        (value instanceof SqlMulti && value.isType('Comparison') && value.containsColumn(column))
      ) {
        index = i;
      } else if (value instanceof SqlMulti) {
        const filteredExpression = value.removeColumn(column);
        if (!filteredExpression) return undefined;
        filteredValues.push(filteredExpression);
      } else {
        filteredValues.push(value);
      }
    }

    // If removing the 1st column remove the 1st separator
    // i !== 0 && index === 0
    // otherwise remove the separator before it
    // index !== 0 && i !== index - 1
    const filteredSeparators = separators
      ? separators.filter(
          (_separator, i) => (index !== 0 && i !== index - 1) || (i !== 0 && index === 0),
        )
      : undefined;

    return { values: filteredValues, separators: filteredSeparators };
  }

  static filterStringFromInterfaceList<t>(
    units: t[],
    filter: (value: t) => boolean,
    separators?: Separator[],
  ) {
    let index = -1;
    const filteredUnits: t[] = [];
    for (let i = 0; i < units.length; i++) {
      const value = units[i];
      if (filter(value)) {
        index = i;
      } else {
        filteredUnits.push(value);
      }
    }

    // If removing the 1st column remove the 1st separator
    // i !== 0 && index === 0
    // otherwise remove the separator before it
    // index !== 0 && i !== index - 1
    const filteredSeparators = separators
      ? separators.filter(
          (_separator, i) => (index !== 0 && i !== index - 1) || (i !== 0 && index === 0),
        )
      : undefined;

    return {
      units: filteredUnits.length ? filteredUnits : undefined,
      separators: filteredSeparators,
    };
  }

  // Interface Spacilator is used to re string the pattern:
  // Interface separator interface
  static customSpacilator<t>(
    expressions: t[],
    toString: (expression: t) => string,
    separators?: Separator[],
  ): string {
    if (!separators) {
      return toString(expressions[0]);
    } else if (expressions.length - separators.length !== 1) {
      throw new Error('invalid expression or separator length');
    }

    let most = separators
      .flatMap((separator, i) => [toString(expressions[i]), separator.toString()])
      .join('');

    most += toString(expressions[expressions.length - 1]);
    return most;
  }

  // Spacilator is used to restring the pattern:
  // SqlBase separator SqlBase
  static spacilator(expressions: SqlBase[], separators?: Separator[]): string {
    return this.customSpacilator<SqlBase>(expressions, t => t.toString(), separators);
  }

  constructor(options: SeparatorValue) {
    this.left = options.left || '';
    this.right = options.right || '';
    this.separator = options.separator;
  }

  public toString(): string {
    return [this.left, this.separator, this.right].join('');
  }
}
