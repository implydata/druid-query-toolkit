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
import type { SqlJoinPart } from '../sql-clause';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlJoinPipeOperatorValue extends SqlPipeOperatorValue {
  joinPart: SqlJoinPart;
}

/**
 * The \`|> JOIN\` pipe operator, which joins the input with a table, like a JOIN in a FROM
 * clause with the input on the left: \`|> LEFT JOIN t AS b ON a.x = b.x\`. Give the input a name
 * to refer to with a `|> AS` before it.
 */
export class SqlJoinPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'joinPipeOperator';

  static create(joinPart: SqlJoinPart): SqlJoinPipeOperator {
    return new SqlJoinPipeOperator({ joinPart });
  }

  public readonly joinPart: SqlJoinPart;

  constructor(options: SqlJoinPipeOperatorValue) {
    super(options, SqlJoinPipeOperator.type);
    this.joinPart = options.joinPart;
  }

  public valueOf(): SqlJoinPipeOperatorValue {
    const value = super.valueOf() as SqlJoinPipeOperatorValue;
    value.joinPart = this.joinPart;
    return value;
  }

  protected _toRawOperatorString(): string {
    return this.joinPart.toString();
  }

  public changeJoinPart(joinPart: SqlJoinPart): this {
    if (this.joinPart === joinPart) return this;
    const value = this.valueOf();
    value.joinPart = joinPart;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    const joinPart = this.joinPart._walkHelper(nextStack, fn, postorder);
    if (!joinPart) return;
    if (joinPart !== this.joinPart) {
      return this.changeJoinPart(joinPart as SqlJoinPart);
    }

    return this;
  }
}

SqlBase.register(SqlJoinPipeOperator);
