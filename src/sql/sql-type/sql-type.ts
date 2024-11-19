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

import type { SqlBaseValue, SqlTypeDesignator } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlExpression } from '../sql-expression';

export interface SqlTypeValue extends SqlBaseValue {
  value: string;
}

export class SqlType extends SqlExpression {
  static type: SqlTypeDesignator = 'type';

  static VARCHAR: SqlType;
  static VARCHAR_ARRAY: SqlType;
  static DOUBLE: SqlType;
  static DOUBLE_ARRAY: SqlType;
  static FLOAT: SqlType;
  static BIGINT: SqlType;
  static BIGINT_ARRAY: SqlType;
  static TIMESTAMP: SqlType;

  static makeEffectiveType(type: string): string {
    const m = type.match(/^TYPE\((.+)\)$/i);
    if (m) return `TYPE(${m[1]})`;
    return SqlBase.normalizeKeywordSpace(type.toUpperCase());
  }

  static create(value: string | SqlType): SqlType {
    if (value instanceof SqlType) return value;

    const effectiveValue = SqlType.makeEffectiveType(value);
    return new SqlType({
      value: effectiveValue,
      keywords: effectiveValue !== value ? { type: value } : undefined,
    });
  }

  static fromNativeType(value: string): SqlType {
    switch (value.toLowerCase()) {
      case 'string':
        return SqlType.VARCHAR;

      case 'array<string>':
        return SqlType.VARCHAR_ARRAY;

      case 'double':
        return SqlType.DOUBLE;

      case 'array<double>':
        return SqlType.DOUBLE_ARRAY;

      case 'float':
        return SqlType.FLOAT;

      case 'long':
        return SqlType.BIGINT;

      case 'array<long>':
        return SqlType.BIGINT_ARRAY;

      case 'complex<json>':
        return SqlType.create(`TYPE('COMPLEX<json>')`);

      default:
        return SqlType.VARCHAR;
    }
  }

  public readonly value: string;

  constructor(options: SqlTypeValue) {
    super(options, SqlType.type);
    this.value = options.value;
  }

  public valueOf(): SqlTypeValue {
    const value = super.valueOf() as SqlTypeValue;
    value.value = this.value;
    return value;
  }

  protected _toRawString(): string {
    return this.getKeyword('type', this.value);
  }

  public getEffectiveType(): string {
    return this.value;
  }

  public getNativeType(): string {
    const sqlType = this.value;
    switch (sqlType) {
      case 'VARCHAR':
        return 'string';

      case 'VARCHAR ARRAY':
        return 'ARRAY<string>';

      case 'DOUBLE':
      case 'FLOAT':
        return sqlType.toLowerCase();

      case 'DOUBLE ARRAY':
        return 'ARRAY<double>';

      case 'TIMESTAMP':
      case 'BIGINT':
        return 'long';

      case 'BIGINT ARRAY':
        return 'ARRAY<long>';

      case `TYPE('COMPLEX<json>')`:
        return 'COMPLEX<json>';

      default:
        return 'string';
    }
  }

  public isArray(): boolean {
    return this.value.endsWith(' ARRAY');
  }
}

SqlBase.register(SqlType);

SqlType.VARCHAR = SqlType.create('VARCHAR');
SqlType.VARCHAR_ARRAY = SqlType.create('VARCHAR ARRAY');
SqlType.DOUBLE = SqlType.create('DOUBLE');
SqlType.DOUBLE_ARRAY = SqlType.create('DOUBLE ARRAY');
SqlType.FLOAT = SqlType.create('FLOAT');
SqlType.BIGINT = SqlType.create('BIGINT');
SqlType.BIGINT_ARRAY = SqlType.create('BIGINT ARRAY');
SqlType.TIMESTAMP = SqlType.create('TIMESTAMP');
