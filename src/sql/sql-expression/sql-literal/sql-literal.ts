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

import { SqlBase, SqlBaseValue, SqlType } from '../../sql-base';
import { trimString } from '../../utils';
import { SqlExpression } from '../sql-expression';

export type LiteralValue = null | boolean | number | string | Date;

export interface SqlLiteralValue extends SqlBaseValue {
  keyword?: string;
  value: LiteralValue;
  stringValue?: string;
}

export class SqlLiteral extends SqlExpression {
  static type: SqlType = 'literal';

  static NULL: SqlLiteral;
  static FALSE: SqlLiteral;
  static TRUE: SqlLiteral;
  static ZERO: SqlLiteral;

  static create(value: LiteralValue | SqlLiteral): SqlLiteral {
    if (value instanceof SqlLiteral) return value;

    let keyword: string | undefined;
    let stringValue: string;
    switch (typeof value) {
      case 'object':
        if (value === null) {
          stringValue = 'NULL';
        } else if ((value as any).toISOString) {
          keyword = 'TIMESTAMP';
          stringValue = `'${SqlLiteral.dateToTimestampValue(value)}'`;
        } else {
          throw new TypeError('invalid input');
        }
        break;

      case 'boolean':
        stringValue = SqlLiteral.booleanToSql(value);
        break;

      case 'number':
        stringValue = String(value);
        break;

      case 'string':
        stringValue = SqlLiteral.escapeLiteralString(value);
        break;
    }

    return new SqlLiteral({
      keyword,
      value,
      stringValue,
    });
  }

  static index(n: number): SqlLiteral {
    return SqlLiteral.create(n + 1);
  }

  static escapeLiteralString(str: string): string {
    return `'${str.replace(/'/g, "''")}'`;
  }

  static dateToTimestampValue(date: Date): string {
    return date
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '')
      .replace(/\.000$/, '')
      .replace(/ 00:00:00$/, '');
  }

  static booleanToSql(b: boolean): string {
    return String(b).toUpperCase();
  }

  static _equalsLiteral(expression: SqlBase, value: number) {
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

  protected _toRawString(): string {
    const retParts: string[] = [];

    if (this.keyword) {
      retParts.push(this.keyword, this.getInnerSpace('postKeyword'));
    }

    if (this.stringValue) {
      retParts.push(this.stringValue);
    } else {
      if (typeof this.value === 'string') {
        retParts.push(SqlLiteral.escapeLiteralString(this.value));
      } else {
        retParts.push(String(this.value));
      }
    }

    return retParts.join('');
  }

  public increment(ammount = 1): SqlLiteral {
    if (!this.isInteger()) return this;

    const value = this.valueOf();
    value.value = Number(this.value) + ammount;
    delete value.stringValue;
    return new SqlLiteral(value);
  }

  public prettyTrim(maxLength: number): SqlBase {
    if (typeof this.value === 'string') {
      return SqlLiteral.create(trimString(this.value, maxLength));
    }
    return this;
  }

  public isInteger(): boolean {
    const { value } = this;
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  }
}

SqlBase.register(SqlLiteral);

SqlLiteral.NULL = SqlLiteral.create(null);
SqlLiteral.FALSE = SqlLiteral.create(false);
SqlLiteral.TRUE = SqlLiteral.create(true);
SqlLiteral.ZERO = SqlLiteral.create(0);
