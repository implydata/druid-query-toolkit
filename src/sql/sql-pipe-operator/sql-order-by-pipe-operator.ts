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

import type { SeparatedArray } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlOrderByExpression } from '../sql-clause';
import { SqlOrderByClause } from '../sql-clause';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlOrderByPipeOperatorValue extends SqlPipeOperatorValue {
  orderByClause: SqlOrderByClause;
}

/**
 * The `|> ORDER BY` pipe operator, which sorts the input rows.
 */
export class SqlOrderByPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'orderByPipeOperator';

  static create(
    orderBy:
      | SqlOrderByClause
      | SeparatedArray<SqlOrderByExpression>
      | SqlOrderByExpression[]
      | SqlOrderByExpression,
  ): SqlOrderByPipeOperator {
    return new SqlOrderByPipeOperator({
      orderByClause:
        orderBy instanceof SqlOrderByClause ? orderBy : SqlOrderByClause.create(orderBy),
    });
  }

  public readonly orderByClause: SqlOrderByClause;

  constructor(options: SqlOrderByPipeOperatorValue) {
    super(options, SqlOrderByPipeOperator.type);
    this.orderByClause = options.orderByClause;
  }

  public valueOf(): SqlOrderByPipeOperatorValue {
    const value = super.valueOf() as SqlOrderByPipeOperatorValue;
    value.orderByClause = this.orderByClause;
    return value;
  }

  protected _toRawOperatorString(): string {
    return this.orderByClause.toString();
  }

  public changeOrderByClause(orderByClause: SqlOrderByClause): this {
    const value = this.valueOf();
    value.orderByClause = orderByClause;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    const orderByClause = this.orderByClause._walkHelper(nextStack, fn, postorder);
    if (!orderByClause) return;
    if (orderByClause !== this.orderByClause) {
      ret = ret.changeOrderByClause(orderByClause as SqlOrderByClause);
    }

    return ret;
  }
}

SqlBase.register(SqlOrderByPipeOperator);
