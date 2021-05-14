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
import { SqlExpression } from '../../sql-expression';
import { SqlLiteral } from '../../sql-literal/sql-literal';

export type SqlOrderByDirection = 'ASC' | 'DESC';

export interface SqlOrderByExpressionValue extends SqlBaseValue {
  expression: SqlExpression;
  direction?: SqlOrderByDirection;
}

export class SqlOrderByExpression extends SqlBase {
  static type: SqlType = 'orderByExpression';

  static create(expression: SqlExpression, direction?: SqlOrderByDirection) {
    return new SqlOrderByExpression({
      expression,
      direction,
    });
  }

  static index(value: number, direction?: SqlOrderByDirection) {
    return new SqlOrderByExpression({
      expression: SqlLiteral.index(value),
      direction,
    });
  }

  public readonly expression: SqlExpression;
  public readonly direction?: SqlOrderByDirection;

  constructor(options: SqlOrderByExpressionValue) {
    super(options, SqlOrderByExpression.type);
    this.expression = options.expression;

    const direction = options.direction;
    this.direction = direction;
    if (direction) {
      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new Error(`invalid direction ${direction}`);
      }
    }
  }

  public valueOf(): SqlOrderByExpressionValue {
    const value = super.valueOf() as SqlOrderByExpressionValue;
    value.expression = this.expression;
    value.direction = this.direction;
    return value;
  }

  protected _toRawString(): string {
    const rawParts = [this.expression.toString()];

    if (this.direction) {
      rawParts.push(this.getSpace('preDirection'), this.getKeyword('direction', this.direction));
    }

    return rawParts.join('');
  }

  public changeExpression(expression: SqlExpression): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public changeDirection(direction: SqlOrderByDirection | undefined): this {
    const value = this.valueOf();
    if (direction) {
      value.direction = direction;
    } else {
      delete value.direction;
      value.spacing = this.getSpacingWithout('preDirection');
    }
    value.keywords = this.getKeywordsWithout('direction');
    return SqlBase.fromValue(value);
  }

  public getEffectiveDirection(): SqlOrderByDirection {
    const { direction } = this;
    if (!direction) return 'ASC';
    return direction;
  }

  public reverseDirection(): this {
    return this.changeDirection(this.getEffectiveDirection() === 'ASC' ? 'DESC' : 'ASC');
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const expression = this.expression._walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression);
    }

    return ret;
  }

  public isIndex(): boolean {
    const { expression } = this;
    return expression instanceof SqlLiteral && expression.isIndex();
  }

  public getIndexValue(): number {
    const { expression } = this;
    return expression instanceof SqlLiteral ? expression.getIndexValue() : -1;
  }

  public incrementIndex(amount = 1): SqlOrderByExpression {
    const { expression } = this;
    if (expression instanceof SqlLiteral) {
      return this.changeExpression(expression.incrementIndex(amount));
    } else {
      return this;
    }
  }
}

SqlBase.register(SqlOrderByExpression);
