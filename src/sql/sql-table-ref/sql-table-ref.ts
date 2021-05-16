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
import { RefName } from '../utils';

export interface SqlTableRefValue extends SqlBaseValue {
  tableRefName: RefName;
  namespaceRefName?: RefName;
}

export class SqlTableRef extends SqlExpression {
  static type: SqlType = 'tableRef';

  static create(
    table: string,
    namespace?: string,
    forceTableQuotes?: boolean,
    forceNamespaceQuotes?: boolean,
  ) {
    return new SqlTableRef({
      tableRefName: RefName.create(table, forceTableQuotes),
      namespaceRefName: RefName.maybe(namespace, forceNamespaceQuotes),
    });
  }

  public readonly tableRefName: RefName;
  public readonly namespaceRefName?: RefName;

  constructor(options: SqlTableRefValue) {
    super(options, SqlTableRef.type);
    this.tableRefName = options.tableRefName;
    this.namespaceRefName = options.namespaceRefName;
  }

  public valueOf(): SqlTableRefValue {
    const value = super.valueOf() as SqlTableRefValue;
    value.tableRefName = this.tableRefName;
    value.namespaceRefName = this.namespaceRefName;
    return value;
  }

  protected _toRawString(): string {
    const { namespaceRefName, tableRefName } = this;
    const rawParts: string[] = [];

    if (namespaceRefName) {
      rawParts.push(
        namespaceRefName.toString(),
        this.getSpace('preNamespaceDot', ''),
        '.',
        this.getSpace('postNamespaceDot', ''),
      );
    }

    rawParts.push(tableRefName.toString());

    return rawParts.join('');
  }

  public changeTableRefName(tableRefName: RefName): this {
    const value = this.valueOf();
    value.tableRefName = tableRefName;
    return SqlBase.fromValue(value);
  }

  public getTable(): string {
    if (!this.tableRefName) throw Error('SqlTableRef has no defined table');
    return this.tableRefName.name;
  }

  public changeTable(table: string): this {
    const { tableRefName } = this;
    const value = this.valueOf();
    value.tableRefName = tableRefName ? tableRefName.changeName(table) : RefName.create(table);
    return SqlBase.fromValue(value);
  }

  public changeNamespaceRefName(namespaceRefName: RefName): this {
    const value = this.valueOf();
    value.namespaceRefName = namespaceRefName;
    return SqlBase.fromValue(value);
  }

  public getNamespace(): string {
    if (!this.namespaceRefName) throw Error('SqlTableRef has no defined namespace');
    return this.namespaceRefName.name;
  }

  public changeNamespace(namespace: string | undefined): this {
    const { namespaceRefName } = this;
    const value = this.valueOf();
    if (namespace) {
      value.namespaceRefName = namespaceRefName
        ? namespaceRefName.changeName(namespace)
        : RefName.create(namespace);
    } else {
      delete value.namespaceRefName;
    }
    return SqlBase.fromValue(value);
  }

  public prettyTrim(maxLength: number): this {
    const { tableRefName } = this;
    let ret = this;
    if (tableRefName) {
      ret = ret.changeTableRefName(tableRefName.prettyTrim(maxLength));
    }
    return ret;
  }
}

SqlBase.register(SqlTableRef);
