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

import { SqlBase, SqlBaseValue, SqlTypeDesignator } from '../../sql-base';
import { SqlType } from '../../sql-type/sql-type';
import { RefName } from '../../utils';

export interface SqlColumnDeclarationValue extends SqlBaseValue {
  column: RefName;
  columnType: SqlType;
}

export class SqlColumnDeclaration extends SqlBase {
  static type: SqlTypeDesignator = 'columnDeclaration';

  static create(column: string, columnType: string | SqlType) {
    return new SqlColumnDeclaration({
      column: RefName.create(column),
      columnType: SqlType.create(columnType),
    });
  }

  public readonly column: RefName;
  public readonly columnType: SqlType;

  constructor(options: SqlColumnDeclarationValue) {
    super(options, SqlColumnDeclaration.type);
    this.column = options.column;
    this.columnType = options.columnType;
  }

  public valueOf(): SqlColumnDeclarationValue {
    const value = super.valueOf() as SqlColumnDeclarationValue;
    value.column = this.column;
    value.columnType = this.columnType;
    return value;
  }

  protected _toRawString(): string {
    return [this.column.toString(), this.getSpace('postColumn'), this.columnType].join('');
  }
}

SqlBase.register(SqlColumnDeclaration);
