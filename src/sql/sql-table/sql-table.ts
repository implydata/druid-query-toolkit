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
import { SqlColumn } from '../sql-column/sql-column';
import { SqlExpression } from '../sql-expression';
import { SqlNamespace } from '../sql-namespace/sql-namespace';
import { SqlStar } from '../sql-star/sql-star';
import { RefName } from '../utils';

export interface SqlTableValue extends SqlBaseValue {
  refName: RefName;
  namespace?: SqlNamespace;
}

export class SqlTable extends SqlExpression {
  static type: SqlType = 'table';

  static create(name: string | SqlTable, namespace?: SqlNamespace | string) {
    if (name instanceof SqlTable) {
      return namespace ? name.changeNamespace(SqlNamespace.create(namespace)) : name;
    }
    return new SqlTable({
      refName: RefName.create(name),
      namespace: namespace ? SqlNamespace.create(namespace) : undefined,
    });
  }

  static optionalQuotes(name: string | SqlTable, namespace?: SqlNamespace | string) {
    if (name instanceof SqlTable) {
      return namespace ? name.changeNamespace(SqlNamespace.create(namespace)) : name;
    }
    return new SqlTable({
      refName: RefName.create(name, false),
      namespace: namespace ? SqlNamespace.optionalQuotes(namespace) : undefined,
    });
  }

  public readonly refName: RefName;
  public readonly namespace?: SqlNamespace;

  constructor(options: SqlTableValue) {
    super(options, SqlTable.type);
    this.refName = options.refName;
    this.namespace = options.namespace;
  }

  public valueOf(): SqlTableValue {
    const value = super.valueOf() as SqlTableValue;
    value.refName = this.refName;
    value.namespace = this.namespace;
    return value;
  }

  protected _toRawString(): string {
    const { namespace, refName } = this;
    const rawParts: string[] = [];

    if (namespace) {
      rawParts.push(
        namespace.toString(),
        this.getSpace('postNamespace', ''),
        '.',
        this.getSpace('postDot', ''),
      );
    }

    rawParts.push(refName.toString());

    return rawParts.join('');
  }

  public changeRefName(refName: RefName): this {
    const value = this.valueOf();
    value.refName = refName;
    return SqlBase.fromValue(value);
  }

  public getName(): string {
    return this.refName.name;
  }

  public changeName(name: string): this {
    const { refName } = this;
    const value = this.valueOf();
    value.refName = refName.changeName(name);
    return SqlBase.fromValue(value);
  }

  public changeNamespace(namespace: SqlNamespace | undefined): this {
    const value = this.valueOf();
    if (namespace) {
      value.namespace = namespace;
    } else {
      delete value.namespace;
      value.spacing = this.getSpacingWithout('postNamespace', 'postDot');
    }
    return SqlBase.fromValue(value);
  }

  public getNamespaceName(): string | undefined {
    return this.namespace?.getName();
  }

  public changeNamespaceName(namespace: string | undefined): this {
    return this.changeNamespace(
      namespace
        ? this.namespace
          ? this.namespace.changeName(namespace)
          : SqlNamespace.create(namespace)
        : undefined,
    );
  }

  public prettyTrim(maxLength: number): this {
    const { refName, namespace } = this;
    let ret = this.changeRefName(refName.prettyTrim(maxLength));
    if (namespace) {
      ret = ret.changeNamespace(namespace.prettyTrim(maxLength));
    }
    return ret;
  }

  public convertToNamespace(): SqlNamespace {
    if (this.namespace) {
      throw new Error('can not convert');
    }
    return new SqlNamespace({
      refName: this.refName,
    });
  }

  public column(name: string): SqlColumn {
    return SqlColumn.create(name, this);
  }

  public columnWithOptionalQuotes(name: string): SqlColumn {
    return SqlColumn.optionalQuotes(name, this);
  }

  public star(): SqlStar {
    return SqlStar.create(this);
  }
}

SqlBase.register(SqlTable);
