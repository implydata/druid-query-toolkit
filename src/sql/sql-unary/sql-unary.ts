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

import { SqlBase, SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlExpression } from '../sql-expression';

export type SqlUnaryOp = 'NOT' | '+' | '-';

export interface UnaryExpressionValue extends SqlBaseValue {
  op: SqlUnaryOp;
  argument: SqlExpression;
}

export class SqlUnary extends SqlExpression {
  static type: SqlTypeDesignator = 'unary';

  static not(ex: SqlExpression): SqlUnary {
    return new SqlUnary({
      op: 'NOT',
      argument: ex.type === 'multi' || ex.type === 'comparison' ? ex.ensureParens() : ex,
    });
  }

  public readonly op: SqlUnaryOp;
  public readonly argument: SqlExpression;

  constructor(options: UnaryExpressionValue) {
    super(options, SqlUnary.type);
    this.op = options.op;
    this.argument = options.argument;
  }

  public valueOf(): UnaryExpressionValue {
    const value = super.valueOf() as UnaryExpressionValue;
    value.op = this.op;
    value.argument = this.argument;
    return value;
  }

  protected _toRawString(): string {
    return [this.getKeyword('op', this.op), this.getSpace('postOp'), this.argument.toString()].join(
      '',
    );
  }

  public changeArgument(argument: SqlExpression): this {
    const value = this.valueOf();
    value.argument = argument;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const argument = this.argument._walkHelper(nextStack, fn, postorder);
    if (!argument) return;
    if (argument !== this.argument) {
      ret = ret.changeArgument(argument);
    }

    return ret;
  }

  public negate(): SqlExpression {
    return this.argument;
  }
}

SqlBase.register(SqlUnary);
