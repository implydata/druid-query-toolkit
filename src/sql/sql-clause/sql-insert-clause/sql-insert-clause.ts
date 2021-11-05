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

import { SqlBase, SqlType, Substitutor } from '../../sql-base';
import { SqlExpression } from '../../sql-expression';
import { SqlTableRef } from '../../sql-table-ref/sql-table-ref';
import { SqlClause, SqlClauseValue } from '../sql-clause';

export interface SqlInsertClauseValue extends SqlClauseValue {
  table: SqlTableRef;
}

export class SqlInsertClause extends SqlClause {
  static type: SqlType = 'insertClause';

  static readonly DEFAULT_INSERT_KEYWORD = 'INSERT';
  static readonly DEFAULT_INTO_KEYWORD = 'INTO';

  static create(table: SqlInsertClause | SqlTableRef | string): SqlInsertClause {
    if (table instanceof SqlInsertClause) return table;
    if (typeof table === 'string') {
      table = SqlTableRef.create(table);
    }
    return new SqlInsertClause({
      table,
    });
  }

  public readonly table: SqlTableRef;

  constructor(options: SqlInsertClauseValue) {
    super(options, SqlInsertClause.type);
    this.table = options.table;
  }

  public valueOf(): SqlInsertClauseValue {
    const value = super.valueOf() as SqlInsertClauseValue;
    value.table = this.table;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('insert', SqlInsertClause.DEFAULT_INSERT_KEYWORD),
      this.getSpace('postInsert'),
      this.getKeyword('into', SqlInsertClause.DEFAULT_INTO_KEYWORD),
      this.getSpace('postInto'),
      this.table.toString(),
    ].join('');
  }

  public changeTable(table: SqlTableRef | string): this {
    const value = this.valueOf();
    if (typeof table === 'string') {
      table = SqlTableRef.create(table);
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
    if (!(table instanceof SqlTableRef)) {
      throw new Error('must return table');
    }
    if (table !== this.table) {
      ret = ret.changeTable(table);
    }

    return ret;
  }
}

SqlBase.register(SqlInsertClause);
