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

import { SqlQuery } from '../..';
import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../../sql-base';
import { RefName, SeparatedArray } from '../../utils';

export interface SqlWithPartValue extends SqlBaseValue {
  withTable: RefName;
  withColumns?: SeparatedArray<RefName>;
  withQuery: SqlQuery;
}

export class SqlWithPart extends SqlBase {
  static type: SqlType = 'withPart';

  static DEFAULT_AS_KEYWORD = 'AS';

  static simple(name: string, query: SqlQuery): SqlWithPart {
    return new SqlWithPart({
      withTable: RefName.create(name),
      withQuery: query,
    });
  }

  public readonly withTable: RefName;
  public readonly withColumns?: SeparatedArray<RefName>;
  public readonly withQuery: SqlQuery;

  constructor(options: SqlWithPartValue) {
    super(options, SqlWithPart.type);
    this.withTable = options.withTable;
    this.withColumns = options.withColumns;
    this.withQuery = options.withQuery;
  }

  public valueOf(): SqlWithPartValue {
    const value = super.valueOf() as SqlWithPartValue;
    value.withTable = this.withTable;
    value.withColumns = this.withColumns;
    value.withQuery = this.withQuery;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [this.withTable.toString(), this.getSpace('postWithTable')];

    if (this.withColumns) {
      rawParts.push(
        '(',
        this.getSpace('postLeftParen'),
        this.withColumns.toString('\n'),
        this.getSpace('preRightParen'),
        ')',
        this.getSpace('postWithColumns'),
      );
    }

    rawParts.push(
      this.getKeyword('as', SqlWithPart.DEFAULT_AS_KEYWORD),
      this.getSpace('postAs'),
      this.withQuery.toString(),
    );

    return rawParts.join('');
  }

  public changeWithTable(withTable: RefName): this {
    const value = this.valueOf();
    value.withTable = withTable;
    return SqlBase.fromValue(value);
  }

  public changeWithColumns(withColumns: SeparatedArray<RefName>): this {
    const value = this.valueOf();
    value.withColumns = withColumns;
    return SqlBase.fromValue(value);
  }

  public changeWithQuery(withQuery: SqlQuery): this {
    const value = this.valueOf();
    value.withQuery = withQuery;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const withQuery = this.withQuery._walkHelper(nextStack, fn, postorder);
    if (!withQuery) return;
    if (withQuery !== this.withQuery) {
      ret = ret.changeWithQuery(withQuery as SqlQuery);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    if (!this.withColumns) return this;
    const value = this.valueOf();
    value.withColumns = this.withColumns.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlWithPart);
