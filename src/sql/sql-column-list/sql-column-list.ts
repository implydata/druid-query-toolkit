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

import type { RefName } from '../helpers';
import { SeparatedArray, Separator } from '../helpers';
import type { SqlBaseValue, SqlTypeDesignator } from '../sql-base';
import { SqlBase } from '../sql-base';

export interface SqlColumnListValue extends SqlBaseValue {
  columns: SeparatedArray<RefName>;
}

export class SqlColumnList extends SqlBase {
  static type: SqlTypeDesignator = 'columnList';

  static create(columns: SqlColumnList | SeparatedArray<RefName> | RefName[]): SqlColumnList {
    if (columns instanceof SqlColumnList) return columns;
    return new SqlColumnList({
      columns: SeparatedArray.fromArray(columns),
    }).ensureParens();
  }

  public readonly columns: SeparatedArray<RefName>;

  constructor(options: SqlColumnListValue) {
    super(options, SqlColumnList.type);
    this.columns = options.columns;
  }

  public valueOf(): SqlColumnListValue {
    const value = super.valueOf() as SqlColumnListValue;
    value.columns = this.columns;
    return value;
  }

  protected _toRawString(): string {
    return this.columns.toString(Separator.COMMA);
  }

  public changeColumns(columns: SeparatedArray<RefName> | RefName[]): this {
    const value = this.valueOf();
    value.columns = SeparatedArray.fromArray(columns);
    return SqlBase.fromValue(value);
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.columns = this.columns.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlColumnList);
