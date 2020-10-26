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

import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../../sql-base';
import { SeparatedArray, Separator } from '../../utils';
import { SqlExpression } from '../sql-expression';

export type SqlMultiOp = 'OR' | 'AND' | '||' | '+' | '-' | '*' | '/';

export interface SqlMultiValue extends SqlBaseValue {
  op: SqlMultiOp;
  args: SeparatedArray<SqlExpression>;
}

export class SqlMulti extends SqlExpression {
  static type: SqlType = 'multi';

  public readonly op: SqlMultiOp;
  public readonly args: SeparatedArray<SqlExpression>;

  constructor(options: SqlMultiValue) {
    super(options, SqlMulti.type);

    this.op = options.op;
    if (!this.op) throw new Error(`must have op`);

    this.args = options.args;
    if (!this.args) throw new Error(`must have args`);
  }

  public valueOf(): SqlMultiValue {
    const value = super.valueOf() as SqlMultiValue;
    value.op = this.op;
    value.args = this.args;
    return value;
  }

  protected _toRawString(): string {
    return this.args.toString(Separator.symmetricSpace(SqlBase.capitalize(this.op)));
  }

  public changeArgs(args: SeparatedArray<SqlExpression>): this {
    const value = this.valueOf();
    value.args = args;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const args = SqlBase.walkSeparatedArray(this.args, nextStack, fn, postorder);
    if (!args) return;
    if (args !== this.args) {
      ret = ret.changeArgs(args);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.args = this.args.clearSeparators();
    return SqlBase.fromValue(value);
  }

  public and(expression: SqlExpression): SqlExpression {
    if (this.op !== 'AND') {
      return super.and(expression);
    }

    return this.changeArgs(this.args.append(expression));
  }

  public decomposeViaAnd(): readonly SqlExpression[] {
    if (this.op !== 'AND') {
      return super.decomposeViaAnd();
    }

    return this.args.values;
  }

  public filterAnd(fn: (ex: SqlExpression) => boolean): SqlExpression | undefined {
    if (this.op !== 'AND') {
      return super.filterAnd(fn);
    }

    const args = this.args.filter(fn);
    if (!args) return;

    if (args.length() === 1) {
      return args.first();
    }

    return this.changeArgs(args);
  }
}

SqlBase.register(SqlMulti);
