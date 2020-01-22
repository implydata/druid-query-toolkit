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

import { SqlBase, SqlBaseValue } from '../sql-base';

export interface ExpressionValue extends SqlBaseValue {
  operator: string;
  left: Expression | undefined;
  leftSpace?: string;
  right: Expression;
  rightSpace?: string;
}

export class Expression extends SqlBase {
  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  public operator: string;
  public left: Expression | undefined;
  public leftSpace?: string;
  public right: Expression;
  public rightSpace?: string;

  constructor(options: ExpressionValue) {
    super(options, 'expression');
    this.operator = options.operator;
    this.left = options.left;
    this.leftSpace = options.leftSpace || '';
    this.right = options.right;
    this.rightSpace = options.rightSpace || '';
  }

  public valueOf() {
    const value: ExpressionValue = {
      type: this.type,
      operator: this.operator,
      left: this.left,
      leftSpace: this.leftSpace,
      right: this.right,
      rightSpace: this.rightSpace,
    };
    if (this.innerSpacing) value.innerSpacing = this.innerSpacing;
    if (this.parens) value.parens = this.parens;
    return value;
  }

  public toRawString(): string {
    let rawString = this.operator + this.rightSpace + this.right.toString();
    if (this.left) {
      rawString = this.left.toString() + this.leftSpace + rawString;
    }
    return rawString;
  }
}

SqlBase.register('expression', Expression);
