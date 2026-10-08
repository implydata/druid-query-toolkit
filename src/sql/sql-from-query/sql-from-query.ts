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
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlNamespace } from '../sql-namespace/sql-namespace';
import type { SqlQueryBaseValue } from '../sql-query-base/sql-query-base';
import { SqlQueryBase } from '../sql-query-base/sql-query-base';
import { SqlTable } from '../sql-table/sql-table';

export interface SqlFromQueryValue extends SqlQueryBaseValue {
  table: SqlTable;
}

/**
 * A pipe syntax `FROM <table>` query. It is usually followed by pipe operators, which turn it
 * into a SqlPipesQuery, but it is also a query on its own.
 */
export class SqlFromQuery extends SqlQueryBase {
  static type: SqlTypeDesignator = 'fromQuery';

  static DEFAULT_FROM_KEYWORD = 'FROM';

  static create(table: SqlFromQuery | SqlTable | string): SqlFromQuery {
    if (table instanceof SqlFromQuery) return table;
    return new SqlFromQuery({
      table: SqlTable.create(table),
    });
  }

  static optionalQuotes(table: SqlFromQuery | SqlTable | string): SqlFromQuery {
    if (table instanceof SqlFromQuery) return table;
    return new SqlFromQuery({
      table: SqlTable.optionalQuotes(table),
    });
  }

  public readonly table: SqlTable;

  constructor(options: SqlFromQueryValue) {
    super(options, SqlFromQuery.type);
    this.table = options.table;
  }

  public valueOf(): SqlFromQueryValue {
    const value = super.valueOf() as SqlFromQueryValue;
    value.table = this.table;
    return value;
  }

  protected _toRawBodyString(): string {
    return [
      this.getKeyword('from', SqlFromQuery.DEFAULT_FROM_KEYWORD),
      this.getSpace('postFrom', SPACE),
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

  protected _walkInnerBody(
    ret: this,
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): this | undefined {
    const table = this.table._walkHelper(nextStack, fn, postorder);
    if (!table) return;
    if (table !== this.table) {
      return ret.changeTable(table as SqlTable);
    }

    return ret;
  }
}

SqlBase.register(SqlFromQuery);
