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
import { SqlTable } from '../sql-table/sql-table';
import { RefName } from '../utils';

export interface SqlNamespaceValue extends SqlBaseValue {
  refName: RefName;
}

export class SqlNamespace extends SqlExpression {
  static type: SqlType = 'namespace';

  static create(name: string | SqlNamespace) {
    if (name instanceof SqlNamespace) return name;
    return new SqlNamespace({
      refName: RefName.create(name),
    });
  }

  static optionalQuotes(name: string | SqlNamespace) {
    if (name instanceof SqlNamespace) return name;
    return new SqlNamespace({
      refName: RefName.create(name, false),
    });
  }

  public readonly refName: RefName;

  constructor(options: SqlNamespaceValue) {
    super(options, SqlNamespace.type);
    this.refName = options.refName;
  }

  public valueOf(): SqlNamespaceValue {
    const value = super.valueOf() as SqlNamespaceValue;
    value.refName = this.refName;
    return value;
  }

  protected _toRawString(): string {
    const { refName } = this;
    return refName.toString();
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

  public prettyTrim(maxLength: number): this {
    return this.changeRefName(this.refName.prettyTrim(maxLength));
  }

  public table(name: string): SqlTable {
    return SqlTable.create(name, this);
  }

  public tableWithOptionalQuotes(name: string): SqlTable {
    return SqlTable.optionalQuotes(name, this);
  }
}

SqlBase.register(SqlNamespace);
