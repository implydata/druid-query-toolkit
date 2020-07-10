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

import { SqlAlias, SqlOrderByExpression } from '..';
import { SqlBase, Substitutor } from '../../sql-base';
import { SqlLiteral } from '../../sql-expression';
import { SeparatedArray } from '../../utils';
import { SqlClause, SqlClauseValue } from '../sql-clause';

export interface SqlOrderByClauseValue extends SqlClauseValue {
  expressions: SeparatedArray<SqlOrderByExpression>;
}

export class SqlOrderByClause extends SqlClause {
  static type = 'orderByClause';

  static DEFAULT_KEYWORD = 'ORDER BY';

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
    const rawParts: string[] = [
      this.keyword || SqlOrderByClause.DEFAULT_KEYWORD,
      this.getInnerSpace('postKeyword'),
    ];

    rawParts.push(this.expressions.toString());

    return rawParts.join('');
  }

  public changeExpressions(
    expressions: SeparatedArray<SqlOrderByExpression> | SqlOrderByExpression[],
  ): this {
    const value = this.valueOf();
    value.expressions = SeparatedArray.fromArray(expressions);
    return SqlBase.fromValue(value);
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

  public clearSeparators(): this {
    const value = this.valueOf();
    value.expressions = this.expressions.clearSeparators();
    return SqlBase.fromValue(value);
  }

  public toArray(): readonly SqlOrderByExpression[] {
    return this.expressions.values;
  }

  public addFirst(orderBy: SqlOrderByExpression): SqlOrderByClause {
    return this.changeExpressions(this.expressions.addFirst(orderBy));
  }

  public removeExpression(
    selectExpression: SqlAlias,
    selectIndex: number,
  ): SqlOrderByClause | undefined {
    if (!this.expressions) return this;
    const sqlIndex = selectIndex + 1;
    const newExpression = this.expressions.filterMap(orderByExpression => {
      const { expression } = orderByExpression;
      if (expression instanceof SqlLiteral && expression.isInteger()) {
        if (Number(expression.value) > sqlIndex) {
          orderByExpression = orderByExpression.changeExpression(expression.increment(-1));
        } else if (expression.value === sqlIndex) {
          return;
        }
      }
      if (expression.equals(selectExpression.expression)) return;
      return orderByExpression;
    });

    if (!newExpression) return;
    return this.changeExpressions(newExpression);
  }
}

SqlBase.register(SqlOrderByClause.type, SqlOrderByClause);
