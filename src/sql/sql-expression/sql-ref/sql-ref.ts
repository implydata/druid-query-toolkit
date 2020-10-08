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

import { SqlBase, SqlBaseValue, SqlType } from '../../sql-base';
import { trimString } from '../../utils';
import { SqlExpression } from '../sql-expression';

export interface SqlRefValue extends SqlBaseValue {
  column?: string;
  quotes?: boolean;
  table?: string;
  tableQuotes?: boolean;
  namespace?: string;
  namespaceQuotes?: boolean;
}

export class SqlRef extends SqlExpression {
  static type: SqlType = 'ref';

  static STAR: SqlRef;

  static column(
    column: string,
    table?: string,
    namespace?: string,
    forceQuotes = false,
    forceTableQuotes = false,
    forceNamespaceQuotes = false,
  ) {
    if (column === '*') return SqlRef.STAR;
    return new SqlRef({
      column,
      table,
      namespace,
      quotes: forceQuotes || SqlRef.needsQuotes(column),
      tableQuotes: forceTableQuotes || SqlRef.needsQuotes(table),
      namespaceQuotes: forceNamespaceQuotes || SqlRef.needsQuotes(namespace),
    });
  }

  static columnWithQuotes(column: string, table?: string, namespace?: string) {
    return new SqlRef({
      column,
      table,
      namespace,
      quotes: true,
      tableQuotes: Boolean(table),
      namespaceQuotes: Boolean(namespace),
    });
  }

  static table(
    table?: string,
    namespace?: string,
    forceTableQuotes = false,
    forceNamespaceQuotes = false,
  ) {
    return new SqlRef({
      table,
      namespace,
      tableQuotes: forceTableQuotes || SqlRef.needsQuotes(table),
      namespaceQuotes: forceNamespaceQuotes || SqlRef.needsQuotes(namespace),
    });
  }

  static needsQuotes(name: string | undefined): boolean {
    if (typeof name === 'undefined') return false;
    return !/^\w+$/.test(name) || SqlBase.isReservedKeyword(name);
  }

  static wrapInQuotes(thing: string = '', quotes = false): string {
    if (!thing) return '';
    if (quotes) {
      return `"${thing}"`;
    } else {
      return thing;
    }
  }

  static _equalsString(expression: SqlBase, stringValue: string): boolean {
    return (
      expression instanceof SqlRef &&
      (expression.column === stringValue ||
        expression.table === stringValue ||
        expression.namespace === stringValue)
    );
  }

  public readonly column?: string;
  public readonly quotes: boolean;
  public readonly namespace?: string;
  public readonly namespaceQuotes: boolean;
  public readonly table?: string;
  public readonly tableQuotes: boolean;

  constructor(options: SqlRefValue) {
    super(options, SqlRef.type);
    this.column = options.column;
    this.quotes = Boolean(options.quotes);
    this.namespace = options.namespace;
    this.namespaceQuotes = Boolean(options.namespaceQuotes);
    this.table = options.table;
    this.tableQuotes = Boolean(options.tableQuotes);
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

  protected _toRawString(): string {
    return [
      SqlRef.wrapInQuotes(this.namespace, this.namespaceQuotes),

      this.getSpace('preNamespaceDot', ''),
      this.namespace && this.table ? '.' : '',
      this.getSpace('postNamespaceDot', ''),

      SqlRef.wrapInQuotes(this.table, this.tableQuotes),

      this.getSpace('preTableDot', ''),
      this.column && this.table ? '.' : '',
      this.getSpace('postTableDot', ''),

      SqlRef.wrapInQuotes(this.column, this.quotes),
    ].join('');
  }

  public getColumn(): string {
    if (!this.column) throw Error('SqlRef has no defined column');
    return this.column;
  }

  public changeColumn(column: string): SqlRef {
    const value = this.valueOf();
    value.column = column;
    if (column && column !== '*') {
      value.quotes = value.quotes || SqlRef.needsQuotes(column);
    } else {
      delete value.quotes;
    }
    return SqlBase.fromValue(value);
  }

  public getTable(): string {
    if (!this.table) throw Error('SqlRef has no defined table');
    return this.table;
  }

  public changeTable(table: string): SqlRef {
    const value = this.valueOf();
    value.table = table;
    if (table) {
      value.tableQuotes = value.tableQuotes || SqlRef.needsQuotes(table);
    }
    return SqlBase.fromValue(value);
  }

  public getNamespace(): string {
    if (!this.namespace) throw Error('SqlRef has no defined namespace');
    return this.namespace;
  }

  public changeNamespace(namespace: string): SqlRef {
    const value = this.valueOf();
    value.namespace = namespace;
    if (namespace) {
      value.namespaceQuotes = value.namespaceQuotes || SqlRef.needsQuotes(namespace);
    }
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
    if (this.namespace) return this;

    const value = this.valueOf();
    value.namespace = value.table;
    value.namespaceQuotes = value.tableQuotes;
    // value.spacing.preNamespace = value.spacing.preTable;
    // value.spacing.preNamespace = value.spacing.postTable;

    value.table = value.column;
    value.tableQuotes = value.quotes;
    // value.spacing.postTable = '';
    // value.spacing.preTable = '';

    delete value.column;
    delete value.quotes;

    return new SqlRef(value);
  }

  public prettyTrim(maxLength: number): SqlBase {
    const { column, table } = this;
    let ret: SqlRef = this;
    if (column && column !== '*') {
      ret = ret.changeColumn(trimString(column, maxLength));
    }
    if (table) {
      ret = ret.changeTable(trimString(table, maxLength));
    }
    return ret;
  }
}

SqlBase.register(SqlRef);

SqlRef.STAR = new SqlRef({
  column: '*',
});
