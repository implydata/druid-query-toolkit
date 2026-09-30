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

import type { SeparatorOrString } from '../helpers';
import {
  clampIndex,
  insert,
  NEWLINE,
  normalizeIndex,
  SeparatedArray,
  Separator,
  SPACE,
} from '../helpers';
import type { KeywordName, SpaceName, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type {
  SqlGroupByClause,
  SqlLimitClause,
  SqlOffsetClause,
  SqlOrderByClause,
} from '../sql-clause';
import { SqlFromClause } from '../sql-clause';
import { SqlColumn } from '../sql-column/sql-column';
import type { SqlExpression } from '../sql-expression';
import { SqlFromQuery } from '../sql-from-query/sql-from-query';
import type { SqlPipeOperator } from '../sql-pipe-operator';
import {
  SqlAggregatePipeOperator,
  SqlDropPipeOperator,
  SqlExtendPipeOperator,
  SqlLimitPipeOperator,
  SqlOrderByPipeOperator,
  SqlSelectPipeOperator,
  SqlSetPipeOperator,
  SqlWherePipeOperator,
} from '../sql-pipe-operator';
import { SqlQuery } from '../sql-query/sql-query';
import type { SqlQueryBaseValue } from '../sql-query-base/sql-query-base';
import { SqlQueryBase } from '../sql-query-base/sql-query-base';
import { SqlRecord } from '../sql-record/sql-record';
import { SqlStar } from '../sql-star/sql-star';
import { SqlTableQuery } from '../sql-table-query/sql-table-query';

// The spacing and keywords of the parts that wrap the whole pipeline, see moveWrapperTo
const WRAPPER_SPACE_NAMES: SpaceName[] = [
  'initial',
  'final',
  'postSets',
  'postExplainPlanFor',
  'postInsertClause',
  'postReplaceClause',
  'prePartitionedByClause',
  'preClusteredByClause',
  'preUnion',
  'postUnion',
];
const WRAPPER_KEYWORD_NAMES: KeywordName[] = ['explainPlanFor', 'union'];

function pick<T extends string>(
  record: Readonly<Record<string, string>>,
  names: T[],
): Partial<Record<T, string>> {
  const ret: Partial<Record<T, string>> = {};
  for (const name of names) {
    const v = record[name];
    if (typeof v === 'string') ret[name] = v;
  }
  return ret;
}

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
    return this.moveWrapperTo(this.query);
  }

  /**
   * Puts the parts that wrap the whole pipeline (the prefix, the ingest suffix, the union, the
   * parens and the outer spacing) onto the given query, which replaces this one.
   */
  private moveWrapperTo<T extends SqlQueryBase>(query: T): T {
    const value = query.valueOf();
    value.contextStatements = this.contextStatements;
    value.explain = this.explain;
    value.insertClause = this.insertClause;
    value.replaceClause = this.replaceClause;
    value.partitionedByClause = this.partitionedByClause;
    value.clusteredByClause = this.clusteredByClause;
    value.unionQuery = this.unionQuery;
    value.parens = this.parens;
    value.spacing = { ...query.spacing, ...pick(this.spacing, WRAPPER_SPACE_NAMES) };
    value.keywords = { ...query.keywords, ...pick(this.keywords, WRAPPER_KEYWORD_NAMES) };
    return SqlBase.fromValue(value);
  }

  /* ~~~~~ Unpiping ~~~~~ */

  /**
   * Converts this query into an equivalent query without pipe syntax. Each operator is folded
   * into the query built so far when the standard SQL evaluation order allows it (a WHERE
   * after a WHERE, a GROUP BY after a WHERE, ...), otherwise the query built so far becomes a
   * `SELECT * FROM (...)` sub query. The clauses that carry over keep their casing and
   * spacing, as does the whitespace between the operators. Pipe queries nested inside this
   * one are converted too.
   *
   * `|> SET` and `|> DROP` can only be converted when the columns of their input are known
   * from the query itself (after an AGGREGATE or a SELECT, for example), since Druid SQL has
   * no `SELECT * EXCEPT`. They throw otherwise.
   */
  public unpipe(): SqlQuery {
    const self = this.walkPostorder((ex, stack) =>
      stack.length && ex instanceof SqlPipesQuery ? ex.unpipe() : ex,
    ) as SqlPipesQuery;

    const { pipeOperators } = self;
    let query = rootToSqlQuery(self.query);
    pipeOperators.values.forEach((pipeOperator, i) => {
      const gap =
        i === 0
          ? self.getSpace('prePipes', NEWLINE)
          : String(pipeOperators.separators[i - 1] ?? NEWLINE);
      query = applyPipeOperator(query, pipeOperator, gap || SPACE);
    });

    // SQL can not have an ORDER BY or LIMIT before a UNION ALL
    if (self.unionQuery && hasOrderingOrLimit(query)) query = wrapInSelectStar(query);

    return self.moveWrapperTo(query);
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

/* ~~~~~ Unpiping helpers ~~~~~ */

function hasOrderingOrLimit(query: SqlQuery): boolean {
  return Boolean(query.orderByClause || query.limitClause || query.offsetClause);
}

function hasLimit(query: SqlQuery): boolean {
  return Boolean(query.limitClause || query.offsetClause || query.unionQuery);
}

/**
 * Is this a `SELECT * FROM ... [WHERE ...]` query, which pipe operators can be folded into as
 * if they applied straight to its FROM clause.
 */
function isStarQuery(query: SqlQuery): boolean {
  const { selectExpressions } = query;
  if (!selectExpressions || selectExpressions.length() !== 1) return false;
  const star = selectExpressions.first();
  return (
    star instanceof SqlStar &&
    !star.table &&
    Boolean(query.fromClause) &&
    !query.decorator &&
    !query.groupByClause &&
    !query.havingClause &&
    !hasOrderingOrLimit(query) &&
    !query.unionQuery &&
    !query.hasParens()
  );
}

function wrapInSelectStar(query: SqlQueryBase): SqlQuery {
  const subQuery = query.ensureParens();
  const wrapped = SqlQuery.selectStarFrom(subQuery);
  return subQuery.toString().includes('\n') ? wrapped : wrapped.changeSpace('preFromClause', SPACE);
}

function ensureStarQuery(query: SqlQuery): SqlQuery {
  return isStarQuery(query) ? query : wrapInSelectStar(query);
}

function rootToSqlQuery(query: SqlQueryBase): SqlQuery {
  if (query.unionQuery) return wrapInSelectStar(query);
  if (query instanceof SqlQuery) return query;

  if (query instanceof SqlFromQuery || query instanceof SqlTableQuery) {
    const fromClause =
      query instanceof SqlFromQuery
        ? new SqlFromClause({
            expressions: SeparatedArray.fromSingleValue(query.table),
            keywords: pick(query.keywords, ['from']),
            spacing: pick(query.spacing, ['postFrom']),
          })
        : SqlFromClause.create([query.table]);

    return new SqlQuery({
      selectExpressions: SeparatedArray.fromSingleValue(SqlStar.PLAIN),
      fromClause,
      orderByClause: query.orderByClause,
      limitClause: query.limitClause,
      offsetClause: query.offsetClause,
      spacing: {
        preFromClause: SPACE,
        ...pick(query.spacing, ['preOrderByClause', 'preLimitClause', 'preOffsetClause']),
      },
    });
  }

  return wrapInSelectStar(query);
}

function paddedSeparators<T>(xs: SeparatedArray<T>): (SeparatorOrString | undefined)[] {
  return Array.from({ length: xs.length() - 1 }, (_, i) => xs.separators[i]);
}

function concatSeparated<T>(
  a: SeparatedArray<T> | undefined,
  separator: SeparatorOrString,
  b: SeparatedArray<T> | undefined,
): SeparatedArray<T> | undefined {
  if (!a) return b;
  if (!b) return a;
  return new SeparatedArray(
    a.values.concat(b.values),
    paddedSeparators(a).concat([separator], paddedSeparators(b)),
  );
}

/**
 * Replaces the select list. A list built without separators gets the default layout, while a
 * list that carries its own separators (taken from the pipe operator) starts on the SELECT line
 * and follows them. Either way the FROM goes on its own line when the list spans several.
 */
function changeSelect(
  query: SqlQuery,
  selectExpressions: SeparatedArray<SqlExpression>,
  keywords: Partial<Record<KeywordName, string>>,
  spacing: Partial<Record<SpaceName, string>>,
): SqlQuery {
  const value = query.valueOf();
  value.selectExpressions = selectExpressions;

  const newKeywords: Partial<Record<KeywordName, string>> = { ...query.keywords };
  delete newKeywords.select;
  value.keywords = { ...newKeywords, ...keywords };

  const newSpacing: Partial<Record<SpaceName, string>> = { ...query.spacing };
  delete newSpacing.postSelect;
  Object.assign(newSpacing, spacing);
  const defaultLayout = paddedSeparators(selectExpressions).some(
    separator => typeof separator === 'undefined',
  );
  if (!defaultLayout && typeof spacing.postSelect === 'undefined') newSpacing.postSelect = SPACE;
  if (defaultLayout || selectExpressions.toString().includes('\n')) {
    delete newSpacing.preFromClause;
  }
  value.spacing = newSpacing;

  return new SqlQuery(value);
}

function getGroupKeys(groupByClause: SqlGroupByClause | undefined): SqlExpression[] {
  const keys: SqlExpression[] = [];
  for (const ex of groupByClause?.expressions?.values || []) {
    const parts = ex instanceof SqlRecord ? ex.expressions?.values || [] : [ex];
    for (const part of parts.map(part => part.changeParens([]))) {
      if (!keys.some(key => key.equals(part))) keys.push(part);
    }
  }
  return keys;
}

/**
 * The names of the output columns of a query, when they can be told from the query alone.
 */
function getOutputNames(query: SqlQuery): string[] | undefined {
  const names: string[] = [];
  for (const ex of query.getSelectExpressionsArray()) {
    if (ex instanceof SqlStar) {
      if (ex.table) return;
      const starNames = getStarNames(query);
      if (!starNames) return;
      names.push(...starNames);
    } else {
      const name = ex.getOutputName();
      if (!name) return;
      names.push(name);
    }
  }
  return names;
}

/**
 * The names of the columns that a `*` in this query stands for, when they can be told.
 */
function getStarNames(query: SqlQuery): string[] | undefined {
  const { fromClause } = query;
  if (!fromClause || fromClause.joinParts || fromClause.expressions.length() !== 1) return;
  const from = fromClause.expressions.first().getUnderlyingExpression();
  if (!(from instanceof SqlQuery)) return;
  return getOutputNames(from);
}

function getInputNames(query: SqlQuery, operatorName: string): string[] {
  const names = getStarNames(query);
  if (!names) {
    throw new Error(
      `can not unpipe |> ${operatorName} because the columns of its input are not known`,
    );
  }
  return names;
}

function applyPipeOperator(query: SqlQuery, pipeOperator: SqlPipeOperator, gap: string): SqlQuery {
  if (pipeOperator instanceof SqlWherePipeOperator) {
    const starQuery = ensureStarQuery(query);
    if (starQuery.whereClause) return starQuery.addWhere(pipeOperator.getExpression());
    return starQuery.changeWhereClause(pipeOperator.whereClause).changeSpace('preWhereClause', gap);
  }

  if (pipeOperator instanceof SqlSelectPipeOperator) {
    return changeSelect(
      ensureStarQuery(query),
      pipeOperator.selectExpressions,
      pick(pipeOperator.keywords, ['select']),
      pick(pipeOperator.spacing, ['postSelect']),
    );
  }

  if (pipeOperator instanceof SqlExtendPipeOperator) {
    const starQuery = ensureStarQuery(query);
    return changeSelect(
      starQuery,
      concatSeparated(
        starQuery.selectExpressions,
        new Separator({ separator: ',', right: pipeOperator.getSpace('postExtend') }),
        pipeOperator.expressions,
      )!,
      pick(starQuery.keywords, ['select']),
      pick(starQuery.spacing, ['postSelect']),
    );
  }

  if (pipeOperator instanceof SqlAggregatePipeOperator) {
    const starQuery = ensureStarQuery(query);
    const { groupByClause } = pipeOperator;

    // The output has the grouping keys first and then the aggregates
    const keys = getGroupKeys(groupByClause);
    const groupByExpressions = groupByClause?.expressions;
    const keyList =
      groupByExpressions && !groupByExpressions.values.some(ex => ex instanceof SqlRecord)
        ? groupByExpressions
        : SeparatedArray.fromPossiblyEmptyArray(keys, Separator.COMMA);
    const selectExpressions = concatSeparated(
      keyList,
      new Separator({ separator: ',', right: pipeOperator.getSpace('postAggregate') }),
      pipeOperator.expressions,
    );
    if (!selectExpressions) {
      throw new Error('can not unpipe an |> AGGREGATE that has no aggregates or grouping keys');
    }

    const aggregateQuery = changeSelect(
      starQuery,
      selectExpressions,
      pick(starQuery.keywords, ['select']),
      pick(starQuery.spacing, ['postSelect']),
    );
    if (!groupByClause) return aggregateQuery;
    return aggregateQuery.changeGroupByClause(groupByClause).changeSpace('preGroupByClause', gap);
  }

  if (pipeOperator instanceof SqlOrderByPipeOperator) {
    // Past an explicit select list the ORDER BY can only safely name output columns
    let canMerge = !hasLimit(query);
    if (canMerge && !isStarQuery(query)) {
      const outputNames = getOutputNames(query) || [];
      canMerge = pipeOperator.orderByClause.expressions.values.every(({ expression }) => {
        return (
          expression instanceof SqlColumn &&
          !expression.table &&
          outputNames.includes(expression.getName())
        );
      });
    }

    return (canMerge ? query : wrapInSelectStar(query))
      .changeOrderByClause(pipeOperator.orderByClause)
      .changeSpace('preOrderByClause', gap);
  }

  if (pipeOperator instanceof SqlLimitPipeOperator) {
    let limitQuery = (hasLimit(query) ? wrapInSelectStar(query) : query)
      .changeLimitClause(pipeOperator.limitClause)
      .changeSpace('preLimitClause', gap);
    if (pipeOperator.offsetClause) {
      limitQuery = limitQuery
        .changeOffsetClause(pipeOperator.offsetClause)
        .changeSpace('preOffsetClause', pipeOperator.getSpace('preOffsetClause'));
    }
    return limitQuery;
  }

  if (pipeOperator instanceof SqlSetPipeOperator) {
    const starQuery = ensureStarQuery(query);
    const names = getInputNames(starQuery, 'SET');
    const assignments = pipeOperator.assignments.values;
    for (const assignment of assignments) {
      if (!names.includes(assignment.getColumnName())) {
        throw new Error(`can not SET unknown column '${assignment.getColumnName()}'`);
      }
    }

    return changeSelect(
      starQuery,
      SeparatedArray.fromArray(
        names.map(name => {
          const assignment = assignments.find(a => a.getColumnName() === name);
          return assignment
            ? assignment.expression.as(assignment.column.refName)
            : SqlColumn.optionalQuotes(name);
        }),
      ),
      pick(starQuery.keywords, ['select']),
      {},
    );
  }

  if (pipeOperator instanceof SqlDropPipeOperator) {
    const starQuery = ensureStarQuery(query);
    const names = getInputNames(starQuery, 'DROP');
    const dropNames = pipeOperator.columns.values.map(column => column.getName());
    for (const dropName of dropNames) {
      if (!names.includes(dropName)) throw new Error(`can not DROP unknown column '${dropName}'`);
    }

    const keptNames = names.filter(name => !dropNames.includes(name));
    if (!keptNames.length) throw new Error('can not DROP every column');

    return changeSelect(
      starQuery,
      SeparatedArray.fromArray(keptNames.map(name => SqlColumn.optionalQuotes(name))),
      pick(starQuery.keywords, ['select']),
      {},
    );
  }

  throw new Error(`can not unpipe the pipe operator '${pipeOperator.type}'`);
}
