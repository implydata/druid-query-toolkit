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

import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import { SqlExpression } from '../../sql-expression';
import { SqlLiteral } from '../../sql-literal/sql-literal';

export type SqlOrderByDirection = 'ASC' | 'DESC';

export type SqlOrderByNulls = 'FIRST' | 'LAST';

export interface SqlOrderByExpressionValue extends SqlBaseValue {
  expression: SqlExpression;
  direction?: SqlOrderByDirection;
  nulls?: SqlOrderByNulls;
}

/**
 * An expression with a direction, an item of an ORDER BY. It is an expression itself so it can
 * also stand in the lists of a pipe AGGREGATE, where an item can carry an order suffix
 * (`|> AGGREGATE COUNT(*) AS c DESC GROUP BY x ASC`).
 */
export class SqlOrderByExpression extends SqlExpression {
  static type: SqlTypeDesignator = 'orderByExpression';

  static create(
    expression: SqlExpression,
    direction?: SqlOrderByDirection,
    nulls?: SqlOrderByNulls,
  ) {
    return new SqlOrderByExpression({
      expression: SqlExpression.verify(expression),
      direction,
      nulls,
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
  public readonly nulls?: SqlOrderByNulls;

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

    const nulls = options.nulls;
    this.nulls = nulls;
    if (nulls) {
      if (nulls !== 'FIRST' && nulls !== 'LAST') {
        throw new Error(`invalid nulls ${nulls}`);
      }
    }
  }

  public valueOf(): SqlOrderByExpressionValue {
    const value = super.valueOf() as SqlOrderByExpressionValue;
    value.expression = this.expression;
    value.direction = this.direction;
    value.nulls = this.nulls;
    return value;
  }

  protected _toRawString(): string {
    const rawParts = [this.expression.toString()];

    if (this.direction) {
      rawParts.push(this.getSpace('preDirection'), this.getKeyword('direction', this.direction));
    }

    if (this.nulls) {
      rawParts.push(this.getSpace('preNulls'), this.getKeyword('nulls', `NULLS ${this.nulls}`));
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

  public changeNulls(nulls: SqlOrderByNulls | undefined): this {
    const value = this.valueOf();
    if (nulls) {
      value.nulls = nulls;
    } else {
      delete value.nulls;
      value.spacing = this.getSpacingWithout('preNulls');
    }
    value.keywords = this.getKeywordsWithout('nulls');
    return SqlBase.fromValue(value);
  }

  public getEffectiveDirection(): SqlOrderByDirection {
    const { direction } = this;
    if (!direction) return 'ASC';
    return direction;
  }

  /**
   * Flips the direction, and the NULLS placement if there is one, so the rows come out in the
   * exact opposite order
   */
  public reverseDirection(): this {
    const ret = this.changeDirection(this.getEffectiveDirection() === 'ASC' ? 'DESC' : 'ASC');
    const { nulls } = this;
    if (!nulls) return ret;
    return ret.changeNulls(nulls === 'FIRST' ? 'LAST' : 'FIRST');
  }

  public getOutputName(): string | undefined {
    return this.expression.getOutputName();
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
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
