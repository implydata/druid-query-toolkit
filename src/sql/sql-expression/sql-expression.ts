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

import {
  LiteralValue,
  SeparatedArray,
  Separator,
  SqlAlias,
  SqlComparison,
  SqlLiteral,
  SqlMulti,
  SqlOrderByPart,
} from '..';
import { filterMap } from '../../utils';
import { SqlBase, Substitutor } from '../sql-base';

export abstract class SqlExpression extends SqlBase {
  static and(...args: (SqlExpression | undefined)[]) {
    const compactArgs = filterMap(args, a => {
      if (!a) return;
      if (a instanceof SqlMulti && a.expressionType === 'or') {
        return a.addParens();
      }
      return a;
    });

    if (compactArgs.length === 0) {
      return SqlLiteral.TRUE;
    } else if (compactArgs.length === 1) {
      return compactArgs[0];
    } else {
      return new SqlMulti({
        expressionType: 'and',
        args: SeparatedArray.fromArray(compactArgs, Separator.symmetricSpace('AND')),
      });
    }
  }

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

  public as(alias?: string) {
    return SqlAlias.factory(this, alias);
  }

  public toOrderByPart(direction: string | undefined): SqlOrderByPart {
    return SqlOrderByPart.factory(this, direction);
  }

  // SqlComparison

  public equal(rhs: SqlExpression): SqlComparison {
    return SqlComparison.equal(this, rhs);
  }

  public unequal(rhs: SqlExpression): SqlComparison {
    return SqlComparison.unequal(this, rhs);
  }

  public lessThan(rhs: SqlExpression): SqlComparison {
    return SqlComparison.lessThan(this, rhs);
  }

  public greaterThan(rhs: SqlExpression): SqlComparison {
    return SqlComparison.greaterThan(this, rhs);
  }

  public lessThanOrEqual(rhs: SqlExpression): SqlComparison {
    return SqlComparison.lessThanOrEqual(this, rhs);
  }

  public greaterThanOrEqual(rhs: SqlExpression): SqlComparison {
    return SqlComparison.greaterThanOrEqual(this, rhs);
  }

  public isNull(): SqlComparison {
    return SqlComparison.isNull(this);
  }

  public isNotNull(): SqlComparison {
    return SqlComparison.isNotNull(this);
  }

  public like(rhs: SqlLiteral | string, escape?: SqlLiteral | string): SqlComparison {
    return SqlComparison.like(this, rhs, escape);
  }

  public between(start: SqlLiteral | LiteralValue, end: SqlLiteral | LiteralValue): SqlComparison {
    return SqlComparison.between(this, start, end);
  }

  public betweenSymmetric(
    start: SqlLiteral | LiteralValue,
    end: SqlLiteral | LiteralValue,
  ): SqlComparison {
    return SqlComparison.betweenSymmetric(this, start, end);
  }

  // SqlMulti

  public and(expression: SqlExpression): SqlExpression {
    return SqlExpression.and(this, expression);
  }

  public removeColumnFromAnd(column: string): SqlExpression | undefined {
    if (this.containsColumn(column)) return;
    return this;
  }
}
