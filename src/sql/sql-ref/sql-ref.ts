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

import { SqlBase, SqlBaseValue, SqlType } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import { SqlTableRef } from '../sql-table-ref/sql-table-ref';
import { RefName } from '../utils';

export interface SqlRefValue extends SqlBaseValue {
  columnRefName: RefName;
  tableRefName?: RefName;
  namespaceRefName?: RefName;
}

export class SqlRef extends SqlExpression {
  static type: SqlType = 'ref';

  static column(
    column: string,
    table?: string,
    namespace?: string,
    forceQuotes?: boolean,
    forceTableQuotes?: boolean,
    forceNamespaceQuotes?: boolean,
  ) {
    return new SqlRef({
      columnRefName: RefName.create(column, forceQuotes),
      tableRefName: RefName.maybe(table, forceTableQuotes),
      namespaceRefName: RefName.maybe(namespace, forceNamespaceQuotes),
    });
  }

  static columnWithQuotes(column: string, table?: string, namespace?: string) {
    return new SqlRef({
      columnRefName: RefName.create(column, true),
      tableRefName: RefName.maybe(table, true),
      namespaceRefName: RefName.maybe(namespace, true),
    });
  }

  static columnWithoutQuotes(column: string, table?: string, namespace?: string) {
    return new SqlRef({
      columnRefName: RefName.create(column, false),
      tableRefName: RefName.maybe(table, false),
      namespaceRefName: RefName.maybe(namespace, false),
    });
  }

  public readonly columnRefName: RefName;
  public readonly tableRefName?: RefName;
  public readonly namespaceRefName?: RefName;

  constructor(options: SqlRefValue) {
    super(options, SqlRef.type);
    this.columnRefName = options.columnRefName;
    this.tableRefName = options.tableRefName;
    this.namespaceRefName = options.namespaceRefName;
  }

  public valueOf(): SqlRefValue {
    const value = super.valueOf() as SqlRefValue;
    value.columnRefName = this.columnRefName;
    value.tableRefName = this.tableRefName;
    value.namespaceRefName = this.namespaceRefName;
    return value;
  }

  protected _toRawString(): string {
    const { namespaceRefName, tableRefName, columnRefName } = this;
    const rawParts: string[] = [];

    if (namespaceRefName) {
      rawParts.push(
        namespaceRefName.toString(),
        this.getSpace('preNamespaceDot', ''),
        '.',
        this.getSpace('postNamespaceDot', ''),
      );
    }

    if (tableRefName) {
      rawParts.push(
        tableRefName.toString(),
        this.getSpace('preTableDot', ''),
        '.',
        this.getSpace('postTableDot', ''),
      );
    }

    rawParts.push(columnRefName.toString());

    return rawParts.join('');
  }

  public changeColumnRefName(columnRefName: RefName): this {
    const value = this.valueOf();
    value.columnRefName = columnRefName;
    return SqlBase.fromValue(value);
  }

  public getColumn(): string {
    return this.columnRefName.name;
  }

  public changeColumn(column: string): this {
    const { columnRefName } = this;
    if (!columnRefName) return this;
    const value = this.valueOf();
    value.columnRefName = columnRefName.changeName(column);
    return SqlBase.fromValue(value);
  }

  public changeTableRefName(tableRefName: RefName | undefined): this {
    const value = this.valueOf();
    if (tableRefName) {
      value.tableRefName = tableRefName;
    } else {
      delete value.tableRefName;
      delete value.namespaceRefName;
      value.spacing = this.getSpacingWithout(
        'preTableDot',
        'postTableDot',
        'preNamespaceDot',
        'postNamespaceDot',
      );
    }
    return SqlBase.fromValue(value);
  }

  public getTable(): string | undefined {
    return this.tableRefName?.name;
  }

  public changeTable(table: string | undefined): this {
    return this.changeTableRefName(
      table
        ? this.tableRefName
          ? this.tableRefName.changeName(table)
          : RefName.create(table)
        : undefined,
    );
  }

  public changeNamespaceRefName(namespaceRefName: RefName | undefined): this {
    const value = this.valueOf();
    if (namespaceRefName) {
      value.namespaceRefName = namespaceRefName;
    } else {
      delete value.namespaceRefName;
      value.spacing = this.getSpacingWithout('preNamespaceDot', 'postNamespaceDot');
    }
    return SqlBase.fromValue(value);
  }

  public getNamespace(): string | undefined {
    return this.namespaceRefName?.name;
  }

  public changeNamespace(namespace: string | undefined): this {
    return this.changeNamespaceRefName(
      namespace
        ? this.namespaceRefName
          ? this.namespaceRefName.changeName(namespace)
          : RefName.create(namespace)
        : undefined,
    );
  }

  public getOutputName(): string {
    const name = this.columnRefName.name;
    return name === '*' ? `"*"` : name;
  }

  public convertToTableRef(): SqlExpression {
    if (this.namespaceRefName) {
      throw new Error(`can not convert to SqlTableRef`);
    }

    return new SqlTableRef({
      tableRefName: this.columnRefName,
      namespaceRefName: this.tableRefName,
      spacing: {
        preNamespaceDot: this.spacing.preTableDot,
        postNamespaceDot: this.spacing.postTableDot,
      },
    });
  }

  public prettyTrim(maxLength: number): this {
    const { columnRefName, tableRefName } = this;
    let ret = this;
    if (columnRefName) {
      ret = ret.changeColumnRefName(columnRefName.prettyTrim(maxLength));
    }
    if (tableRefName) {
      ret = ret.changeTableRefName(tableRefName.prettyTrim(maxLength));
    }
    return ret;
  }
}

SqlBase.register(SqlRef);
