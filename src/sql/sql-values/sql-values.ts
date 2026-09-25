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

import { NEWLINE, SeparatedArray, Separator, SPACE } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlQueryBaseValue } from '../sql-query-base/sql-query-base';
import { SqlQueryBase } from '../sql-query-base/sql-query-base';
import type { SqlRecord } from '../sql-record/sql-record';

export interface SqlValuesValue extends SqlQueryBaseValue {
  records: SeparatedArray<SqlRecord>;
}

export class SqlValues extends SqlQueryBase {
  static type: SqlTypeDesignator = 'values';

  static DEFAULT_VALUES_KEYWORD = 'VALUES';

  static create(records: SqlValues | SeparatedArray<SqlRecord> | SqlRecord[]): SqlValues {
    if (records instanceof SqlValues) return records;
    return new SqlValues({
      records: SeparatedArray.fromArray(records),
    }).ensureParens();
  }

  public readonly records: SeparatedArray<SqlRecord>;

  constructor(options: SqlValuesValue) {
    super(options, SqlValues.type);
    this.records = options.records;
  }

  public valueOf(): SqlValuesValue {
    const value = super.valueOf() as SqlValuesValue;
    value.records = this.records;
    return value;
  }

  protected _toRawBodyString(): string {
    const { records } = this;

    const multiline = records.length() > 1;
    return [
      this.getKeyword('values', SqlValues.DEFAULT_VALUES_KEYWORD),
      this.getSpace('postValues', multiline ? NEWLINE : SPACE),
      records.toString(multiline ? Separator.COMMA_NEWLINE : Separator.COMMA),
    ].join('');
  }

  public changeRecords(records: SeparatedArray<SqlRecord> | SqlRecord[]): this {
    const value = this.valueOf();
    value.records = SeparatedArray.fromArray(records);
    return SqlBase.fromValue(value);
  }

  protected _walkInnerBody(
    ret: this,
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): this | undefined {
    const records = SqlBase.walkSeparatedArray(this.records, nextStack, fn, postorder);
    if (!records) return;
    if (records !== this.records) {
      return ret.changeRecords(records);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.records = this.records.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlValues);
