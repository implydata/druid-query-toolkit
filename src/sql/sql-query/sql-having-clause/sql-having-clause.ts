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
import { SqlExpression } from '../../sql-expression';
import { SqlClause, SqlClauseValue } from '../sql-clause';

export interface SqlHavingClauseValue extends SqlClauseValue {
  expression: SqlExpression;
}

export class SqlHavingClause extends SqlClause {
  static type: SqlType = 'havingClause';

  static DEFAULT_KEYWORD = 'HAVING';

  static create(expression: SqlExpression | string): SqlHavingClause {
    return new SqlHavingClause({
      expression: SqlExpression.parse(expression),
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
    const rawParts: string[] = [
      this.keyword || SqlHavingClause.DEFAULT_KEYWORD,
      this.getInnerSpace('postKeyword'),
    ];

    rawParts.push(this.expression.toString());

    return rawParts.join('');
  }

  public changeExpression(expression: SqlExpression | string): this {
    const value = this.valueOf();
    value.expression = SqlExpression.parse(expression);
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

SqlBase.register(SqlHavingClause.type, SqlHavingClause);
