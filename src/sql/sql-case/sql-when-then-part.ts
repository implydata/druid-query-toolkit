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
import { SqlExpression } from '../sql-expression';
import type { LiteralValue } from '../sql-literal/sql-literal';
import { SeparatedArray, Separator } from '../utils';

export interface SqlWhenThenPartValue extends SqlBaseValue {
  whenExpressions: SeparatedArray<SqlExpression>;
  thenExpression: SqlExpression;
}

export class SqlWhenThenPart extends SqlBase {
  static type: SqlTypeDesignator = 'whenThenPart';

  static DEFAULT_WHEN_KEYWORD = 'WHEN';
  static DEFAULT_THEN_KEYWORD = 'THEN';

  static create(
    whenExpressions: SeparatedArray<SqlExpression> | SqlExpression[] | SqlExpression,
    thenExpression: SqlExpression | LiteralValue,
  ): SqlWhenThenPart {
    return new SqlWhenThenPart({
      whenExpressions: SeparatedArray.fromArray(
        whenExpressions instanceof SqlExpression ? [whenExpressions] : whenExpressions,
      ),
      thenExpression: SqlExpression.wrap(thenExpression),
    });
  }

  public readonly whenExpressions: SeparatedArray<SqlExpression>;
  public readonly thenExpression: SqlExpression;

  constructor(options: SqlWhenThenPartValue) {
    super(options, SqlWhenThenPart.type);
    this.whenExpressions = options.whenExpressions;
    this.thenExpression = options.thenExpression;
  }

  public valueOf(): SqlWhenThenPartValue {
    const value = super.valueOf() as SqlWhenThenPartValue;
    value.whenExpressions = this.whenExpressions;
    value.thenExpression = this.thenExpression;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('when', SqlWhenThenPart.DEFAULT_WHEN_KEYWORD),
      this.getSpace('postWhen'),
      this.whenExpressions.toString(Separator.COMMA),
      this.getSpace('postWhenExpressions'),
      this.getKeyword('then', SqlWhenThenPart.DEFAULT_THEN_KEYWORD),
      this.getSpace('postThen'),
      this.thenExpression.toString(),
    ].join('');
  }

  public changeWhenExpressions(
    whenExpressions: SeparatedArray<SqlExpression> | SqlExpression[],
  ): this {
    const value = this.valueOf();
    value.whenExpressions = SeparatedArray.fromArray(whenExpressions);
    return SqlBase.fromValue(value);
  }

  public changeWhenExpression(whenExpression: SqlExpression): this {
    return this.changeWhenExpressions([whenExpression]);
  }

  public changeThenExpression(thenExpression: SqlExpression): this {
    const value = this.valueOf();
    value.thenExpression = thenExpression;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const whenExpressions = SqlBase.walkSeparatedArray(
      this.whenExpressions,
      nextStack,
      fn,
      postorder,
    );
    if (!whenExpressions) return;
    if (whenExpressions !== this.whenExpressions) {
      ret = ret.changeWhenExpressions(whenExpressions);
    }

    const thenExpression = this.thenExpression._walkHelper(nextStack, fn, postorder);
    if (!thenExpression) return;
    if (thenExpression !== this.thenExpression) {
      ret = ret.changeThenExpression(thenExpression);
    }

    return ret;
  }
}

SqlBase.register(SqlWhenThenPart);
