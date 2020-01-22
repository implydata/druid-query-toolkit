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

export interface NumberValue extends SqlBaseValue {
  stringValue: string;
  value: number;
}

export class Number extends SqlBase {
  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  public stringValue: string;
  public value: number;

  constructor(options: NumberValue) {
    super(options, 'number');
    this.stringValue = options.stringValue;
    this.value = options.value;
  }

  public valueOf() {
    const value: NumberValue = {
      type: this.type,
      value: this.value,
      stringValue: this.stringValue,
    };
    if (this.innerSpacing) value.innerSpacing = this.innerSpacing;
    if (this.parens) value.parens = this.parens;
    return value;
  }
  public toRawString(): string {
    return this.stringValue;
  }
}
SqlBase.register('number', Number);
