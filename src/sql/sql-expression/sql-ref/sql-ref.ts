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

import { SqlBase, SqlBaseValue } from '../../sql-base';
import { SqlExpression } from '../sql-expression';

export interface SqlRefValue extends SqlBaseValue {
  column?: string;
  quotes?: string;
  table?: string;
  tableQuotes?: string;
  namespace?: string;
  namespaceQuotes?: string;
}

export class SqlRef extends SqlExpression {
  static type = 'ref';

  static fromString(
    column: string,
    table?: string,
    namespace?: string,
    quotes?: string,
    tableQuotes?: string,
    namespaceQuotes?: string,
  ) {
    return new SqlRef({
      column: column,
      table: table,
      namespace: namespace,
      quotes: quotes,
      tableQuotes: tableQuotes,
      namespaceQuotes: namespaceQuotes,
    });
  }
  static fromStringWithDoubleQuotes(column: string) {
    return new SqlRef({ column: column, quotes: '"' } as SqlRefValue);
  }

  static wrapInQuotes(thing?: string, quote?: string): string {
    if (!thing) return '';
    return `${quote}${thing}${quote}`;
  }

  static equalsString(expression: SqlBase, stringValue: string): boolean {
    return (
      expression instanceof SqlRef &&
      (expression.column === stringValue ||
        expression.table === stringValue ||
        expression.namespace === stringValue)
    );
  }

  public readonly column?: string;
  public readonly quotes?: string;
  public readonly namespace?: string;
  public readonly namespaceQuotes?: string;
  public readonly table?: string;
  public readonly tableQuotes?: string;

  constructor(options: SqlRefValue) {
    super(options, SqlRef.type);
    this.column = options.column;
    this.quotes = options.quotes;
    this.namespace = options.namespace;
    this.namespaceQuotes = options.namespaceQuotes;
    this.table = options.table;
    this.tableQuotes = options.tableQuotes;
  }

  public valueOf(): SqlRefValue {
    const value = super.valueOf() as SqlRefValue;
    value.column = this.column;
    value.namespace = this.namespace;
    value.table = this.table;
    value.quotes = this.quotes;
    value.namespaceQuotes = this.namespaceQuotes;
    value.tableQuotes = this.tableQuotes;
    value.namespaceQuotes = this.namespaceQuotes;
    return value;
  }

  public toRawString(): string {
    return [
      SqlRef.wrapInQuotes(this.namespace || '', this.namespaceQuotes || ''),

      this.getInnerSpace('preNamespaceDot', ''),
      this.namespace && this.table ? '.' : '',
      this.getInnerSpace('postNamespaceDot', ''),

      SqlRef.wrapInQuotes(this.table || '', this.tableQuotes || ''),

      this.getInnerSpace('preTableDot', ''),
      this.column && this.table ? '.' : '',
      this.getInnerSpace('postTableDot', ''),

      SqlRef.wrapInQuotes(this.column || '', this.quotes || ''),
    ].join('');
  }

  public getColumn(): string {
    if (!this.column) throw Error('SqlRef has no defined column');
    return this.column;
  }

  public changeColumn(column: string): SqlRef {
    const value = this.valueOf();
    value.column = column;
    return SqlBase.fromValue(value);
  }

  public getTable(): string {
    if (!this.table) throw Error('SqlRef has no defined table');
    return this.table;
  }

  public changeTable(table: string): SqlRef {
    const value = this.valueOf();
    value.table = table;
    return SqlBase.fromValue(value);
  }

  public getName(): string {
    const name = this.column || this.table;
    if (!name) throw new Error('SqlRef has no defined table or column');
    return name;
  }

  public isStar(): boolean {
    return this.column === '*';
  }

  public upgrade() {
    if (this.namespace && this.table && this.column) return this;

    const value = this.valueOf();
    value.namespace = value.table;
    value.namespaceQuotes = value.tableQuotes;
    // value.innerSpacing.preNamespace = value.innerSpacing.preTable;
    // value.innerSpacing.preNamespace = value.innerSpacing.postTable;

    value.table = value.column;
    value.tableQuotes = value.quotes;
    // value.innerSpacing.postTable = '';
    // value.innerSpacing.preTable = '';

    delete value.column;
    delete value.quotes;

    return new SqlRef(value);
  }
}

SqlBase.register(SqlRef.type, SqlRef);
