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

import type { SqlTypeDesignator, Substitutor } from '../../sql-base';
import { SqlBase } from '../../sql-base';
import { SqlExpression } from '../../sql-expression';
import { SqlMulti } from '../../sql-multi/sql-multi';
import { NEWLINE_INDENT, SPACE } from '../../utils';
import type { SqlClauseValue } from '../sql-clause';
import { SqlClause } from '../sql-clause';

export interface SqlHavingClauseValue extends SqlClauseValue {
  expression: SqlExpression;
}

export class SqlHavingClause extends SqlClause {
  static type: SqlTypeDesignator = 'havingClause';

  static DEFAULT_HAVING_KEYWORD = 'HAVING';

  static create(expression: SqlHavingClause | SqlExpression): SqlHavingClause {
    if (expression instanceof SqlHavingClause) return expression;
    return new SqlHavingClause({
      expression: SqlExpression.verify(expression),
    });
  }

  public readonly expression: SqlExpression;

  constructor(options: SqlHavingClauseValue) {
    super(options, SqlHavingClause.type);
    this.expression = options.expression;
  }

  public valueOf(): SqlHavingClauseValue {
    const value = super.valueOf() as SqlHavingClauseValue;
    value.expression = this.expression;
    return value;
  }

  protected _toRawString(): string {
    const { expression } = this;
    const indent = expression instanceof SqlMulti && expression.numArgs() >= 3;
    return [
      this.getKeyword('having', SqlHavingClause.DEFAULT_HAVING_KEYWORD),
      this.getSpace('postHaving', indent ? NEWLINE_INDENT : SPACE),
      expression.toString(),
    ].join('');
  }

  public changeExpression(expression: SqlExpression): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlClause | undefined {
    let ret = this;

    const expression = this.expression._walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression);
    }

    return ret;
  }

  public removeColumnFromAnd(column: string): SqlHavingClause | undefined {
    const newExpression = this.expression.removeColumnFromAnd(column);
    if (!newExpression) return;
    return this.changeExpression(newExpression);
  }
}

SqlBase.register(SqlHavingClause);
