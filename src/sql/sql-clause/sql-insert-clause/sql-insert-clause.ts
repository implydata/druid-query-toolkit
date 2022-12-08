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

import { SqlBase, SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlColumnList } from '../../sql-column-list/sql-column-list';
import { SqlTable } from '../../sql-table/sql-table';
import { SqlClause, SqlClauseValue } from '../sql-clause';

export interface SqlInsertClauseValue extends SqlClauseValue {
  table: SqlTable;
  columns?: SqlColumnList;
}

export class SqlInsertClause extends SqlClause {
  static type: SqlTypeDesignator = 'insertClause';

  static readonly DEFAULT_INSERT_KEYWORD = 'INSERT';
  static readonly DEFAULT_INTO_KEYWORD = 'INTO';

  static create(table: SqlInsertClause | SqlTable | string): SqlInsertClause {
    if (table instanceof SqlInsertClause) return table;
    if (typeof table === 'string') {
      table = SqlTable.create(table);
    }
    return new SqlInsertClause({
      table,
    });
  }

  public readonly table: SqlTable;
  public readonly columns?: SqlColumnList;

  constructor(options: SqlInsertClauseValue) {
    super(options, SqlInsertClause.type);
    this.table = options.table;
    this.columns = options.columns;
  }

  public valueOf(): SqlInsertClauseValue {
    const value = super.valueOf() as SqlInsertClauseValue;
    value.table = this.table;
    value.columns = this.columns;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.getKeyword('insert', SqlInsertClause.DEFAULT_INSERT_KEYWORD),
      this.getSpace('postInsert'),
      this.getKeyword('into', SqlInsertClause.DEFAULT_INTO_KEYWORD),
      this.getSpace('postInto'),
      this.table.toString(),
    ];

    if (this.columns) {
      rawParts.push(this.getSpace('preColumns'), this.columns.toString());
    }

    return rawParts.join('');
  }

  public changeTable(table: SqlTable | string): this {
    const value = this.valueOf();
    if (typeof table === 'string') {
      table = SqlTable.create(table);
    }
    value.table = table;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    const table = this.table._walkHelper(nextStack, fn, postorder);
    if (!table) return;
    if (!(table instanceof SqlTable)) {
      throw new Error('must return table');
    }
    if (table !== this.table) {
      ret = ret.changeTable(table);
    }

    return ret;
  }
}

SqlBase.register(SqlInsertClause);
