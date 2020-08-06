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

import { SqlAlias } from '..';
import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../../sql-base';
import { SqlExpression } from '../../sql-expression';

export interface SqlJoinPartValue extends SqlBaseValue {
  joinType?: string;
  joinKeyword: string;
  table: SqlAlias;
  onKeyword?: string;
  onExpression?: SqlExpression;
}

export class SqlJoinPart extends SqlBase {
  static type: SqlType = 'joinPart';

  static create(joinType: string, table: SqlBase, onExpression?: SqlExpression): SqlJoinPart {
    return new SqlJoinPart({
      joinType: joinType,
      joinKeyword: 'JOIN',
      table: SqlAlias.fromBase(table),
      onKeyword: onExpression ? 'ON' : undefined,
      onExpression: onExpression,
    });
  }

  public readonly joinType?: string;
  public readonly joinKeyword: string;
  public readonly table: SqlAlias;
  public readonly onKeyword?: string;
  public readonly onExpression?: SqlExpression;

  constructor(options: SqlJoinPartValue) {
    super(options, SqlJoinPart.type);
    this.joinType = options.joinType;
    this.joinKeyword = options.joinKeyword;
    this.table = options.table;
    this.onKeyword = options.onKeyword;
    this.onExpression = options.onExpression;
  }

  public valueOf(): SqlJoinPartValue {
    const value = super.valueOf() as SqlJoinPartValue;
    value.joinType = this.joinType;
    value.joinKeyword = this.joinKeyword;
    value.table = this.table;
    value.onKeyword = this.onKeyword;
    value.onExpression = this.onExpression;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [];

    if (this.joinType) {
      rawParts.push(this.joinType, this.getInnerSpace('postJoinType'));
    }

    rawParts.push(this.joinKeyword, this.getInnerSpace('postJoinKeyword'), this.table.toString());

    if (this.onKeyword && this.onExpression) {
      rawParts.push(
        this.getInnerSpace('preOn'),
        this.onKeyword,
        this.getInnerSpace('postOn'),
        this.onExpression.toString(),
      );
    }

    return rawParts.join('');
  }

  public changeJoinTable(table: SqlAlias): this {
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
      ret = ret.changeJoinTable(table as SqlAlias);
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

SqlBase.register(SqlJoinPart.type, SqlJoinPart);
