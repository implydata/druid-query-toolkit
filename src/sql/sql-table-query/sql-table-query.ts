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

import { SPACE } from '../helpers';
import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import type { SqlNamespace } from '../sql-namespace/sql-namespace';
import { SqlTable } from '../sql-table/sql-table';

export interface SqlTableQueryValue extends SqlBaseValue {
  table: SqlTable;
}

export class SqlTableQuery extends SqlExpression {
  static type: SqlTypeDesignator = 'tableQuery';

  static DEFAULT_TABLE_KEYWORD = 'TABLE';

  static create(table: SqlTableQuery | SqlTable | string): SqlTableQuery {
    if (table instanceof SqlTableQuery) return table;
    return new SqlTableQuery({
      table: SqlTable.create(table),
    });
  }

  static optionalQuotes(table: SqlTableQuery | SqlTable | string): SqlTableQuery {
    if (table instanceof SqlTableQuery) return table;
    return new SqlTableQuery({
      table: SqlTable.optionalQuotes(table),
    });
  }

  public readonly table: SqlTable;

  constructor(options: SqlTableQueryValue) {
    super(options, SqlTableQuery.type);
    this.table = options.table;
  }

  public valueOf(): SqlTableQueryValue {
    const value = super.valueOf() as SqlTableQueryValue;
    value.table = this.table;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('table', SqlTableQuery.DEFAULT_TABLE_KEYWORD),
      this.getSpace('postTable', SPACE),
      this.table.toString(),
    ].join('');
  }

  public changeTable(table: SqlTable | string): this {
    const value = this.valueOf();
    value.table = SqlTable.create(table);
    return SqlBase.fromValue(value);
  }

  public getTableName(): string {
    return this.table.getName();
  }

  public changeTableName(name: string): this {
    return this.changeTable(this.table.changeName(name));
  }

  public getNamespaceName(): string | undefined {
    return this.table.getNamespaceName();
  }

  public changeNamespace(namespace: SqlNamespace | undefined): this {
    return this.changeTable(this.table.changeNamespace(namespace));
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const table = this.table._walkHelper(nextStack, fn, postorder);
    if (!table) return;
    if (table !== this.table) {
      ret = ret.changeTable(table as SqlTable);
    }

    return ret;
  }
}

SqlBase.register(SqlTableQuery);
