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

import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SeparatedArray, Separator } from '../../utils';
import { SqlExpression } from '../sql-expression';

export interface SqlMultiValue extends SqlBaseValue {
  expressionType: string;
  args: SeparatedArray<SqlExpression>;
}

export class SqlMulti extends SqlExpression {
  static type = 'multi';

  public readonly expressionType: string;
  public readonly args: SeparatedArray<SqlExpression>;

  constructor(options: SqlMultiValue) {
    super(options, SqlMulti.type);

    this.expressionType = options.expressionType;
    if (!this.expressionType) throw new Error(`must have expressionType`);

    this.args = options.args;
    if (!this.args) throw new Error(`must have args`);
  }

  public valueOf(): SqlMultiValue {
    const value = super.valueOf() as SqlMultiValue;
    value.expressionType = this.expressionType;
    value.args = this.args;
    return value;
  }

  public toRawString(): string {
    return this.args.toString();
  }

  public changeArgs(args: SeparatedArray<SqlExpression>): this {
    const value = this.valueOf();
    value.args = args;
    return SqlBase.fromValue(value);
  }

  public walkInner(
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

  public and(expression: SqlExpression): SqlExpression {
    if (this.expressionType !== 'AND') {
      return super.and(expression);
    }

    return this.changeArgs(this.args.addLast(expression, Separator.symmetricSpace('AND')));
  }

  public removeColumnFromAnd(column: string): SqlExpression | undefined {
    if (this.expressionType !== 'AND') {
      return super.removeColumnFromAnd(column);
    }

    const args = this.args.filter(a => !a.containsColumn(column));
    if (!args) return;

    if (args.length() === 1) {
      return args.first();
    }

    return this.changeArgs(args);
  }
}

SqlBase.register(SqlMulti.type, SqlMulti);
