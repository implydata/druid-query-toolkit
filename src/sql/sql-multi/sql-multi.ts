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
import { DecomposeViaOptions, SqlExpression } from '../sql-expression';
import { SeparatedArray, Separator } from '../utils';

export type SqlMultiOp = 'OR' | 'AND' | '||' | '+' | '-' | '*' | '/';

export interface SqlMultiValue extends SqlBaseValue {
  op: SqlMultiOp;
  args: SeparatedArray<SqlExpression>;
}

export class SqlMulti extends SqlExpression {
  static type: SqlTypeDesignator = 'multi';

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

  public numArgs(): number {
    return this.args?.length() || 0;
  }

  public getArgArray(): readonly SqlExpression[] {
    return this.args?.values || [];
  }

  public getArg(index: number): SqlExpression | undefined {
    return this.args?.get(index);
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

  public decomposeViaAnd(options: DecomposeViaOptions = {}): SqlExpression[] {
    if (this.op !== 'AND') return super.decomposeViaAnd(options);
    if (options.flatten) {
      return this.args.values.flatMap(v => v.decomposeViaAnd(options));
    } else {
      return this.args.values.map(v => v.changeParens([]));
    }
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

  public decomposeViaOr(options: DecomposeViaOptions = {}): SqlExpression[] {
    if (this.op !== 'OR') return super.decomposeViaOr(options);
    if (options.flatten) {
      return this.args.values.flatMap(v => v.decomposeViaOr(options));
    } else {
      return this.args.values.map(v => v.changeParens([]));
    }
  }
}

SqlBase.register(SqlMulti);
