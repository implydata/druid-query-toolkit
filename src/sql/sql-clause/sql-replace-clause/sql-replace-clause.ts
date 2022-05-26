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
import { SqlColumnList } from '../../sql-column-list/sql-column-list';
import { SqlExpression } from '../../sql-expression';
import { SqlTableRef } from '../../sql-table-ref/sql-table-ref';
import { SqlClause, SqlClauseValue } from '../sql-clause';
import { SqlWhereClause } from '../sql-where-clause/sql-where-clause';

export interface SqlReplaceClauseValue extends SqlClauseValue {
  table: SqlTableRef;
  columns?: SqlColumnList;
  whereClause?: SqlWhereClause;
}

export class SqlReplaceClause extends SqlClause {
  static type: SqlType = 'replaceClause';

  static readonly DEFAULT_REPLACE_KEYWORD = 'REPLACE';
  static readonly DEFAULT_INTO_KEYWORD = 'INTO';
  static readonly DEFAULT_OVERWRITE_KEYWORD = 'OVERWRITE';
  static readonly DEFAULT_ALL_KEYWORD = 'ALL';

  static create(
    table: SqlReplaceClause | SqlTableRef | string,
    where?: SqlWhereClause | SqlExpression | string,
  ): SqlReplaceClause {
    if (table instanceof SqlReplaceClause) return table;
    if (typeof table === 'string') {
      table = SqlTableRef.create(table);
    }

    let whereClause: SqlWhereClause | undefined;
    if (where) {
      whereClause = where instanceof SqlWhereClause ? where : SqlWhereClause.create(where);
    }

    return new SqlReplaceClause({
      table,
      whereClause,
    });
  }

  public readonly table: SqlTableRef;
  public readonly columns?: SqlColumnList;
  public readonly whereClause?: SqlWhereClause;

  constructor(options: SqlReplaceClauseValue) {
    super(options, SqlReplaceClause.type);
    this.table = options.table;
    this.columns = options.columns;
    this.whereClause = options.whereClause;
  }

  public valueOf(): SqlReplaceClauseValue {
    const value = super.valueOf() as SqlReplaceClauseValue;
    value.table = this.table;
    value.columns = this.columns;
    value.whereClause = this.whereClause;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.getKeyword('replace', SqlReplaceClause.DEFAULT_REPLACE_KEYWORD),
      this.getSpace('postReplace'),
      this.getKeyword('into', SqlReplaceClause.DEFAULT_INTO_KEYWORD),
      this.getSpace('postInto'),
      this.table.toString(),
    ];

    if (this.columns) {
      rawParts.push(this.getSpace('preColumns'), this.columns.toString());
    }

    rawParts.push(
      this.getSpace('preOverwrite'),
      this.getKeyword('overwrite', SqlReplaceClause.DEFAULT_OVERWRITE_KEYWORD),
      this.getSpace('postOverwrite'),
    );

    if (this.whereClause) {
      rawParts.push(this.whereClause.toString());
    } else {
      rawParts.push(this.getKeyword('all', SqlReplaceClause.DEFAULT_ALL_KEYWORD));
    }

    return rawParts.join('');
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

    if (this.whereClause) {
      const whereClause = this.whereClause._walkHelper(nextStack, fn, postorder);
      if (!whereClause) return;
      if (whereClause !== this.whereClause) {
        ret = ret.changeWhereClause(whereClause as SqlWhereClause);
      }
    }

    return ret;
  }

  public changeWhereClause(whereClause: SqlWhereClause | undefined): this {
    const value = this.valueOf();
    if (whereClause) {
      value.whereClause = whereClause;
    } else {
      delete value.whereClause;
      value.keywords = this.getKeywordsWithout('filter');
    }
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlReplaceClause);
