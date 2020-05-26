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

import { SqlBase, SqlBaseValue, SqlExpression } from '..';

export type LiteralValue = null | boolean | number | string;

export interface SqlLiteralValue extends SqlBaseValue {
  keyword?: string;
  value: LiteralValue;
  stringValue?: string;
}

export class SqlLiteral extends SqlExpression {
  static type = 'literal';
  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  static fromInput(value: LiteralValue): SqlLiteral {
    return new SqlLiteral({
      value: value,
      stringValue: typeof value === 'number' ? String(value) : value,
    } as SqlLiteralValue);
  }

  static equalsLiteral(expression: SqlBase, value: number) {
    return expression instanceof SqlLiteral && expression.value === value;
  }

  public readonly keyword?: string;
  public readonly value: LiteralValue;
  public readonly stringValue?: string;

  constructor(options: SqlLiteralValue) {
    super(options, SqlLiteral.type);
    this.keyword = options.keyword;
    this.value = options.value;
    this.stringValue = options.stringValue;
  }

  public valueOf(): SqlLiteralValue {
    const value = super.valueOf() as SqlLiteralValue;
    value.keyword = this.keyword;
    value.value = this.value;
    value.stringValue = this.stringValue;
    return value;
  }

  public toRawString(): string {
    const retParts: string[] = [];

    if (this.keyword) {
      retParts.push(this.keyword, this.innerSpacing.postKeyword || '');
    }

    if (this.stringValue) {
      retParts.push(this.stringValue);
    } else {
      if (typeof this.value === 'string') {
        retParts.push(SqlLiteral.wrapInQuotes(this.value, "'")); // ToDo: make this smarter
      } else {
        retParts.push(String(this.value)); // ToDo: make this smarter
      }
    }

    return retParts.join('');
  }

  public increment(ammount = 1): SqlLiteral | undefined {
    if (typeof this.value !== 'number') return;

    const value = this.valueOf();
    value.value = this.value + ammount;
    delete value.stringValue;
    return new SqlLiteral(value);
  }
}
SqlBase.register(SqlLiteral.type, SqlLiteral);
