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

import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { DecomposeViaOptions } from '../sql-expression';
import { SqlExpression } from '../sql-expression';
import { SqlLiteral } from '../sql-literal/sql-literal';
import { SeparatedArray, Separator } from '../utils';

export type SqlMultiOp = 'AND' | 'OR' | '||' | '+' | '-' | '*' | '/';

const OP_TO_ZERO: Record<SqlMultiOp, SqlLiteral> = {
  'AND': SqlLiteral.TRUE,
  'OR': SqlLiteral.FALSE,
  '||': SqlLiteral.EMPTY_STRING,
  '+': SqlLiteral.ZERO_POINT_ZERO,
  '-': SqlLiteral.ZERO_POINT_ZERO,
  '*': SqlLiteral.ONE_POINT_ZERO,
  '/': SqlLiteral.ONE_POINT_ZERO,
};

export interface SqlMultiValue extends SqlBaseValue {
  op: SqlMultiOp;
  args: SeparatedArray<SqlExpression>;
}

export class SqlMulti extends SqlExpression {
  static type: SqlTypeDesignator = 'multi';

  static create(
    op: SqlMultiOp,
    args: SeparatedArray<SqlExpression> | readonly SqlExpression[],
  ): SqlMulti {
    return new SqlMulti({
      op,
      args: SeparatedArray.fromArray(args, Separator.symmetricSpace(op)),
    });
  }

  static createIfNeeded(op: SqlMultiOp, args: readonly SqlExpression[]): SqlExpression {
    switch (args.length) {
      case 0:
        return OP_TO_ZERO[op];

      case 1:
        return args[0]!;

      default:
        return SqlMulti.create(op, args);
    }
  }

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
    const { op, args } = this;
    const sep = SqlBase.capitalize(op);
    return args.toString(
      args.length() >= 3 ? Separator.indentSpace(sep) : Separator.symmetricSpace(sep),
    );
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
      if (this.hasParens()) return [this.changeParens([])];
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

  public flattenIfNeeded(flatteningOp: SqlMultiOp): SqlExpression | readonly SqlExpression[] {
    if (this.op === flatteningOp) {
      return this.hasParens() ? this : this.getArgArray();
    } else {
      return this.ensureParens();
    }
  }
}

SqlBase.register(SqlMulti);
