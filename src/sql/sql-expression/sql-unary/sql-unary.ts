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
import { SqlExpression } from '../sql-expression';

export interface UnaryExpressionValue extends SqlBaseValue {
  keyword: string;
  arg: SqlExpression;
}

export class SqlUnary extends SqlExpression {
  static type = 'unary';

  public readonly keyword: string;
  public readonly arg: SqlExpression;

  constructor(options: UnaryExpressionValue) {
    super(options, SqlUnary.type);
    this.keyword = options.keyword;
    this.arg = options.arg;
  }

  public valueOf(): UnaryExpressionValue {
    const value = super.valueOf() as UnaryExpressionValue;
    value.keyword = this.keyword;
    value.arg = this.arg;
    return value;
  }

  public toRawString(): string {
    if (!this.arg) {
      throw new Error('Could not make raw string');
    }
    return this.keyword + this.getInnerSpace('postKeyword') + this.arg.toString();
  }

  public changeArgument(arg: SqlExpression): this {
    const value = this.valueOf();
    value.arg = arg;
    return SqlBase.fromValue(value);
  }

  public walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const arg = this.arg.walkHelper(nextStack, fn, postorder);
    if (!arg) return;
    if (arg !== this.arg) {
      ret = ret.changeArgument(arg);
    }

    return ret;
  }
}

SqlBase.register(SqlUnary.type, SqlUnary);
