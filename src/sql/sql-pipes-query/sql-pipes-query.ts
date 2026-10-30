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

import type { RefName, SeparatorOrString } from '../helpers';
import {
  clampIndex,
  insert,
  NEWLINE,
  normalizeIndex,
  SeparatedArray,
  Separator,
  SPACE,
} from '../helpers';
import { SqlAlias } from '../sql-alias/sql-alias';
import type { KeywordName, SpaceName, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type {
  SqlGroupByClause,
  SqlJoinPart,
  SqlLimitClause,
  SqlOffsetClause,
  SqlWithClause,
  SqlWithPart,
} from '../sql-clause';
import { SqlFromClause, SqlOrderByClause, SqlOrderByExpression } from '../sql-clause';
import { SqlColumn } from '../sql-column/sql-column';
import type { SqlExpression } from '../sql-expression';
import { SqlFromQuery } from '../sql-from-query/sql-from-query';
import type { SqlPipeOperator } from '../sql-pipe-operator';
import {
  SqlAggregatePipeOperator,
  SqlAsPipeOperator,
  SqlDistinctPipeOperator,
  SqlDropPipeOperator,
  SqlExtendPipeOperator,
  SqlJoinPipeOperator,
  SqlLimitPipeOperator,
  SqlOrderByPipeOperator,
  SqlRenamePipeOperator,
  SqlSelectPipeOperator,
  SqlSetPipeOperator,
  SqlUnionPipeOperator,
  SqlWherePipeOperator,
} from '../sql-pipe-operator';
import type { SqlQueryDecorator } from '../sql-query/sql-query';
import { SqlQuery } from '../sql-query/sql-query';
import type { SqlQueryBaseValue } from '../sql-query-base/sql-query-base';
import { SqlQueryBase } from '../sql-query-base/sql-query-base';
import { SqlRecord } from '../sql-record/sql-record';
import { SqlStar } from '../sql-star/sql-star';
import { SqlTable } from '../sql-table/sql-table';
import { SqlTableQuery } from '../sql-table-query/sql-table-query';
import { SqlWithQuery } from '../sql-with-query/sql-with-query';

// The spacing and keywords of the parts that wrap the whole pipeline, see moveWrapperTo
const WRAPPER_SPACE_NAMES: SpaceName[] = [
  'initial',
  'final',
  'postSets',
  'postExplainPlanFor',
  'postInsertClause',
  'postReplaceClause',
  'postWithClause',
  'prePartitionedByClause',
  'preClusteredByClause',
];
const WRAPPER_KEYWORD_NAMES: KeywordName[] = ['explainPlanFor'];

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
  withClause?: SqlWithClause;
  query: SqlQueryBase;
  pipeOperators: SeparatedArray<SqlPipeOperator>;
}

/**
 * A pipe syntax query: a root query followed by one or more `|> ...` pipe operators. The root
 * query is everything before the first operator, so in `A UNION ALL B |> ...` it is the whole
 * union.
 *
 * The shared query prefix (`SET`, `EXPLAIN PLAN FOR`, `INSERT` / `REPLACE`), a `WITH` in front
 * of the root query and the `PARTITIONED BY` and `CLUSTERED BY` suffixes wrap the whole
 * pipeline, so the operators can use the tables of the `WITH` too. Ordering and limiting are
 * expressed as `|> ORDER BY` and `|> LIMIT` operators, so the `orderByClause`, `limitClause` and
 * `offsetClause` fields are always `undefined` here. The inherited ORDER BY / LIMIT / OFFSET
 * methods work on the trailing `|> ORDER BY` and `|> LIMIT` operators instead. Nothing can
 * follow the operators, so there is no `unionQuery` either (use a `|> UNION ALL` operator).
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

    // A WITH in front of the root query takes in the operators too, as it does when parsed
    if (
      query instanceof SqlQuery &&
      query.withClause &&
      !query.hasParens() &&
      !query.contextStatements &&
      !query.explain &&
      !query.insertClause &&
      !query.replaceClause
    ) {
      return new SqlPipesQuery({
        withClause: query.withClause,
        query: query.changeWithClause(undefined),
        pipeOperators: SeparatedArray.fromArray(pipeOperators),
        spacing: pick(query.spacing, ['postWithClause']),
      });
    }

    return new SqlPipesQuery({
      query,
      pipeOperators: SeparatedArray.fromArray(pipeOperators),
    });
  }

  public readonly withClause?: SqlWithClause;
  public readonly query: SqlQueryBase;
  public readonly pipeOperators: SeparatedArray<SqlPipeOperator>;

  constructor(options: SqlPipesQueryValue) {
    super(options, SqlPipesQuery.type);
    if (options.orderByClause || options.limitClause || options.offsetClause) {
      throw new Error(
        'a pipes query can not have ORDER BY, LIMIT or OFFSET clauses, use pipe operators instead',
      );
    }
    if (options.unionQuery) {
      throw new Error('a pipes query can not have a UNION ALL after it, use |> UNION ALL instead');
    }

    this.withClause = options.withClause;
    this.query = options.query;
    this.pipeOperators = options.pipeOperators;
  }

  public valueOf(): SqlPipesQueryValue {
    const value = super.valueOf() as SqlPipesQueryValue;
    value.withClause = this.withClause;
    value.query = this.query;
    value.pipeOperators = this.pipeOperators;
    return value;
  }

  protected _toRawBodyString(): string {
    const { withClause } = this;
    const rawParts: string[] = [];
    if (withClause) {
      rawParts.push(withClause.toString(), this.getSpace('postWithClause', NEWLINE));
    }

    rawParts.push(
      this.query.toString(),
      this.getSpace('prePipes', NEWLINE),
      this.pipeOperators.toString(NEWLINE),
    );
    return rawParts.join('');
  }

  public changeWithClause(withClause: SqlWithClause | undefined): this {
    if (this.withClause === withClause) return this;
    const value = this.valueOf();
    if (withClause) {
      value.withClause = withClause;
    } else {
      delete value.withClause;
      value.spacing = this.getSpacingWithout('postWithClause');
    }
    return SqlBase.fromValue(value);
  }

  public getWithParts(): readonly SqlWithPart[] {
    return this.withClause?.withParts.values || [];
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

    const { withClause, query } = this;
    if (!withClause) return this.moveWrapperTo(query);
    return this.moveWrapperTo(
      query instanceof SqlQuery && !query.hasParens()
        ? addWithClause(query, withClause)
        : new SqlWithQuery({ withClause, query }),
    );
  }

  /**
   * Puts the parts that wrap the whole pipeline (the prefix, the ingest suffix, the parens and
   * the outer spacing) onto the given query, which replaces this one. The WITH has to be put on
   * it first.
   */
  private moveWrapperTo<T extends SqlQueryBase>(query: T): T {
    const value = query.valueOf();
    value.contextStatements = this.contextStatements;
    value.explain = this.explain;
    value.insertClause = this.insertClause;
    value.replaceClause = this.replaceClause;
    value.partitionedByClause = this.partitionedByClause;
    value.clusteredByClause = this.clusteredByClause;
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
   * spacing, as does the whitespace between the operators. Pipe queries and `FROM` queries
   * nested inside this one are converted too.
   *
   * `|> SET`, `|> DROP` and `|> RENAME` can only be converted when the columns of their input
   * are known from the query itself (after an AGGREGATE or a SELECT, for example), since Druid
   * SQL has no `SELECT * EXCEPT`. They throw otherwise.
   */
  public unpipe(): SqlQuery {
    const self = this.walkPostorder((ex, stack) => {
      if (!stack.length) return ex;
      if (ex instanceof SqlPipesQuery) return ex.unpipe();
      if (ex instanceof SqlFromQuery) return fromQueryToSqlQuery(ex);
      return ex;
    }) as SqlPipesQuery;

    const { pipeOperators } = self;
    let query = rootToSqlQuery(self.query);
    pipeOperators.values.forEach((pipeOperator, i) => {
      const gap =
        i === 0
          ? self.getSpace('prePipes', NEWLINE)
          : String(pipeOperators.separators[i - 1] ?? NEWLINE);
      query = applyPipeOperator(query, pipeOperator, gap || SPACE);
    });

    if (self.withClause) query = addWithClause(query, self.withClause);
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
    if (this.withClause) {
      const withClause = this.withClause._walkHelper(nextStack, fn, postorder);
      if (!withClause) return;
      if (withClause !== this.withClause) {
        ret = ret.changeWithClause(withClause as SqlWithClause);
      }
    }

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

/**
 * Puts a WITH clause in front of the query, ahead of any WITH it already has
 */
function addWithClause(query: SqlQuery, withClause: SqlWithClause): SqlQuery {
  if (!query.withClause) return query.changeWithClause(withClause);
  return query.changeWithClause(
    withClause.changeWithParts(
      concatSeparated(withClause.withParts, Separator.COMMA, query.withClause.withParts)!,
    ),
  );
}

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

/**
 * Makes the query a `SELECT * FROM (...)` sub query, with the given name if there is one.
 */
function wrapInSelectStar(query: SqlQueryBase, alias?: RefName): SqlQuery {
  const subQuery = query.ensureParens();
  const wrapped = SqlQuery.selectStarFrom(alias ? SqlAlias.create(subQuery, alias) : subQuery);
  return subQuery.toString().includes('\n') ? wrapped : wrapped.changeSpace('preFromClause', SPACE);
}

function ensureStarQuery(query: SqlQuery): SqlQuery {
  return isStarQuery(query) ? query : wrapInSelectStar(query);
}

/**
 * The name that later operators can still use for the input of a `SELECT * FROM t [WHERE ...]`
 * query (`t`, or its alias), since WHERE, ORDER BY and LIMIT keep it. Wrapping such a query
 * in a sub query of that name keeps references like `t.x` working.
 */
function getRangeName(query: SqlQuery): RefName | undefined {
  const { selectExpressions, fromClause } = query;
  if (!selectExpressions || selectExpressions.length() !== 1) return;
  const star = selectExpressions.first();
  if (!(star instanceof SqlStar) || star.table) return;
  if (query.decorator || query.groupByClause || query.havingClause || query.unionQuery) return;
  if (!fromClause || fromClause.joinParts || fromClause.expressions.length() !== 1) return;

  const from = fromClause.expressions.first();
  if (from instanceof SqlAlias) return from.alias;
  if (from instanceof SqlTable) return from.refName;
  return;
}

/**
 * The `SELECT * FROM ...` that a FROM query stands for, with everything around it kept
 */
function fromQueryToSqlQuery(query: SqlFromQuery): SqlQuery {
  const value = query.valueOf();
  return new SqlQuery({
    ...value,
    selectExpressions: SeparatedArray.fromSingleValue(SqlStar.PLAIN),
    spacing: { ...value.spacing, preFromClause: SPACE },
  });
}

function rootToSqlQuery(query: SqlQueryBase): SqlQuery {
  // Parens around the whole root of the pipeline do not change anything
  query = query.changeParens([]);

  if (query.unionQuery) return wrapInSelectStar(query);
  if (query instanceof SqlQuery) return query;
  if (query instanceof SqlFromQuery) return fromQueryToSqlQuery(query);

  if (query instanceof SqlTableQuery) {
    return new SqlQuery({
      selectExpressions: SeparatedArray.fromSingleValue(SqlStar.PLAIN),
      fromClause: SqlFromClause.create([query.table]),
      orderByClause: query.orderByClause,
      limitClause: query.limitClause,
      offsetClause: query.offsetClause,
      spacing: {
        preFromClause: SPACE,
        ...pick(query.spacing, ['preOrderByClause', 'preLimitClause', 'preOffsetClause']),
      },
    });
  }

  // WITH ... FROM t becomes WITH ... SELECT * FROM t
  if (query instanceof SqlWithQuery) {
    const flatQuery = query.changeQuery(rootToSqlQuery(query.query)).flattenWith();
    if (flatQuery instanceof SqlQuery) return flatQuery;
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

/**
 * The items of a pipe AGGREGATE can have an order suffix (`COUNT(*) AS c DESC`), which sorts
 * the output and is not part of the item itself.
 */
function withoutOrderSuffix(ex: SqlExpression): SqlExpression {
  return ex instanceof SqlOrderByExpression ? ex.expression : ex;
}

function getGroupKeys(groupByClause: SqlGroupByClause | undefined): SqlExpression[] {
  const keys: SqlExpression[] = [];
  for (const item of groupByClause?.expressions?.values || []) {
    const ex = withoutOrderSuffix(item);
    const parts = ex instanceof SqlRecord ? ex.expressions?.values || [] : [ex];
    for (const part of parts.map(part => part.changeParens([]))) {
      if (!keys.some(key => key.equals(part))) keys.push(part);
    }
  }
  return keys;
}

/**
 * Standard SQL has no aliases or order suffixes in GROUP BY, the aliased keys are in the select
 * list and the order suffixes in an ORDER BY instead.
 */
function toStandardGroupBy(groupByClause: SqlGroupByClause): SqlGroupByClause {
  const { expressions } = groupByClause;
  if (
    !expressions?.values.some(ex => ex instanceof SqlAlias || ex instanceof SqlOrderByExpression)
  ) {
    return groupByClause;
  }

  return groupByClause.changeExpressions(
    expressions.map(item => {
      const ex = withoutOrderSuffix(item);
      return ex instanceof SqlAlias ? ex.expression : ex;
    }),
  );
}

/**
 * The ORDER BY that the order suffixes of an AGGREGATE stand for: the grouping keys first and
 * then the aggregates, as the output columns go. An aliased item is sorted by its output column.
 */
function getAggregateOrderBy(
  pipeOperator: SqlAggregatePipeOperator,
): SqlOrderByExpression[] | undefined {
  const orderByExpressions = pipeOperator
    .getGroupByExpressions()
    .concat(pipeOperator.expressions?.values || [])
    .filter((ex): ex is SqlOrderByExpression => ex instanceof SqlOrderByExpression)
    .map(orderByExpression => {
      const ex = orderByExpression.expression;
      return orderByExpression.changeExpression(
        ex instanceof SqlAlias ? SqlColumn.optionalQuotes(ex.alias.name) : ex,
      );
    });

  return orderByExpressions.length ? orderByExpressions : undefined;
}

function changeDecorator(
  query: SqlQuery,
  decorator: SqlQueryDecorator | undefined,
  keyword: string | undefined,
): SqlQuery {
  const value = query.changeDecorator(decorator).valueOf();
  const keywords: Partial<Record<KeywordName, string>> = { ...value.keywords };
  delete keywords.decorator;
  if (decorator && keyword) keywords.decorator = keyword;
  value.keywords = keywords;
  return new SqlQuery(value);
}

/**
 * Puts a query that is to be joined with a UNION ALL into the form that can go there: without
 * parentheses, which would take in the rest of the union, or as a sub query when it has
 * something that would apply to the whole union.
 */
function toUnionOperand(query: SqlQueryBase): SqlQueryBase {
  if (query instanceof SqlQuery && !query.withClause && !hasLimit(query) && !query.orderByClause) {
    return query.changeParens([]);
  }

  return wrapInSelectStar(query);
}

/**
 * The names of the output columns of a query, when they can be told from the query alone.
 */
function getOutputNames(query: SqlQuery): string[] | undefined {
  const names: string[] = [];
  const selectExpressions = query.getSelectExpressionsArray();
  const outputColumns = query.getOutputColumns();
  for (let i = 0; i < selectExpressions.length; i++) {
    const ex = selectExpressions[i]!;
    if (ex instanceof SqlStar) {
      if (ex.table) return;
      const starNames = getStarNames(query);
      if (!starNames) return;
      names.push(...starNames);
    } else {
      if (!query.isRealOutputColumnAtSelectIndex(i)) return;
      names.push(outputColumns[i]!);
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
    return changeDecorator(
      changeSelect(
        ensureStarQuery(query),
        pipeOperator.selectExpressions,
        pick(pipeOperator.keywords, ['select']),
        pick(pipeOperator.spacing, ['postSelect', 'postDecorator']),
      ),
      pipeOperator.decorator,
      pipeOperator.keywords['decorator'],
    );
  }

  if (pipeOperator instanceof SqlDistinctPipeOperator) {
    // DISTINCT goes before the ORDER BY and LIMIT of a SELECT, and can not apply to a whole union
    return changeDecorator(
      hasOrderingOrLimit(query) || query.unionQuery ? wrapInSelectStar(query) : query,
      'DISTINCT',
      pipeOperator.keywords['distinct'],
    );
  }

  if (pipeOperator instanceof SqlAsPipeOperator) {
    // The single table (or sub query) of a plain SELECT * can take the name itself
    const { fromClause } = query;
    if (
      isStarQuery(query) &&
      !query.whereClause &&
      fromClause &&
      !fromClause.joinParts &&
      fromClause.expressions.length() === 1
    ) {
      return query.changeFromExpressions(
        fromClause.expressions.map(ex => SqlAlias.create(ex, pipeOperator.alias)),
      );
    }

    return wrapInSelectStar(query, pipeOperator.alias);
  }

  if (pipeOperator instanceof SqlJoinPipeOperator) {
    // A WHERE before the JOIN has to stay before it, so such a query becomes a sub query
    const joinQuery =
      isStarQuery(query) && !query.whereClause
        ? query
        : wrapInSelectStar(query, getRangeName(query));
    return addJoin(joinQuery, pipeOperator.joinPart, gap);
  }

  if (pipeOperator instanceof SqlUnionPipeOperator) {
    const operands = pipeOperator.queries.values.map(toUnionOperand);
    const unionQuery = (hasLimit(query) || query.orderByClause ? wrapInSelectStar(query) : query)
      .changeUnionQuery(
        operands.reduceRight((rest, operand) =>
          operand.changeUnionQuery(rest).changeSpace('preUnion', gap),
        ),
      )
      .changeSpace('preUnion', gap);

    // A UNION without the ALL removes duplicates, which is a DISTINCT over a UNION ALL
    return pipeOperator.isAll()
      ? unionQuery
      : changeDecorator(wrapInSelectStar(unionQuery), 'DISTINCT', undefined);
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
      groupByExpressions &&
      !groupByExpressions.values.some(ex => withoutOrderSuffix(ex) instanceof SqlRecord)
        ? groupByExpressions.map(withoutOrderSuffix)
        : SeparatedArray.fromPossiblyEmptyArray(keys, Separator.COMMA);
    const selectExpressions = concatSeparated(
      keyList,
      new Separator({ separator: ',', right: pipeOperator.getSpace('postAggregate') }),
      pipeOperator.expressions?.map(withoutOrderSuffix),
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
    const groupedQuery = groupByClause
      ? aggregateQuery
          .changeGroupByClause(toStandardGroupBy(groupByClause))
          .changeSpace('preGroupByClause', gap)
      : aggregateQuery;

    const orderByExpressions = getAggregateOrderBy(pipeOperator);
    if (!orderByExpressions) return groupedQuery;
    return groupedQuery.changeOrderByClause(SqlOrderByClause.create(orderByExpressions));
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

  if (pipeOperator instanceof SqlRenamePipeOperator) {
    const starQuery = ensureStarQuery(query);
    const names = getInputNames(starQuery, 'RENAME');
    const renames = pipeOperator.renames.values;
    for (const rename of renames) {
      const name = rename.expression.getOutputName();
      if (!name || !names.includes(name)) {
        throw new Error(`can not RENAME unknown column '${name}'`);
      }
    }

    // Each rename (a column with an alias) goes in the select list as it is
    return changeSelect(
      starQuery,
      SeparatedArray.fromArray(
        names.map(
          name =>
            renames.find(rename => rename.expression.getOutputName() === name) ||
            SqlColumn.optionalQuotes(name),
        ),
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

function addJoin(query: SqlQuery, joinPart: SqlJoinPart, gap: string): SqlQuery {
  const joinedQuery = query.addJoin(joinPart);
  if (query.hasJoin()) return joinedQuery;
  return joinedQuery.changeFromClause(joinedQuery.fromClause!.changeSpace('preJoin', gap));
}
