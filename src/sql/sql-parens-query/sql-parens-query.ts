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

import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlExpression } from '../sql-expression';
import type { SqlQueryBaseValue } from '../sql-query-base/sql-query-base';
import { SqlQueryBase } from '../sql-query-base/sql-query-base';

export interface SqlParensQueryValue extends SqlQueryBaseValue {
  query: SqlQueryBase;
}

/**
 * A query in parentheses with more of the statement outside of them, like the `(FROM t)` in
 * `(FROM t) UNION ALL (FROM u)` or `(SELECT ...) ORDER BY x LIMIT 5`. The parentheses belong to
 * the wrapped query, while the clauses outside of them (the prefix, ORDER BY, LIMIT, UNION ALL,
 * ...) belong to this one. A statement that is only a query in parentheses parses to that
 * query, with its parens, so this only shows up when there is something around them.
 */
export class SqlParensQuery extends SqlQueryBase {
  static type: SqlTypeDesignator = 'parensQuery';

  static create(query: SqlQueryBase): SqlParensQuery {
    return new SqlParensQuery({ query: query.ensureParens() });
  }

  public readonly query: SqlQueryBase;

  constructor(options: SqlParensQueryValue) {
    super(options, SqlParensQuery.type);
    this.query = options.query;
  }

  public valueOf(): SqlParensQueryValue {
    const value = super.valueOf() as SqlParensQueryValue;
    value.query = this.query;
    return value;
  }

  protected _toRawBodyString(): string {
    return this.query.toString();
  }

  public changeQuery(query: SqlQueryBase): this {
    if (this.query === query) return this;
    const value = this.valueOf();
    value.query = query.ensureParens();
    return SqlBase.fromValue(value);
  }

  protected _walkInnerBody(
    ret: this,
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): this | undefined {
    const query = this.query._walkHelper(nextStack, fn, postorder);
    if (!query) return;
    if (query !== this.query) {
      if (!(query instanceof SqlQueryBase)) throw new Error('must return a sql query');
      ret = ret.changeQuery(query);
    }

    return ret;
  }

  /* ~~~~~ Questions answered by the inner query ~~~~~ */

  public getSelectExpressionsArray(): readonly SqlExpression[] {
    return this.query.getSelectExpressionsArray();
  }

  public getWhereExpression(): SqlExpression | undefined {
    return this.query.getWhereExpression();
  }

  public getGroupByExpressions(): readonly SqlExpression[] | undefined {
    return this.query.getGroupByExpressions();
  }

  public getHavingExpression(): SqlExpression | undefined {
    return this.query.getHavingExpression();
  }
}

SqlBase.register(SqlParensQuery);
