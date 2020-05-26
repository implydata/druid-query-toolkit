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
import { SqlExpression } from '../../sql-expression';

export type Direction = 'ASC' | 'DESC';

export interface SqlOrderByPartValue extends SqlBaseValue {
  expression: SqlExpression;
  direction?: string;
}

export class SqlOrderByPart extends SqlBase {
  static type = 'orderByPart';

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

  toRawString(): string {
    const rawParts = [this.expression.toString()];

    if (this.direction) {
      rawParts.push(this.getInnerSpace('preDirection'), this.direction);
    }

    return rawParts.join('');
  }

  public walk(fn: (t: SqlBase) => void) {
    super.walk(fn);
    this.expression.walk(fn);
  }

  public getActualDirection(): Direction {
    const { direction } = this;
    if (!direction) return 'DESC';
    return direction.toUpperCase() as Direction;
  }
}

SqlBase.register(SqlOrderByPart.type, SqlOrderByPart);
