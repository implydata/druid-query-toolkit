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

import { RefName } from '../../helpers';
import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import { SqlType } from '../../sql-type/sql-type';

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

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlColumnDeclaration | undefined {
    let ret = this;

    if (this.columnType) {
      const columnType = this.columnType._walkHelper(nextStack, fn, postorder);
      if (!columnType) return;
      if (columnType !== this.columnType) {
        ret = ret.changeColumnType(columnType as SqlType);
      }
    }

    return ret;
  }

  public getColumnName(): string {
    return this.column.name;
  }

  public changeColumn(column: RefName | string): this {
    const value = this.valueOf();
    value.column = RefName.create(column);
    return SqlBase.fromValue(value);
  }

  public changeColumnType(columnType: SqlType | string): this {
    const value = this.valueOf();
    value.columnType = SqlType.create(columnType);
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlColumnDeclaration);
