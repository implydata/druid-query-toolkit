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

import type { SqlQuery, SqlValues } from '../..';
import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import { SqlColumnList } from '../../sql-column-list/sql-column-list';
import type { SeparatedArray } from '../../utils';
import { RefName } from '../../utils';

export interface SqlWithPartValue extends SqlBaseValue {
  table: RefName;
  columns?: SqlColumnList;
  query: SqlQuery | SqlValues;
}

export class SqlWithPart extends SqlBase {
  static type: SqlTypeDesignator = 'withPart';

  static DEFAULT_AS_KEYWORD = 'AS';

  static simple(name: string, query: SqlQuery): SqlWithPart {
    return new SqlWithPart({
      table: RefName.create(name),
      query: query.ensureParens(),
    });
  }

  public readonly table: RefName;
  public readonly columns?: SqlColumnList;
  public readonly query: SqlQuery | SqlValues;

  constructor(options: SqlWithPartValue) {
    super(options, SqlWithPart.type);
    this.table = options.table;
    this.columns = options.columns;
    this.query = options.query;
  }

  public valueOf(): SqlWithPartValue {
    const value = super.valueOf() as SqlWithPartValue;
    value.table = this.table;
    value.columns = this.columns;
    value.query = this.query;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [this.table.toString(), this.getSpace('postTable')];

    if (this.columns) {
      rawParts.push(this.columns.toString(), this.getSpace('postColumns'));
    }

    rawParts.push(
      this.getKeyword('as', SqlWithPart.DEFAULT_AS_KEYWORD),
      this.getSpace('postAs'),
      this.query.toString(),
    );

    return rawParts.join('');
  }

  public changeTable(table: RefName): this {
    const value = this.valueOf();
    value.table = table;
    return SqlBase.fromValue(value);
  }

  public changeColumns(
    columns: SqlColumnList | SeparatedArray<RefName> | RefName[] | undefined,
  ): this {
    const value = this.valueOf();
    if (!columns) {
      value.spacing = this.getSpacingWithout('postColumns');
      delete value.columns;
    } else if (columns instanceof SqlColumnList) {
      value.columns = columns;
    } else {
      value.columns = this.columns
        ? this.columns.changeColumns(columns)
        : SqlColumnList.create(columns);
    }
    return SqlBase.fromValue(value);
  }

  public changeQuery(query: SqlQuery): this {
    const value = this.valueOf();
    value.query = query;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const query = this.query._walkHelper(nextStack, fn, postorder);
    if (!query) return;
    if (query !== this.query) {
      ret = ret.changeQuery(query as SqlQuery);
    }

    return ret;
  }
}

SqlBase.register(SqlWithPart);
