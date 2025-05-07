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

import { SeparatedArray } from '../../helpers';
import type { SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import type { SqlExpression } from '../../sql-expression';
import { SqlLiteral } from '../../sql-literal/sql-literal';
import type { SqlClauseValue } from '../sql-clause';
import { SqlClause } from '../sql-clause';

export interface SqlClusteredByClauseValue extends SqlClauseValue {
  expressions: SeparatedArray<SqlExpression>;
}

export class SqlClusteredByClause extends SqlClause {
  static type: SqlTypeDesignator = 'clusteredByClause';

  static DEFAULT_CLUSTERED_BY_KEYWORD = 'CLUSTERED BY';

  static create(
    expressions: SeparatedArray<SqlExpression> | SqlExpression[],
  ): SqlClusteredByClause {
    return new SqlClusteredByClause({
      expressions: SeparatedArray.fromArray(expressions),
    });
  }

  public readonly expressions: SeparatedArray<SqlExpression>;

  constructor(options: SqlClusteredByClauseValue) {
    super(options, SqlClusteredByClause.type);
    this.expressions = options.expressions;
  }

  public valueOf(): SqlClusteredByClauseValue {
    const value = super.valueOf() as SqlClusteredByClauseValue;
    value.expressions = this.expressions;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('clusteredBy', SqlClusteredByClause.DEFAULT_CLUSTERED_BY_KEYWORD),
      this.getSpace('postClusteredBy'),
      this.expressions.toString(),
    ].join('');
  }

  public changeExpressions(expressions: SeparatedArray<SqlExpression> | SqlExpression[]): this {
    const value = this.valueOf();
    value.expressions = SeparatedArray.fromArray(expressions);
    return SqlBase.fromValue(value);
  }

  public addExpression(
    expression: SqlExpression,
    where: 'start' | 'end' = 'end',
  ): SqlClusteredByClause {
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

    const expressions = SqlBase.walkSeparatedArray(this.expressions, nextStack, fn, postorder);
    if (!expressions) return;
    if (expressions !== this.expressions) {
      ret = ret.changeExpressions(expressions);
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
    return this.expressions.values;
  }

  public shiftIndexes(aboveIndex: number): SqlClusteredByClause {
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

SqlBase.register(SqlClusteredByClause);
