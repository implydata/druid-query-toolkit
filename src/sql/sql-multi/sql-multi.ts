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

import { SeparatedArray, Separator } from '../helpers';
import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { DecomposeViaOptions } from '../sql-expression';
import { SqlExpression } from '../sql-expression';
import { SqlLiteral } from '../sql-literal/sql-literal';

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
      args: SeparatedArray.fromArray(args),
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
    return this.args.toString(this.getDefaultSeparator(SqlBase.capitalize(this.op)));
  }

  private getDefaultSeparator(sep: string): Separator {
    const { op, args } = this;
    return args.length() > 3 && (op === 'AND' || op === 'OR')
      ? Separator.newlineFirst(sep)
      : Separator.symmetricSpace(sep);
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

  public resetOwnKeywords(): this {
    const ret = super.resetOwnKeywords();
    const { args } = ret;
    const sep = SqlBase.capitalize(ret.op);
    if (args.separators.every(s => !(s instanceof Separator) || s.separator === sep)) return ret;
    return ret.changeArgs(
      new SeparatedArray(
        args.values,
        args.separators.map(s =>
          s instanceof Separator
            ? new Separator({ left: s.left, separator: sep, right: s.right })
            : s,
        ),
      ),
    );
  }

  public clearOwnSeparators(): this {
    // The separators also hold the casing of the operator (AND / and), so keep any casing that
    // differs from the default and reset only the spacing around it
    const sep = SqlBase.capitalize(this.op);
    const separators = this.args.separators.map(s =>
      s instanceof Separator && s.separator !== sep
        ? this.getDefaultSeparator(s.separator)
        : undefined,
    );
    return this.changeArgs(
      separators.some(Boolean)
        ? new SeparatedArray(this.args.values, separators)
        : this.args.clearSeparators(),
    );
  }

  public flatten(flatteningOp?: SqlMultiOp): SqlExpression {
    const { op, args } = this;
    if (flatteningOp && op !== flatteningOp) return this;
    return SqlMulti.create(
      op,
      args.values.flatMap(v => v.flatten(op)),
    );
  }

  public decomposeViaAnd(options: DecomposeViaOptions = {}): SqlExpression[] {
    const { op, args } = this;
    if (op !== 'AND') return super.decomposeViaAnd(options);
    if (options.flatten) {
      return args.values.flatMap(v => v.decomposeViaAnd(options));
    } else {
      const { preserveParens } = options;
      if (this.hasParens()) return [preserveParens ? this : this.changeParens([])];
      return preserveParens ? args.values.slice() : args.values.map(v => v.changeParens([]));
    }
  }

  public filterAnd(fn: (ex: SqlExpression) => boolean): SqlExpression | undefined {
    if (this.op !== 'AND') {
      return super.filterAnd(fn);
    }

    const args = this.args.filterMap(a => a.filterAnd(fn));
    if (!args) return;

    if (args.length() === 1) {
      return args.first();
    }

    return this.changeArgs(args);
  }

  public decomposeViaOr(options: DecomposeViaOptions = {}): SqlExpression[] {
    const { op, args } = this;
    if (op !== 'OR') return super.decomposeViaOr(options);
    if (options.flatten) {
      return args.values.flatMap(v => v.decomposeViaOr(options));
    } else {
      const { preserveParens } = options;
      if (this.hasParens()) return [preserveParens ? this : this.changeParens([])];
      return preserveParens ? args.values.slice() : args.values.map(v => v.changeParens([]));
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
