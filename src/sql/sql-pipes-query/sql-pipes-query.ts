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

import { clampIndex, insert, NEWLINE, normalizeIndex, SeparatedArray } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlLimitClause, SqlOffsetClause, SqlOrderByClause } from '../sql-clause';
import type { SqlPipeOperator } from '../sql-pipe-operator';
import { SqlLimitPipeOperator, SqlOrderByPipeOperator } from '../sql-pipe-operator';
import type { SqlQueryBaseValue } from '../sql-query-base/sql-query-base';
import { SqlQueryBase } from '../sql-query-base/sql-query-base';

export interface SqlPipesQueryValue extends SqlQueryBaseValue {
  query: SqlQueryBase;
  pipeOperators: SeparatedArray<SqlPipeOperator>;
}

/**
 * A pipe syntax query: a root query followed by one or more `|> ...` pipe operators.
 *
 * The shared query prefix (`SET`, `EXPLAIN PLAN FOR`, `INSERT` / `REPLACE`) and the
 * `PARTITIONED BY`, `CLUSTERED BY` and `UNION ALL` suffixes wrap the whole pipeline.
 * Ordering and limiting are expressed as `|> ORDER BY` and `|> LIMIT` operators, so the
 * `orderByClause`, `limitClause` and `offsetClause` fields are always `undefined` here.
 * The inherited ORDER BY / LIMIT / OFFSET methods work on the trailing `|> ORDER BY` and
 * `|> LIMIT` operators instead.
 */
export class SqlPipesQuery extends SqlQueryBase {
  static type: SqlTypeDesignator = 'pipesQuery';

  static create(
    query: SqlQueryBase,
    pipeOperators: SeparatedArray<SqlPipeOperator> | SqlPipeOperator[],
  ): SqlPipesQuery {
    if (query instanceof SqlPipesQuery) {
      return SeparatedArray.fromArray(pipeOperators).values.reduce<SqlPipesQuery>(
        (q, pipeOperator) => q.appendPipeOperator(pipeOperator),
        query,
      );
    }

    return new SqlPipesQuery({
      query,
      pipeOperators: SeparatedArray.fromArray(pipeOperators),
    });
  }

  public readonly query: SqlQueryBase;
  public readonly pipeOperators: SeparatedArray<SqlPipeOperator>;

  constructor(options: SqlPipesQueryValue) {
    super(options, SqlPipesQuery.type);
    if (options.orderByClause || options.limitClause || options.offsetClause) {
      throw new Error(
        'a pipes query can not have ORDER BY, LIMIT or OFFSET clauses, use pipe operators instead',
      );
    }

    this.query = options.query;
    this.pipeOperators = options.pipeOperators;
  }

  public valueOf(): SqlPipesQueryValue {
    const value = super.valueOf() as SqlPipesQueryValue;
    value.query = this.query;
    value.pipeOperators = this.pipeOperators;
    return value;
  }

  protected _toRawBodyString(): string {
    return [
      this.query.toString(),
      this.getSpace('prePipes', NEWLINE),
      this.pipeOperators.toString(NEWLINE),
    ].join('');
  }

  public changeQuery(query: SqlQueryBase): this {
    const value = this.valueOf();
    value.query = query;
    return SqlBase.fromValue(value);
  }

  public getPipeOperators(): readonly SqlPipeOperator[] {
    return this.pipeOperators.values;
  }

  public getLastPipeOperator(): SqlPipeOperator {
    return this.pipeOperators.values[this.pipeOperators.length() - 1]!;
  }

  public changePipeOperators(
    pipeOperators: SeparatedArray<SqlPipeOperator> | SqlPipeOperator[],
  ): this {
    const value = this.valueOf();
    value.pipeOperators = SeparatedArray.fromArray(pipeOperators);
    return SqlBase.fromValue(value);
  }

  /**
   * Inserts a pipe operator at the given index. The new operator gets the default spacing before
   * it, so any comment that was written above the operator now after it stays with that one.
   */
  public insertPipeOperator(index: number, pipeOperator: SqlPipeOperator): this {
    const { values, separators } = this.pipeOperators;
    const n = values.length;
    index = clampIndex(normalizeIndex(index, n), 0, n);
    return this.changePipeOperators(
      new SeparatedArray(
        insert(values, index, pipeOperator),
        insert(separators, Math.max(index - 1, 0), undefined),
      ),
    );
  }

  public appendPipeOperator(pipeOperator: SqlPipeOperator): this {
    return this.insertPipeOperator(Infinity, pipeOperator);
  }

  /**
   * Removes the pipe operator at the given index. Removing the only operator leaves just the
   * root query, which then takes over the prefix and suffix clauses of this query.
   */
  public removePipeOperator(index: number): SqlQueryBase {
    const pipeOperators = this.pipeOperators.remove(index);
    if (pipeOperators) return this.changePipeOperators(pipeOperators);

    let query = this.query
      .changeContextStatements(this.contextStatements)
      .changeExplain(Boolean(this.explain))
      .changeInsertClause(this.insertClause)
      .changeReplaceClause(this.replaceClause)
      .changePartitionedByClause(this.partitionedByClause)
      .changeClusteredByClause(this.clusteredByClause)
      .changeUnionQuery(this.unionQuery)
      .changeParens(this.getParens());
    if ('initial' in this.spacing) query = query.changeSpace('initial', this.spacing['initial']);
    if ('final' in this.spacing) query = query.changeSpace('final', this.spacing['final']);
    return query;
  }

  /* ~~~~~ Trailing ORDER BY / LIMIT ~~~~~ */

  private getTrailingLimitIndex(): number {
    const lastIndex = this.pipeOperators.length() - 1;
    return this.pipeOperators.values[lastIndex] instanceof SqlLimitPipeOperator ? lastIndex : -1;
  }

  private getTrailingLimitPipeOperator(): SqlLimitPipeOperator | undefined {
    const index = this.getTrailingLimitIndex();
    if (index < 0) return;
    return this.pipeOperators.values[index] as SqlLimitPipeOperator;
  }

  private getTrailingOrderByIndex(): number {
    const limitIndex = this.getTrailingLimitIndex();
    const index = (limitIndex < 0 ? this.pipeOperators.length() : limitIndex) - 1;
    return this.pipeOperators.values[index] instanceof SqlOrderByPipeOperator ? index : -1;
  }

  /**
   * Returns the query that is left after removing a trailing pipe operator. The return type
   * pretends to be `this` to satisfy the inherited signatures, but it is the root query when
   * the removed operator was the only one.
   */
  private removeTrailingPipeOperator(index: number): this {
    return this.removePipeOperator(index) as this;
  }

  public getOrderByClause(): SqlOrderByClause | undefined {
    const index = this.getTrailingOrderByIndex();
    if (index < 0) return;
    return (this.pipeOperators.values[index] as SqlOrderByPipeOperator).orderByClause;
  }

  /**
   * Changes the trailing `|> ORDER BY` operator (the last operator, or the one just before a
   * trailing `|> LIMIT`), adding one where it belongs when there is none.
   */
  public changeOrderByClause(orderByClause: SqlOrderByClause | undefined): this {
    const index = this.getTrailingOrderByIndex();
    if (index < 0) {
      if (!orderByClause) return this;
      const limitIndex = this.getTrailingLimitIndex();
      return this.insertPipeOperator(
        limitIndex < 0 ? Infinity : limitIndex,
        SqlOrderByPipeOperator.create(orderByClause),
      );
    }

    if (!orderByClause) return this.removeTrailingPipeOperator(index);

    const orderByPipeOperator = this.pipeOperators.values[index] as SqlOrderByPipeOperator;
    if (orderByPipeOperator.orderByClause === orderByClause) return this;
    return this.changePipeOperators(
      this.pipeOperators.change(index, orderByPipeOperator.changeOrderByClause(orderByClause)),
    );
  }

  public getLimitClause(): SqlLimitClause | undefined {
    return this.getTrailingLimitPipeOperator()?.limitClause;
  }

  /**
   * Changes the trailing `|> LIMIT` operator, adding one at the end when there is none.
   */
  public changeLimitClause(limitClause: SqlLimitClause | undefined): this {
    const index = this.getTrailingLimitIndex();
    if (index < 0) {
      if (!limitClause) return this;
      return this.appendPipeOperator(SqlLimitPipeOperator.create(limitClause));
    }

    const limitPipeOperator = this.pipeOperators.values[index] as SqlLimitPipeOperator;
    if (!limitClause) {
      if (limitPipeOperator.offsetClause) {
        throw new Error('can not remove the LIMIT from a |> LIMIT operator that has an OFFSET');
      }
      return this.removeTrailingPipeOperator(index);
    }

    if (limitPipeOperator.limitClause === limitClause) return this;
    return this.changePipeOperators(
      this.pipeOperators.change(index, limitPipeOperator.changeLimitClause(limitClause)),
    );
  }

  public getOffsetClause(): SqlOffsetClause | undefined {
    return this.getTrailingLimitPipeOperator()?.offsetClause;
  }

  /**
   * Changes the OFFSET of the trailing `|> LIMIT` operator. There must be one, because a
   * `|> LIMIT` can not have an OFFSET without a count.
   */
  public changeOffsetClause(offsetClause: SqlOffsetClause | undefined): this {
    const index = this.getTrailingLimitIndex();
    if (index < 0) {
      if (!offsetClause) return this;
      throw new Error('can not set an OFFSET on a pipes query that does not end with |> LIMIT');
    }

    const limitPipeOperator = this.pipeOperators.values[index] as SqlLimitPipeOperator;
    if (limitPipeOperator.offsetClause === offsetClause) return this;
    return this.changePipeOperators(
      this.pipeOperators.change(index, limitPipeOperator.changeOffsetClause(offsetClause)),
    );
  }

  /* ~~~~~ Walking ~~~~~ */

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

    const pipeOperators = SqlBase.walkSeparatedArray(this.pipeOperators, nextStack, fn, postorder);
    if (!pipeOperators) return;
    if (pipeOperators !== this.pipeOperators) {
      ret = ret.changePipeOperators(pipeOperators);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.pipeOperators = this.pipeOperators.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlPipesQuery);
