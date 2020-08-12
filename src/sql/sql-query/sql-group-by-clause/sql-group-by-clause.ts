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

import { SqlAlias } from '..';
import { SqlBase, SqlType, Substitutor } from '../../sql-base';
import { SqlExpression, SqlLiteral } from '../../sql-expression';
import { SeparatedArray } from '../../utils';
import { SqlClause, SqlClauseValue } from '../sql-clause';

export interface SqlGroupByClauseValue extends SqlClauseValue {
  keyword?: string;
  expressions?: SeparatedArray<SqlExpression>;
}

export class SqlGroupByClause extends SqlClause {
  static type: SqlType = 'groupByClause';

  static DEFAULT_KEYWORD = 'GROUP BY';

  static create(expressions: SeparatedArray<SqlExpression> | SqlExpression[]): SqlGroupByClause {
    return new SqlGroupByClause({
      expressions:
        Array.isArray(expressions) && !expressions.length
          ? undefined
          : SeparatedArray.fromArray(expressions),
    });
  }

  public readonly keyword?: string;
  public readonly expressions?: SeparatedArray<SqlExpression>;

  constructor(options: SqlGroupByClauseValue) {
    super(options, SqlGroupByClause.type);
    this.expressions = options.expressions;
  }

  public valueOf(): SqlGroupByClauseValue {
    const value = super.valueOf() as SqlGroupByClauseValue;
    value.expressions = this.expressions;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.keyword || SqlGroupByClause.DEFAULT_KEYWORD,
      this.getInnerSpace('postKeyword'),
    ];

    rawParts.push(this.expressions ? this.expressions.toString() : '()');

    return rawParts.join('');
  }

  public changeExpressions(
    expressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): this {
    const value = this.valueOf();
    if (!expressions || (Array.isArray(expressions) && !expressions.length)) {
      delete value.expressions;
    } else {
      value.expressions = SeparatedArray.fromArray(expressions);
    }
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    if (this.expressions) {
      const expressions = SqlBase.walkSeparatedArray(this.expressions, nextStack, fn, postorder);
      if (!expressions) return;
      if (expressions !== this.expressions) {
        ret = ret.changeExpressions(expressions);
      }
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    if (!this.expressions) return this;
    const value = this.valueOf();
    value.expressions = this.expressions.clearSeparators();
    return SqlBase.fromValue(value);
  }

  public toArray(): readonly SqlExpression[] {
    return this.expressions ? this.expressions.values : [];
  }

  public removeExpression(selectExpression: SqlAlias, selectIndex: number): SqlGroupByClause {
    if (!this.expressions) return this;
    const sqlIndex = selectIndex + 1;
    return this.changeExpressions(
      this.expressions.filterMap(expression => {
        if (expression instanceof SqlLiteral && expression.isInteger()) {
          if (Number(expression.value) > sqlIndex) {
            return expression.increment(-1);
          } else if (expression.value === sqlIndex) {
            return;
          }
        }
        if (expression.equals(selectExpression.expression)) return;
        return expression;
      }),
    );
  }
}

SqlBase.register(SqlGroupByClause);
