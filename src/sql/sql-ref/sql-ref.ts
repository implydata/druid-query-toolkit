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

import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlRefValue extends SqlBaseValue {
  column?: string;
  quotes?: string;
  table?: string;
  tableQuotes?: string;
  namespace?: string;
  namespaceQuotes?: string;
}

export class SqlRef extends SqlBase {
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
    } as SqlRefValue);
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

  public column?: string;
  public quotes?: string;
  public namespace?: string;
  public namespaceQuotes?: string;
  public table?: string;
  public tableQuotes?: string;

  constructor(options: SqlRefValue) {
    super(options, SqlRef.type);
    this.column = options.column;
    this.quotes = options.quotes;
    this.namespace = options.namespace;
    this.namespaceQuotes = options.namespaceQuotes;
    this.table = options.table;
    this.tableQuotes = options.tableQuotes;
  }

  public valueOf() {
    const value: any = super.valueOf();
    value.column = this.column;
    value.namespace = this.namespace;
    value.table = this.table;
    value.quotes = this.quotes;
    value.namespaceQuotes = this.namespaceQuotes;
    value.tableQuotes = this.tableQuotes;
    value.namespaceQuotes = this.namespaceQuotes;
    return value as SqlRefValue;
  }
  public assemblePart(
    main?: string,
    quotes?: string,
    preDotSpacing?: string,
    dot?: string,
    posDotSpacing?: string,
  ) {
    return [SqlRef.wrapInQuotes(main || '', quotes || ''), preDotSpacing, dot, posDotSpacing].join(
      '',
    );
  }
  public toRawString(): string {
    return [
      this.assemblePart(
        this.namespace,
        this.namespaceQuotes,
        this.innerSpacing.preNamespaceDot,
        this.namespace && this.table ? '.' : '',
        this.innerSpacing.postNamespaceDot,
      ),
      this.assemblePart(
        this.table,
        this.tableQuotes,
        this.innerSpacing.preTableDot,
        this.column && this.table ? '.' : '',
        this.innerSpacing.postTableDot,
      ),
      SqlRef.wrapInQuotes(this.column || '', this.quotes || ''),
    ].join('');
  }

  public upgrade() {
    const value = this.valueOf();
    if (value.namespace && value.table && value.column) return this;
    value.namespace = value.table;
    value.namespaceQuotes = value.tableQuotes;
    value.innerSpacing.preNamespace = value.innerSpacing.preTable;
    value.innerSpacing.preNamespace = value.innerSpacing.postTable;

    value.table = value.column;
    value.tableQuotes = value.quotes;
    value.innerSpacing.postTable = '';
    value.innerSpacing.preTable = '';

    value.column = undefined;
    value.quotes = undefined;

    return new SqlRef(value);
  }
  public getColumn(): string {
    if (!this.column) throw Error('Sql ref has no defined column');
    return this.column;
  }
  public getTable(): string {
    if (!this.table) throw Error('Sql ref has no defined table');
    return this.table;
  }
}
SqlBase.register(SqlRef.type, SqlRef);
