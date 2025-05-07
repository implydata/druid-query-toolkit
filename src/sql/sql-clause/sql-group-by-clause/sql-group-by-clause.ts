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

import { isEmptyArray } from '../../../utils';
import { SeparatedArray } from '../../helpers';
import type { SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import type { SqlExpression } from '../../sql-expression';
import { SqlLiteral } from '../../sql-literal/sql-literal';
import type { SqlClauseValue } from '../sql-clause';
import { SqlClause } from '../sql-clause';

export type SqlGroupByDecorator = 'ROLLUP' | 'CUBE' | 'GROUPING SETS';

export interface SqlGroupByClauseValue extends SqlClauseValue {
  decorator?: SqlGroupByDecorator;
  innerParens?: boolean;
  expressions?: SeparatedArray<SqlExpression>;
}

export class SqlGroupByClause extends SqlClause {
  static type: SqlTypeDesignator = 'groupByClause';

  static DEFAULT_GROUP_BY_KEYWORD = 'GROUP BY';

  static create(expressions?: SeparatedArray<SqlExpression> | SqlExpression[]): SqlGroupByClause {
    return new SqlGroupByClause({
      expressions: SeparatedArray.fromPossiblyEmptyArray(expressions),
    });
  }

  public readonly decorator?: SqlGroupByDecorator;
  public readonly innerParens: boolean;
  public readonly expressions?: SeparatedArray<SqlExpression>;

  constructor(options: SqlGroupByClauseValue) {
    super(options, SqlGroupByClause.type);
    this.decorator = options.decorator;
    this.innerParens = Boolean(options.innerParens);
    this.expressions = options.expressions;
  }

  public valueOf(): SqlGroupByClauseValue {
    const value = super.valueOf() as SqlGroupByClauseValue;
    value.decorator = this.decorator;
    if (this.innerParens) value.innerParens = true;
    value.expressions = this.expressions;
    return value;
  }

  protected _toRawString(): string {
    const rawParts = [
      this.getKeyword('groupBy', SqlGroupByClause.DEFAULT_GROUP_BY_KEYWORD),
      this.getSpace('postGroupBy'),
    ];

    if (this.decorator) {
      rawParts.push(this.getKeyword('decorator', this.decorator), this.getSpace('postDecorator'));
    }

    const effectiveInnerParens = Boolean(this.innerParens || !this.expressions);
    if (effectiveInnerParens) {
      rawParts.push('(', this.getSpace('postLeftParen', ''));
    }

    if (this.expressions) {
      rawParts.push(this.expressions.toString(), this.getSpace('postExpressions', ''));
    }

    if (effectiveInnerParens) {
      rawParts.push(')');
    }

    return rawParts.join('');
  }

  public changeExpressions(
    expressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): this {
    const value = this.valueOf();
    if (!expressions || isEmptyArray(expressions)) {
      delete value.expressions;
      delete value.innerParens;
    } else {
      value.expressions = SeparatedArray.fromArray(expressions);
    }
    return SqlBase.fromValue(value);
  }

  public changeInnerParens(innerParens: boolean): this {
    const value = this.valueOf();
    if (innerParens) {
      value.innerParens = true;
    } else {
      delete value.innerParens;
    }
    return SqlBase.fromValue(value);
  }

  public addExpression(
    expression: SqlExpression,
    where: 'start' | 'end' = 'end',
  ): SqlGroupByClause {
    const { expressions } = this;
    return this.changeExpressions(
      expressions
        ? expressions.insert(where === 'start' ? 0 : Infinity, expression)
        : SeparatedArray.fromSingleValue(expression),
    );
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

  public removeExpression(selectExpression: SqlExpression, selectIndex: number): SqlGroupByClause {
    if (!this.expressions) return this;
    return this.changeExpressions(
      this.expressions.filterMap(expression => {
        if (expression instanceof SqlLiteral && expression.isIndex()) {
          const expressionIndex = expression.getIndexValue();
          if (selectIndex < expressionIndex) {
            return expression.incrementIndex(-1);
          } else if (expressionIndex === selectIndex) {
            return;
          }
        }
        if (expression.equals(selectExpression.getUnderlyingExpression())) return;
        return expression;
      }),
    );
  }

  public shiftIndexes(aboveIndex: number): SqlGroupByClause {
    if (!this.expressions) return this;
    return this.changeExpressions(
      this.expressions.map(expression => {
        if (expression instanceof SqlLiteral && expression.isIndex()) {
          const expressionIndex = expression.getIndexValue();
          if (aboveIndex <= expressionIndex) {
            return expression.incrementIndex();
          }
        }
        return expression;
      }),
    );
  }
}

SqlBase.register(SqlGroupByClause);
