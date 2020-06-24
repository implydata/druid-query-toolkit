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

import { Direction, SqlAlias, SqlMulti, SqlOrderByPart } from '..';
import { SqlBase, Substitutor } from '../sql-base';

export abstract class SqlExpression extends SqlBase {
  public walkHelper(
    stack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    const ret = super.walkHelper(stack, fn, postorder);
    if (!ret) return;
    if (ret === this) return this;
    if (ret instanceof SqlExpression) {
      return ret;
    } else {
      throw new Error('must return a sql expression');
    }
  }

  public walkInner(
    _nextStack: SqlBase[],
    _fn: Substitutor,
    _postorder: boolean,
  ): SqlExpression | undefined {
    return this;
  }

  public as(alias: string) {
    return SqlAlias.factory(this, alias);
  }

  public sort(direction: Direction | undefined): SqlOrderByPart {
    return SqlOrderByPart.factory(this, direction);
  }

  public addExpressionToAnd(expression: SqlExpression): SqlExpression {
    return SqlMulti.and([this, expression]);
  }

  public removeColumnFromAnd(column: string): SqlExpression | undefined {
    if (this.containsColumn(column)) return;
    return this;
  }
}
