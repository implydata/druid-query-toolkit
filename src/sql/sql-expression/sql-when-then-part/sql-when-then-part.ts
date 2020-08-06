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
import { SqlExpression } from '../sql-expression';

export interface SqlWhenThenPartValue extends SqlBaseValue {
  whenKeyword?: string;
  whenExpression: SqlExpression;
  thenKeyword?: string;
  thenExpression: SqlExpression;
}

export class SqlWhenThenPart extends SqlBase {
  static type: SqlType = 'whenThenPart';

  static DEFAULT_WHEN_KEYWORD = 'WHEN';
  static DEFAULT_THEN_KEYWORD = 'THEN';

  static create(whenExpression: SqlExpression, thenExpression: SqlExpression): SqlWhenThenPart {
    return new SqlWhenThenPart({
      whenExpression,
      thenExpression,
    });
  }

  public readonly whenKeyword?: string;
  public readonly whenExpression: SqlExpression;
  public readonly thenKeyword?: string;
  public readonly thenExpression: SqlExpression;

  constructor(options: SqlWhenThenPartValue) {
    super(options, SqlWhenThenPart.type);
    this.whenKeyword = options.whenKeyword;
    this.whenExpression = options.whenExpression;
    this.thenKeyword = options.thenKeyword;
    this.thenExpression = options.thenExpression;
  }

  public valueOf(): SqlWhenThenPartValue {
    const value = super.valueOf() as SqlWhenThenPartValue;
    value.whenKeyword = this.whenKeyword;
    value.whenExpression = this.whenExpression;
    value.thenKeyword = this.thenKeyword;
    value.thenExpression = this.thenExpression;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.whenKeyword || SqlWhenThenPart.DEFAULT_WHEN_KEYWORD,
      this.getInnerSpace('postWhen'),
      this.whenExpression.toString(),
      this.getInnerSpace('postWhenExpression'),
      this.thenKeyword || SqlWhenThenPart.DEFAULT_THEN_KEYWORD,
      this.getInnerSpace('postThen'),
      this.thenExpression.toString(),
    ].join('');
  }

  public changeWhenExpression(whenExpression: SqlExpression): this {
    const value = this.valueOf();
    value.whenExpression = whenExpression;
    return SqlBase.fromValue(value);
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

    const whenExpression = this.whenExpression._walkHelper(nextStack, fn, postorder);
    if (!whenExpression) return;
    if (whenExpression !== this.whenExpression) {
      ret = ret.changeWhenExpression(whenExpression);
    }

    const thenExpression = this.thenExpression._walkHelper(nextStack, fn, postorder);
    if (!thenExpression) return;
    if (thenExpression !== this.thenExpression) {
      ret = ret.changeThenExpression(thenExpression);
    }

    return ret;
  }

  public clearStaticKeywords(): this {
    const value = this.valueOf();
    delete value.whenKeyword;
    delete value.thenKeyword;
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlWhenThenPart);
