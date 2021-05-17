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

export interface SqlStarValue extends SqlBaseValue {
  tableRefName?: RefName;
  namespaceRefName?: RefName;
}

export class SqlStar extends SqlExpression {
  static type: SqlType = 'star';

  static PLAIN: SqlStar;

  static create(
    table?: string,
    namespace?: string,
    forceTableQuotes?: boolean,
    forceNamespaceQuotes?: boolean,
  ) {
    return new SqlStar({
      tableRefName: RefName.maybe(table, forceTableQuotes),
      namespaceRefName: RefName.maybe(namespace, forceNamespaceQuotes),
    });
  }

  public readonly tableRefName?: RefName;
  public readonly namespaceRefName?: RefName;

  constructor(options: SqlStarValue) {
    super(options, SqlStar.type);
    this.tableRefName = options.tableRefName;
    this.namespaceRefName = options.namespaceRefName;
  }

  public valueOf(): SqlStarValue {
    const value = super.valueOf() as SqlStarValue;
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

    if (tableRefName) {
      rawParts.push(
        tableRefName.toString(),
        this.getSpace('preTableDot', ''),
        '.',
        this.getSpace('postTableDot', ''),
      );
    }

    rawParts.push('*');

    return rawParts.join('');
  }

  public changeTableRefName(tableRefName: RefName): this {
    const value = this.valueOf();
    value.tableRefName = tableRefName;
    return SqlBase.fromValue(value);
  }

  public getTable(): string | undefined {
    return this.tableRefName?.name;
  }

  public changeTable(table: string | undefined): this {
    const { tableRefName } = this;
    const value = this.valueOf();
    if (table) {
      value.tableRefName = tableRefName ? tableRefName.changeName(table) : RefName.create(table);
    } else {
      delete value.tableRefName;
    }
    return SqlBase.fromValue(value);
  }

  public changeNamespaceRefName(namespaceRefName: RefName): this {
    const value = this.valueOf();
    value.namespaceRefName = namespaceRefName;
    return SqlBase.fromValue(value);
  }

  public getNamespace(): string | undefined {
    return this.namespaceRefName?.name;
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

SqlBase.register(SqlStar);

SqlStar.PLAIN = SqlStar.create();
