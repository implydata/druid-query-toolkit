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

import { SqlBase, SqlBaseValue, SqlTypeDesignator } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import { SqlTable } from '../sql-table/sql-table';
import { RefName } from '../utils';

export interface SqlColumnValue extends SqlBaseValue {
  refName: RefName;
  table?: SqlTable;
}

export class SqlColumn extends SqlExpression {
  static type: SqlTypeDesignator = 'column';

  static create(name: string | SqlColumn, table?: SqlTable | string) {
    if (name instanceof SqlColumn) {
      return table ? name.changeTable(SqlTable.create(table)) : name;
    }
    return new SqlColumn({
      refName: RefName.create(name),
      table: table ? SqlTable.create(table) : undefined,
    });
  }

  static optionalQuotes(name: string | SqlColumn, table?: SqlTable | string) {
    if (name instanceof SqlColumn) {
      return table ? name.changeTable(SqlTable.create(table)) : name;
    }
    return new SqlColumn({
      refName: RefName.create(name, false),
      table: table ? SqlTable.optionalQuotes(table) : undefined,
    });
  }

  public readonly refName: RefName;
  public readonly table?: SqlTable;

  constructor(options: SqlColumnValue) {
    super(options, SqlColumn.type);
    this.refName = options.refName;
    this.table = options.table;
  }

  public valueOf(): SqlColumnValue {
    const value = super.valueOf() as SqlColumnValue;
    value.refName = this.refName;
    value.table = this.table;
    return value;
  }

  protected _toRawString(): string {
    const { table, refName } = this;
    const rawParts: string[] = [];

    if (table) {
      rawParts.push(
        table.toString(),
        this.getSpace('postTable', ''),
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

  public changeTable(table: SqlTable | undefined): this {
    const value = this.valueOf();
    if (table) {
      value.table = table;
    } else {
      delete value.table;
      value.spacing = this.getSpacingWithout('postTable', 'postDot');
    }
    return SqlBase.fromValue(value);
  }

  public getTableName(): string | undefined {
    return this.table?.getName();
  }

  public changeTableName(table: string | undefined): this {
    return this.changeTable(
      table ? (this.table ? this.table.changeName(table) : SqlTable.create(table)) : undefined,
    );
  }

  public getNamespaceName(): string | undefined {
    return this.table?.getNamespaceName();
  }

  public prettyTrim(maxLength: number): this {
    const { refName, table } = this;
    let ret = this.changeRefName(refName.prettyTrim(maxLength));
    if (table) {
      ret = ret.changeTable(table.prettyTrim(maxLength));
    }
    return ret;
  }

  public convertToTable(): SqlTable {
    const { refName, table, spacing } = this;
    return new SqlTable({
      refName,
      namespace: table?.convertToNamespace(),
      spacing: {
        postNamespace: spacing['postTable'],
        postDot: spacing['postDot'],
      },
    });
  }

  public getOutputName(): string {
    return this.getName();
  }
}

SqlBase.register(SqlColumn);
