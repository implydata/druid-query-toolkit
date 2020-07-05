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

import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SqlExpression, SqlRef } from '../../sql-expression';
import { SeparatedArray } from '../../utils';
import { SqlQuery } from '../sql-query';

export interface SqlWithPartValue extends SqlBaseValue {
  withTable: SqlExpression;
  withColumns?: SeparatedArray<SqlRef>;
  postWithColumns: string;
  asKeyword: string;
  withQuery: SqlQuery;
}

export class SqlWithPart extends SqlBase {
  static type = 'withPart';

  public readonly withTable: SqlExpression;
  public readonly withColumns?: SeparatedArray<SqlRef>;
  public readonly postWithColumns: string;
  public readonly asKeyword: string;
  public readonly withQuery: SqlQuery;

  constructor(options: SqlWithPartValue) {
    super(options, SqlWithPart.type);
    this.withTable = options.withTable;
    this.withColumns = options.withColumns;
    this.postWithColumns = options.postWithColumns;
    this.asKeyword = options.asKeyword;
    this.withQuery = options.withQuery;
  }

  public valueOf(): SqlWithPartValue {
    const value = super.valueOf() as SqlWithPartValue;
    value.withTable = this.withTable;
    value.withColumns = this.withColumns;
    value.postWithColumns = this.postWithColumns;
    value.asKeyword = this.asKeyword;
    value.withQuery = this.withQuery;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [this.withTable.toString(), this.getInnerSpace('postWithTable')];

    if (this.withColumns) {
      rawParts.push(
        '(',
        this.getInnerSpace('postLeftParen'),
        this.withColumns.toString('\n'),
        this.getInnerSpace('preRightParen'),
        ')',
        this.getInnerSpace('postWithColumns'),
      );
    }

    rawParts.push(this.asKeyword, this.getInnerSpace('postAs'), this.withQuery.toString());

    return rawParts.join('');
  }

  public changeWithTable(withTable: SqlExpression): this {
    const value = this.valueOf();
    value.withTable = withTable;
    return SqlBase.fromValue(value);
  }

  public changeWithColumns(withColumns: SeparatedArray<SqlRef>): this {
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

    const withTable = this.withTable._walkHelper(nextStack, fn, postorder);
    if (!withTable) return;
    if (withTable !== this.withTable) {
      ret = ret.changeWithTable(withTable);
    }

    if (this.withColumns) {
      const withColumns = SqlBase.walkSeparatedArray(this.withColumns, nextStack, fn, postorder);
      if (!withColumns) return;
      if (withColumns !== this.withColumns) {
        ret = ret.changeWithColumns(withColumns);
      }
    }

    const withQuery = this.withQuery._walkHelper(nextStack, fn, postorder);
    if (!withQuery) return;
    if (withQuery !== this.withQuery) {
      ret = ret.changeWithQuery(withQuery as SqlQuery);
    }

    return ret;
  }

  public clearSeparators(): this {
    if (!this.withColumns) return this;
    const value = this.valueOf();
    value.withColumns = this.withColumns.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlWithPart.type, SqlWithPart);
