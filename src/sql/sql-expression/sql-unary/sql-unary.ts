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

import { SqlBase, SqlBaseValue } from '../../sql-base';
import { SqlExpression } from '../sql-expression';

export interface UnaryExpressionValue extends SqlBaseValue {
  expressionType: string;
  keyword: string;
  argument: SqlExpression;
}

export class SqlUnary extends SqlExpression {
  static type = 'unaryExpression';

  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  public readonly expressionType: string;
  public readonly keyword: string;
  public readonly argument: SqlExpression;

  constructor(options: UnaryExpressionValue) {
    super(options, SqlUnary.type);
    this.expressionType = options.expressionType;
    this.keyword = options.keyword;
    this.argument = options.argument;
  }

  public valueOf(): UnaryExpressionValue {
    const value = super.valueOf() as UnaryExpressionValue;
    value.expressionType = this.expressionType;
    value.keyword = this.keyword;
    value.argument = this.argument;
    return value;
  }

  public toRawString(): string {
    if (!this.argument) {
      throw new Error('Could not make raw string');
    }
    return this.keyword + this.getInnerSpace('postKeyword') + this.argument.toString();
  }

  public walkInner(
    nextStack: SqlBase[],
    fn: (t: SqlBase, stack: SqlBase[]) => void,
    postorder: boolean,
  ): void {
    this.argument.walkHelper(nextStack, fn, postorder);
  }

  public isType(type: string) {
    return type === this.type && this instanceof SqlUnary;
  }
}

SqlBase.register(SqlUnary.type, SqlUnary);
