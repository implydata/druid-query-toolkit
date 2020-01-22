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

import { Expression } from '..';
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface FunctionValue extends SqlBaseValue {
  fn: string;
  leftSpacing?: string;
  argument: Expression;
  rightSpacing?: string;
}

export class Function extends SqlBase {
  public fn: string;
  public argument: Expression | any;
  public leftSpacing?: string;
  public rightSpacing?: string;

  constructor(options: FunctionValue) {
    super(options, 'function');
    this.fn = options.fn;
    this.leftSpacing = options.leftSpacing || '';
    this.argument = options.argument;
    this.rightSpacing = options.rightSpacing || '';
  }

  public valueOf() {
    const value: FunctionValue = {
      type: this.type,
      fn: this.fn,
      leftSpacing: this.leftSpacing,
      argument: this.argument,
      rightSpacing: this.rightSpacing,
    };
    if (this.innerSpacing) value.innerSpacing = this.innerSpacing;
    if (this.parens) value.parens = this.parens;
    return value;
  }

  public toRawString(): string {
    const rawString =
      this.fn + '(' + this.leftSpacing + this.argument.toString() + this.rightSpacing + ')';
    return rawString;
  }
}

SqlBase.register('function', Function);
