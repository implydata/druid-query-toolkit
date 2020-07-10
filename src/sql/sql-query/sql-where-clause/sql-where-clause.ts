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

import { parseSqlExpression } from '../../../parser';
import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SqlExpression } from '../../sql-expression';

export interface SqlWhereClauseValue extends SqlBaseValue {
  keyword?: string;
  expression: SqlExpression;
}

export class SqlWhereClause extends SqlBase {
  static type = 'whereClause';

  static DEFAULT_KEYWORD = 'WHERE';

  static create(expression: SqlWhereClause | SqlExpression | string): SqlWhereClause {
    if (expression instanceof SqlWhereClause) return expression;
    return new SqlWhereClause({
      expression: parseSqlExpression(expression),
    });
  }

  public readonly keyword?: string;
  public readonly expression: SqlExpression;

  constructor(options: SqlWhereClauseValue) {
    super(options, SqlWhereClause.type);
    this.keyword = options.keyword;
    this.expression = options.expression;
  }

  public valueOf(): SqlWhereClauseValue {
    const value = super.valueOf() as SqlWhereClauseValue;
    value.keyword = this.keyword;
    value.expression = this.expression;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.keyword || SqlWhereClause.DEFAULT_KEYWORD,
      this.getInnerSpace('postKeyword'),
    ];

    rawParts.push(this.expression.toString());

    return rawParts.join('');
  }

  public changeKeyword(keyword: string | undefined): this {
    const value = this.valueOf();
    value.keyword = keyword;
    return SqlBase.fromValue(value);
  }

  public changeExpression(expression: SqlExpression | string): this {
    const value = this.valueOf();
    value.expression = parseSqlExpression(expression);
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const expression = this.expression._walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression);
    }

    return ret;
  }

  public clearStaticKeywords(): this {
    const value = this.valueOf();
    delete value.keyword;
    return SqlBase.fromValue(value);
  }

  public removeColumnFromAnd(column: string): SqlWhereClause | undefined {
    const newExpression = this.expression.removeColumnFromAnd(column);
    if (!newExpression) return;
    return this.changeExpression(newExpression);
  }
}

SqlBase.register(SqlWhereClause.type, SqlWhereClause);
