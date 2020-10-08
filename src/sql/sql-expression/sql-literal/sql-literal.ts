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

function isDate(v: any): v is Date {
  return Boolean(v && typeof v.toISOString === 'function');
}

export type LiteralValue = null | boolean | number | string | Date;

export interface SqlLiteralValue extends SqlBaseValue {
  value: LiteralValue;
  stringValue?: string;
}

export class SqlLiteral extends SqlExpression {
  static type: SqlType = 'literal';

  static DEFAULT_TIMESTAMP_KEYWORD = 'TIMESTAMP';
  static DEFAULT_NULL_KEYWORD = 'NULL';
  static DEFAULT_FALSE_KEYWORD = 'FALSE';
  static DEFAULT_TRUE_KEYWORD = 'TRUE';

  static NULL: SqlLiteral;
  static FALSE: SqlLiteral;
  static TRUE: SqlLiteral;
  static ZERO: SqlLiteral;

  static create(value: LiteralValue | SqlLiteral): SqlLiteral {
    if (value instanceof SqlLiteral) return value;

    switch (typeof value) {
      case 'object':
        if (value !== null && !isDate(value)) {
          throw new TypeError('SqlLiteral invalid object input');
        }
        break;

      case 'boolean':
      case 'number':
      case 'string':
        break; // Nothing to do here

      default:
        throw new TypeError(`SqlLiteral invalid input of type ${typeof value}`);
    }

    return new SqlLiteral({
      value,
    });
  }

  static maybe(value: any): SqlLiteral | undefined {
    try {
      return SqlLiteral.create(value);
    } catch {
      return;
    }
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

  static _equalsLiteral(expression: SqlBase, value: number) {
    return expression instanceof SqlLiteral && expression.value === value;
  }

  public readonly value: LiteralValue;
  public readonly stringValue?: string;

  constructor(options: SqlLiteralValue) {
    super(options, SqlLiteral.type);
    this.value = options.value;
    this.stringValue = options.stringValue;
  }

  public valueOf(): SqlLiteralValue {
    const value = super.valueOf() as SqlLiteralValue;
    value.value = this.value;
    value.stringValue = this.stringValue;
    return value;
  }

  public getEffectiveStringValue(): string {
    const { value, stringValue } = this;
    if (stringValue) return stringValue;

    switch (typeof value) {
      case 'object':
        if (value === null) {
          return SqlBase.capitalize(SqlLiteral.DEFAULT_NULL_KEYWORD);
        } else if (isDate(value)) {
          return `'${SqlLiteral.dateToTimestampValue(value)}'`;
        }
        break;

      case 'boolean':
        return SqlBase.capitalize(
          value ? SqlLiteral.DEFAULT_TRUE_KEYWORD : SqlLiteral.DEFAULT_FALSE_KEYWORD,
        );

      case 'string':
        return SqlLiteral.escapeLiteralString(value);
    }

    return String(value);
  }

  protected _toRawString(): string {
    const retParts: string[] = [];

    if (this.isDate()) {
      retParts.push(
        this.getKeyword('timestamp', SqlLiteral.DEFAULT_TIMESTAMP_KEYWORD),
        this.getSpace('postTimestamp'),
      );
    }

    retParts.push(this.getEffectiveStringValue());

    return retParts.join('');
  }

  public resetOwnKeywords(): this {
    const { value, stringValue } = this;
    if (stringValue && (value === null || typeof value === 'boolean')) {
      const v = this.valueOf();
      delete v.stringValue;
      return new SqlLiteral(v).resetOwnKeywords() as this;
    } else {
      return super.resetOwnKeywords();
    }
  }

  public increment(amount = 1): SqlLiteral {
    if (!this.isInteger()) return this;

    const value = this.valueOf();
    value.value = Number(this.value) + amount;
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

  public isDate(): boolean {
    return isDate(this.value);
  }

  getNumberValue(): number | undefined {
    const { value } = this;
    if (typeof value !== 'number') return;
    return value;
  }

  getStringValue(): string | undefined {
    const { value } = this;
    if (typeof value !== 'string') return;
    return value;
  }

  getDateValue(): Date | undefined {
    const { value } = this;
    if (!isDate(value)) return;
    return value;
  }
}

SqlBase.register(SqlLiteral);

SqlLiteral.NULL = SqlLiteral.create(null);
SqlLiteral.FALSE = SqlLiteral.create(false);
SqlLiteral.TRUE = SqlLiteral.create(true);
SqlLiteral.ZERO = SqlLiteral.create(0);
