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

import type { SeparatedArray } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlJoinPart } from '../sql-clause';
import { SqlFromClause } from '../sql-clause';
import { SqlExpression } from '../sql-expression';
import type { SqlQueryBaseValue } from '../sql-query-base/sql-query-base';
import { SqlQueryBase } from '../sql-query-base/sql-query-base';
import { SqlStar } from '../sql-star/sql-star';
import { SqlTable } from '../sql-table/sql-table';

export interface SqlFromQueryValue extends SqlQueryBaseValue {
  fromClause: SqlFromClause;
}

/**
 * A pipe syntax `FROM ...` query: a whole FROM clause on its own, with any aliases, joins and
 * comma separated tables. It is usually followed by pipe operators, which turn it into a
 * SqlPipesQuery, but it is also a query on its own.
 */
export class SqlFromQuery extends SqlQueryBase {
  static type: SqlTypeDesignator = 'fromQuery';

  static create(from: SqlFromQuery | SqlFromClause | SqlExpression | string): SqlFromQuery {
    if (from instanceof SqlFromQuery) return from;
    return new SqlFromQuery({
      fromClause:
        from instanceof SqlFromClause
          ? from
          : SqlFromClause.create([
              from instanceof SqlExpression ? from.convertToTable() : SqlTable.create(from),
            ]),
    });
  }

  static optionalQuotes(table: SqlFromQuery | SqlTable | string): SqlFromQuery {
    if (table instanceof SqlFromQuery) return table;
    return SqlFromQuery.create(SqlTable.optionalQuotes(table));
  }

  public readonly fromClause: SqlFromClause;

  constructor(options: SqlFromQueryValue) {
    super(options, SqlFromQuery.type);
    this.fromClause = options.fromClause;
  }

  public valueOf(): SqlFromQueryValue {
    const value = super.valueOf() as SqlFromQueryValue;
    value.fromClause = this.fromClause;
    return value;
  }

  protected _toRawBodyString(): string {
    return this.fromClause.toString();
  }

  public changeFromClause(fromClause: SqlFromClause): this {
    if (this.fromClause === fromClause) return this;
    const value = this.valueOf();
    value.fromClause = fromClause;
    return SqlBase.fromValue(value);
  }

  public getFromExpressions(): readonly SqlExpression[] {
    return this.fromClause.expressions.values;
  }

  public getFirstFromExpression(): SqlExpression {
    return this.fromClause.expressions.first();
  }

  public changeFromExpressions(
    fromExpressions: SeparatedArray<SqlExpression> | SqlExpression[],
  ): this {
    return this.changeFromClause(this.fromClause.changeExpressions(fromExpressions));
  }

  public hasJoin(): boolean {
    return this.fromClause.hasJoin();
  }

  public getJoins(): readonly SqlJoinPart[] {
    return this.fromClause.getJoins();
  }

  public addJoin(join: SqlJoinPart): this {
    return this.changeFromClause(this.fromClause.addJoin(join));
  }

  public removeAllJoins(): this {
    return this.changeFromClause(this.fromClause.removeAllJoins());
  }

  // Reads every column of the FROM clause, like SELECT *
  public getSelectExpressionsArray(): readonly SqlExpression[] {
    return [SqlStar.PLAIN];
  }

  protected _walkInnerBody(
    ret: this,
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): this | undefined {
    const fromClause = this.fromClause._walkHelper(nextStack, fn, postorder);
    if (!fromClause) return;
    if (fromClause !== this.fromClause) {
      return ret.changeFromClause(fromClause as SqlFromClause);
    }

    return ret;
  }
}

SqlBase.register(SqlFromQuery);
