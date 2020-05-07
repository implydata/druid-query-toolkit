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

export interface SqlLiteralValue extends SqlBaseValue {
  value?: string | number;
  stringValue?: string;
}

export class SqlLiteral extends SqlBase {
  static type = 'literal';
  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  static fromInput(value: string | number): SqlLiteral {
    return new SqlLiteral({
      value: value,
      stringValue: typeof value === 'number' ? String(value) : value,
    } as SqlLiteralValue);
  }

  static equalsLiteral(expression: SqlBase, value: number) {
    return expression instanceof SqlLiteral && expression.value === value;
  }

  public value?: string | number;
  public stringValue?: string;

  constructor(options: SqlLiteralValue) {
    super(options, SqlLiteral.type);
    this.value = options.value;
    this.stringValue = options.stringValue;
  }

  public valueOf() {
    const value: SqlLiteralValue = super.valueOf();
    value.value = this.value;
    value.stringValue = this.stringValue;
    return value;
  }

  public toRawString(): string {
    if (!this.stringValue && this.stringValue !== '') {
      throw new Error('Could not make raw string');
    }

    if (typeof this.value === 'string') {
      return SqlLiteral.wrapInQuotes(this.value, `'`);
    }
    return this.stringValue;
  }
}
SqlBase.register(SqlLiteral.type, SqlLiteral);
