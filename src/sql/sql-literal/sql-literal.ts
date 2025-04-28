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

import { isDate, isInteger } from '../../utils';
import type { SqlBaseValue, SqlTypeDesignator } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { DecomposeViaOptions } from '../sql-expression';
import { SqlExpression } from '../sql-expression';
import { needsUnicodeEscape, sqlEscapeUnicode, trimString } from '../utils';

export type LiteralValue = null | boolean | number | bigint | string | Date;

export interface SqlLiteralValue extends SqlBaseValue {
  value: LiteralValue;
  stringValue?: string;
}

export class SqlLiteral extends SqlExpression {
  static type: SqlTypeDesignator = 'literal';

  static DEFAULT_TIMESTAMP_KEYWORD = 'TIMESTAMP';
  static DEFAULT_NULL_KEYWORD = 'NULL';
  static DEFAULT_FALSE_KEYWORD = 'FALSE';
  static DEFAULT_TRUE_KEYWORD = 'TRUE';

  static NULL: SqlLiteral;
  static FALSE: SqlLiteral;
  static TRUE: SqlLiteral;
  static ZERO: SqlLiteral;
  static ZERO_POINT_ZERO: SqlLiteral;
  static ONE: SqlLiteral;
  static ONE_POINT_ZERO: SqlLiteral;
  static EMPTY_STRING: SqlLiteral;

  static create(value: LiteralValue | SqlLiteral): SqlLiteral {
    if (value instanceof SqlLiteral) return value;

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (typeof value) {
      case 'object':
        if (value !== null && !isDate(value)) {
          throw new TypeError('SqlLiteral invalid object input');
        }
        break;

      case 'number':
        if (!isFinite(value)) {
          throw new TypeError(`SqlLiteral invalid numeric input ${value}`);
        }
        break;

      case 'boolean':
      case 'bigint':
      case 'string':
        break; // Nothing to do here

      default:
        throw new TypeError(`SqlLiteral invalid input of type ${typeof value}`);
    }

    return new SqlLiteral({
      value,
    });
  }

  static double(value: number): SqlLiteral {
    // Make sure to record the string value of a double with a `.` even if the number itself happens to be an integer.
    return new SqlLiteral({
      value,
      stringValue: isInteger(value) ? value.toFixed(1) : undefined,
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

  static direct(v: string | SqlLiteral): SqlLiteral {
    if (v instanceof SqlLiteral) return v;
    return new SqlLiteral({
      value: v.toUpperCase(),
      stringValue: v,
    });
  }

  static escapeLiteralString(str: string): string {
    str = str.replace(/'/g, "''");
    if (needsUnicodeEscape(str)) {
      return `U&'${sqlEscapeUnicode(str)}'`;
    } else {
      return `'${str}'`;
    }
  }

  static dateToTimestampValue(date: Date): string {
    return date
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '')
      .replace(/\.000$/, '')
      .replace(/ 00:00:00$/, '');
  }

  static isTrue(ex: SqlExpression): ex is SqlLiteral {
    return ex instanceof SqlLiteral && ex.value === true;
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

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (typeof value) {
      case 'object':
        if (value === null) {
          return SqlBase.capitalize(SqlLiteral.DEFAULT_NULL_KEYWORD);
        } else if (isDate(value)) {
          return `'${SqlLiteral.dateToTimestampValue(value)}'`;
        } else {
          return String(value);
        }

      case 'boolean':
        return SqlBase.capitalize(
          value ? SqlLiteral.DEFAULT_TRUE_KEYWORD : SqlLiteral.DEFAULT_FALSE_KEYWORD,
        );

      case 'string':
        return SqlLiteral.escapeLiteralString(value);

      default:
        return String(value);
    }
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

  public isIndex(): boolean {
    return typeof this.value === 'number';
  }

  public getIndexValue(): number {
    const { value } = this;
    if (typeof value !== 'number') return -1;
    return Math.floor(value - 1);
  }

  public incrementIndex(amount = 1): SqlLiteral {
    if (!this.isIndex()) return this;
    const value = this.valueOf();
    value.value = Math.floor(this.value as number) + amount;
    delete value.stringValue;
    return new SqlLiteral(value);
  }

  public prettyTrim(maxLength: number): this {
    if (typeof this.value === 'string') {
      return SqlLiteral.create(trimString(this.value, maxLength)) as any;
    }
    return this;
  }

  public decomposeViaAnd(_options?: DecomposeViaOptions): SqlExpression[] {
    return this.value === true ? [] : [this];
  }

  public isInteger(): boolean {
    const { value, stringValue } = this;
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (typeof value) {
      case 'number':
        if (typeof stringValue === 'string') {
          return !stringValue.includes('.');
        }
        return isInteger(value);

      case 'bigint':
        return true;

      default:
        return false;
    }
  }

  public isDate(): boolean {
    return isDate(this.value);
  }

  public getNumberValue(): number | undefined {
    const { value } = this;
    if (typeof value !== 'number') return;
    return value;
  }

  public getNumberOrBigintValue(): number | bigint | undefined {
    const { value } = this;
    if (typeof value !== 'number' && typeof value !== 'bigint') return;
    return value;
  }

  public getStringValue(): string | undefined {
    const { value } = this;
    if (typeof value !== 'string') return;
    return value;
  }

  public getDateValue(): Date | undefined {
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
SqlLiteral.ZERO_POINT_ZERO = SqlLiteral.double(0);
SqlLiteral.ONE = SqlLiteral.create(1);
SqlLiteral.ONE_POINT_ZERO = SqlLiteral.double(1);
SqlLiteral.EMPTY_STRING = SqlLiteral.create('');
