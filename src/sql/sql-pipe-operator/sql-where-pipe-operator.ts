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

import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlWhereClause } from '../sql-clause';
import type { SqlExpression } from '../sql-expression';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlWherePipeOperatorValue extends SqlPipeOperatorValue {
  whereClause: SqlWhereClause;
}

/**
 * The `|> WHERE` pipe operator, which filters the input rows.
 */
export class SqlWherePipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'wherePipeOperator';

  static create(expression: SqlWhereClause | SqlExpression): SqlWherePipeOperator {
    return new SqlWherePipeOperator({
      whereClause: SqlWhereClause.create(expression),
    });
  }

  public readonly whereClause: SqlWhereClause;

  constructor(options: SqlWherePipeOperatorValue) {
    super(options, SqlWherePipeOperator.type);
    this.whereClause = options.whereClause;
  }

  public valueOf(): SqlWherePipeOperatorValue {
    const value = super.valueOf() as SqlWherePipeOperatorValue;
    value.whereClause = this.whereClause;
    return value;
  }

  protected _toRawOperatorString(): string {
    return this.whereClause.toString();
  }

  public changeWhereClause(whereClause: SqlWhereClause): this {
    const value = this.valueOf();
    value.whereClause = whereClause;
    return SqlBase.fromValue(value);
  }

  public getExpression(): SqlExpression {
    return this.whereClause.expression;
  }

  public changeExpression(expression: SqlExpression): this {
    return this.changeWhereClause(this.whereClause.changeExpression(expression));
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    const whereClause = this.whereClause._walkHelper(nextStack, fn, postorder);
    if (!whereClause) return;
    if (whereClause !== this.whereClause) {
      ret = ret.changeWhereClause(whereClause as SqlWhereClause);
    }

    return ret;
  }
}

SqlBase.register(SqlWherePipeOperator);
