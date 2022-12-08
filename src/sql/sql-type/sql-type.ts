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

import { SqlBase, SqlBaseValue, SqlTypeDesignator } from '../sql-base';
import { SqlExpression } from '../sql-expression';

export interface SqlTypeValue extends SqlBaseValue {
  value: string;
}

export class SqlType extends SqlExpression {
  static type: SqlTypeDesignator = 'type';

  static VARCHAR: SqlType;
  static DOUBLE: SqlType;
  static BIGINT: SqlType;
  static TIMESTAMP: SqlType;

  static create(value: string | SqlType): SqlType {
    if (value instanceof SqlType) return value;

    return new SqlType({
      value,
    });
  }

  static fromNativeType(value: string): SqlType {
    switch (value.toLowerCase()) {
      case 'double':
        return SqlType.DOUBLE;

      case 'long':
        return SqlType.BIGINT;

      case 'complex<json>':
        return SqlType.create('COMPLEX<json>');

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
    return this.value;
  }
}

SqlBase.register(SqlType);

SqlType.VARCHAR = SqlType.create('VARCHAR');
SqlType.DOUBLE = SqlType.create('DOUBLE');
SqlType.BIGINT = SqlType.create('BIGINT');
SqlType.TIMESTAMP = SqlType.create('TIMESTAMP');
