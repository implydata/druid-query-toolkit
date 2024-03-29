/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance join the License.
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

import { SqlBase, SqlBaseValue, SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlExpression } from '../../sql-expression';

export type SqlJoinJoinTypeWithOn = 'LEFT' | 'RIGHT' | 'FULL' | 'INNER';

export type SqlJoinJoinType = SqlJoinJoinTypeWithOn | 'CROSS';

export interface SqlJoinPartValue extends SqlBaseValue {
  joinType?: SqlJoinJoinType;
  table: SqlExpression;
  onExpression?: SqlExpression;
}

export class SqlJoinPart extends SqlBase {
  static type: SqlTypeDesignator = 'joinPart';

  static DEFAULT_JOIN_KEYWORD = 'JOIN';
  static DEFAULT_ON_KEYWORD = 'ON';

  static create(
    joinType: SqlJoinJoinTypeWithOn,
    table: SqlExpression,
    onExpression: SqlExpression | SqlExpression[],
  ): SqlJoinPart {
    if (Array.isArray(onExpression)) {
      onExpression = SqlExpression.and(...onExpression);
    }
    return new SqlJoinPart({
      joinType: joinType,
      table: table.convertToTable(),
      onExpression: onExpression,
    });
  }

  static cross(table: SqlExpression): SqlJoinPart {
    return new SqlJoinPart({
      joinType: 'CROSS',
      table: table.convertToTable(),
    });
  }

  public readonly joinType?: SqlJoinJoinType;
  public readonly table: SqlExpression;
  public readonly onExpression?: SqlExpression;

  constructor(options: SqlJoinPartValue) {
    super(options, SqlJoinPart.type);
    this.joinType = options.joinType;
    this.table = options.table;
    this.onExpression = options.onExpression;
  }

  public valueOf(): SqlJoinPartValue {
    const value = super.valueOf() as SqlJoinPartValue;
    value.joinType = this.joinType;
    value.table = this.table;
    value.onExpression = this.onExpression;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [];

    if (this.joinType) {
      rawParts.push(this.getKeyword('joinType', this.joinType), this.getSpace('postJoinType'));
    }

    rawParts.push(
      this.getKeyword('join', SqlJoinPart.DEFAULT_JOIN_KEYWORD),
      this.getSpace('postJoin'),
      this.table.toString(),
    );

    if (this.onExpression) {
      rawParts.push(
        this.getSpace('preOn'),
        this.getKeyword('on', SqlJoinPart.DEFAULT_ON_KEYWORD),
        this.getSpace('postOn'),
        this.onExpression.toString(),
      );
    }

    return rawParts.join('');
  }

  public changeJoinTable(table: SqlExpression): this {
    const value = this.valueOf();
    value.table = table;
    return SqlBase.fromValue(value);
  }

  public changeOnExpression(onExpression: SqlExpression): this {
    const value = this.valueOf();
    value.onExpression = onExpression;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const table = this.table._walkHelper(nextStack, fn, postorder);
    if (!table) return;
    if (table !== this.table) {
      ret = ret.changeJoinTable(table);
    }

    if (this.onExpression) {
      const onExpression = this.onExpression._walkHelper(nextStack, fn, postorder);
      if (!onExpression) return;
      if (onExpression !== this.onExpression) {
        ret = ret.changeOnExpression(onExpression);
      }
    }

    return ret;
  }
}

SqlBase.register(SqlJoinPart);
