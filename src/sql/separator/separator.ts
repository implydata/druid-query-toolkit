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

  // Interface Spacilator is used to re string the pattern:
  // Interface separator interface
  static interfaceSpacilator<t>(
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
    if (!separators) {
      return expressions[0].toString();
    } else if (expressions.length - separators.length !== 1) {
      throw new Error('invalid expression or separator length');
    }

    let most = separators
      .flatMap((separator, i) => [expressions[i].toString(), separator.toString()])
      .join('');

    most += expressions[expressions.length - 1].toString();
    return most;
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
