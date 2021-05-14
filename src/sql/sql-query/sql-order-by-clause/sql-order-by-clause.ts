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

import { SqlBase, SqlType, Substitutor } from '../../sql-base';
import { SqlLiteral } from '../../sql-literal/sql-literal';
import { SeparatedArray } from '../../utils';
import { SqlAlias } from '../sql-alias/sql-alias';
import { SqlClause, SqlClauseValue } from '../sql-clause';
import { SqlOrderByExpression } from '../sql-order-by-expression/sql-order-by-expression';

export interface SqlOrderByClauseValue extends SqlClauseValue {
  expressions: SeparatedArray<SqlOrderByExpression>;
}

export class SqlOrderByClause extends SqlClause {
  static type: SqlType = 'orderByClause';

  static DEFAULT_ORDER_KEYWORD = 'ORDER';
  static DEFAULT_BY_KEYWORD = 'BY';

  static create(
    expressions:
      | SeparatedArray<SqlOrderByExpression>
      | SqlOrderByExpression[]
      | SqlOrderByExpression,
  ): SqlOrderByClause {
    if (expressions instanceof SqlOrderByExpression) {
      return new SqlOrderByClause({
        expressions: SeparatedArray.fromSingleValue(expressions),
      });
    } else {
      return new SqlOrderByClause({
        expressions: SeparatedArray.fromArray(expressions),
      });
    }
  }

  public readonly expressions: SeparatedArray<SqlOrderByExpression>;

  constructor(options: SqlOrderByClauseValue) {
    super(options, SqlOrderByClause.type);
    this.expressions = options.expressions;
  }

  public valueOf(): SqlOrderByClauseValue {
    const value = super.valueOf() as SqlOrderByClauseValue;
    value.expressions = this.expressions;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('order', SqlOrderByClause.DEFAULT_ORDER_KEYWORD),
      this.getSpace('postOrder'),
      this.getKeyword('by', SqlOrderByClause.DEFAULT_BY_KEYWORD),
      this.getSpace('postBy'),
      this.expressions.toString(),
    ].join('');
  }

  public changeExpressions(
    expressions: SeparatedArray<SqlOrderByExpression> | SqlOrderByExpression[],
  ): this {
    const value = this.valueOf();
    value.expressions = SeparatedArray.fromArray(expressions);
    return SqlBase.fromValue(value);
  }

  public addExpression(
    expression: SqlOrderByExpression,
    where: 'start' | 'end' = 'end',
  ): SqlOrderByClause {
    const { expressions } = this;
    return this.changeExpressions(expressions.insert(where === 'start' ? 0 : Infinity, expression));
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    const expressions = SqlBase.walkSeparatedArray(this.expressions, nextStack, fn, postorder);
    if (!expressions) return;
    if (expressions !== this.expressions) {
      ret = ret.changeExpressions(expressions);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.expressions = this.expressions.clearSeparators();
    return SqlBase.fromValue(value);
  }

  public toArray(): readonly SqlOrderByExpression[] {
    return this.expressions.values;
  }

  public addFirst(orderBy: SqlOrderByExpression): SqlOrderByClause {
    return this.changeExpressions(this.expressions.prepend(orderBy));
  }

  public removeExpression(
    selectExpression: SqlAlias,
    selectIndex: number,
  ): SqlOrderByClause | undefined {
    if (!this.expressions) return this;
    const newExpression = this.expressions.filterMap(orderByExpression => {
      const { expression } = orderByExpression;
      if (expression instanceof SqlLiteral && expression.isIndex()) {
        const expressionIndex = expression.getIndexValue();
        if (expressionIndex > selectIndex) {
          orderByExpression = orderByExpression.changeExpression(expression.incrementIndex(-1));
        } else if (expressionIndex === selectIndex) {
          return;
        }
      }
      if (expression.equals(selectExpression.expression)) return;
      return orderByExpression;
    });

    if (!newExpression) return;
    return this.changeExpressions(newExpression);
  }

  public shiftIndexes(aboveIndex: number): SqlOrderByClause {
    if (!this.expressions) return this;
    return this.changeExpressions(
      this.expressions.map(orderExpression => {
        if (orderExpression.isIndex()) {
          const orderExpressionIndex = orderExpression.getIndexValue();
          if (aboveIndex <= orderExpressionIndex) {
            return orderExpression.incrementIndex();
          }
        }
        return orderExpression;
      }),
    );
  }
}

SqlBase.register(SqlOrderByClause);
