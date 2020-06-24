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
import { SqlExpression } from '../../sql-expression';

export type Direction = 'ASC' | 'DESC';

export interface SqlOrderByPartValue extends SqlBaseValue {
  expression: SqlExpression;
  direction?: string;
}

export class SqlOrderByPart extends SqlBase {
  static type = 'orderByPart';

  static factory(expression: SqlExpression, direction?: string) {
    return new SqlOrderByPart({
      expression,
      direction,
    });
  }

  public readonly expression: SqlExpression;
  public readonly direction?: string;

  constructor(options: SqlOrderByPartValue) {
    super(options, SqlOrderByPart.type);
    this.expression = options.expression;

    const direction = options.direction;
    this.direction = direction;
    if (direction) {
      const directionUpper = direction.toUpperCase();
      if (directionUpper !== 'ASC' && directionUpper !== 'DESC') {
        throw new Error(`invalid direction ${direction}`);
      }
    }
  }

  public valueOf(): SqlOrderByPartValue {
    const value = super.valueOf() as SqlOrderByPartValue;
    value.expression = this.expression;
    value.direction = this.direction;
    return value;
  }

  toRawString(): string {
    const rawParts = [this.expression.toString()];

    if (this.direction) {
      rawParts.push(this.getInnerSpace('preDirection'), this.direction);
    }

    return rawParts.join('');
  }

  public changeExpression(expression: SqlExpression): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public changeDirection(direction: Direction | undefined): this {
    const value = this.valueOf();
    if (direction) {
      value.direction = direction;
    } else {
      delete value.direction;
      value.innerSpacing = this.getInnerSpacingWithout('preDirection');
    }
    return SqlBase.fromValue(value);
  }

  public getEffectiveDirection(): Direction {
    const { direction } = this;
    if (!direction) return 'ASC';
    return direction.toUpperCase() as Direction;
  }

  public walkInner(nextStack: SqlBase[], fn: Substitutor, postorder: boolean): SqlBase | undefined {
    let ret = this;

    const expression = this.expression.walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression);
    }

    return ret;
  }
}

SqlBase.register(SqlOrderByPart.type, SqlOrderByPart);
