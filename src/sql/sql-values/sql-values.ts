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

import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import { SqlRecord } from '../sql-record/sql-record';
import { SeparatedArray, Separator } from '../utils';

export interface SqlValuesValue extends SqlBaseValue {
  records: SeparatedArray<SqlRecord>;
}

export class SqlValues extends SqlExpression {
  static type: SqlType = 'values';

  static DEFAULT_VALUES_KEYWORD = 'VALUES';

  static create(records: SqlValues | SeparatedArray<SqlRecord> | SqlRecord[]): SqlValues {
    if (records instanceof SqlValues) return records;
    return new SqlValues({
      records: SeparatedArray.fromArray(records, Separator.COMMA),
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

  protected _toRawString(): string {
    return [
      this.getKeyword('values', SqlValues.DEFAULT_VALUES_KEYWORD),
      this.getSpace('postValues'),
      this.records.toString(Separator.COMMA),
    ].join('');
  }

  public changeRecords(records: SeparatedArray<SqlRecord> | SqlRecord[]): this {
    const value = this.valueOf();
    value.records = SeparatedArray.fromArray(records, Separator.COMMA);
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const records = SqlBase.walkSeparatedArray(this.records, nextStack, fn, postorder);
    if (!records) return;
    if (records !== this.records) {
      ret = ret.changeRecords(records);
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
