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

import type { SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import type { SqlColumnList } from '../../sql-column-list/sql-column-list';
import { SqlExpression } from '../../sql-expression';
import { SqlTable } from '../../sql-table/sql-table';
import { NEWLINE } from '../../utils';
import type { SqlClauseValue } from '../sql-clause';
import { SqlClause } from '../sql-clause';

export interface SqlInsertClauseValue extends SqlClauseValue {
  table: SqlExpression;
  columns?: SqlColumnList;
  format?: string;
}

export class SqlInsertClause extends SqlClause {
  static type: SqlTypeDesignator = 'insertClause';

  static readonly DEFAULT_INSERT_KEYWORD = 'INSERT';
  static readonly DEFAULT_INTO_KEYWORD = 'INTO';
  static readonly DEFAULT_AS_KEYWORD = 'AS';

  static create(table: SqlInsertClause | SqlExpression | string): SqlInsertClause {
    if (table instanceof SqlInsertClause) return table;
    if (typeof table === 'string') {
      table = SqlTable.create(table);
    }
    return new SqlInsertClause({
      table: SqlExpression.verify(table),
    });
  }

  public readonly table: SqlExpression;
  public readonly columns?: SqlColumnList;
  public readonly format?: string;

  constructor(options: SqlInsertClauseValue) {
    super(options, SqlInsertClause.type);
    this.table = options.table;
    this.columns = options.columns;
    this.format = options.format;
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

    if (this.format) {
      rawParts.push(
        this.getSpace('preAs', NEWLINE),
        this.getKeyword('as', SqlInsertClause.DEFAULT_AS_KEYWORD),
        this.getSpace('preFormat'),
        this.format,
      );
    }

    return rawParts.join('');
  }

  public changeTable(table: SqlExpression | string): this {
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
    if (!(table instanceof SqlExpression)) {
      throw new Error('must return expression');
    }
    if (table !== this.table) {
      ret = ret.changeTable(table);
    }

    return ret;
  }
}

SqlBase.register(SqlInsertClause);
