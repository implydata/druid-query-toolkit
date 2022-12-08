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

export interface SqlStarValue extends SqlBaseValue {
  table?: SqlTable;
}

export class SqlStar extends SqlExpression {
  static type: SqlTypeDesignator = 'star';

  static PLAIN: SqlStar;

  static create(table?: SqlTable) {
    return new SqlStar({
      table,
    });
  }

  public readonly table?: SqlTable;

  constructor(options: SqlStarValue = {}) {
    super(options, SqlStar.type);
    this.table = options.table;
  }

  public valueOf(): SqlStarValue {
    const value = super.valueOf() as SqlStarValue;
    value.table = this.table;
    return value;
  }

  protected _toRawString(): string {
    const { table } = this;
    const rawParts: string[] = [];

    if (table) {
      rawParts.push(
        table.toString(),
        this.getSpace('postTable', ''),
        '.',
        this.getSpace('postDot', ''),
      );
    }

    rawParts.push('*');

    return rawParts.join('');
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

  public prettyTrim(maxLength: number): this {
    const { table } = this;
    if (!table) return this;
    return this.changeTable(table.prettyTrim(maxLength));
  }
}

SqlBase.register(SqlStar);

SqlStar.PLAIN = SqlStar.create();
