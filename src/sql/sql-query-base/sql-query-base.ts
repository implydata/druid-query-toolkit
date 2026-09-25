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

import { isEmptyArray } from '../../utils';
import { NEWLINE, SeparatedArray } from '../helpers';
import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { SqlOrderByExpression, SqlPartitionedByClause } from '../sql-clause';
import {
  SqlClusteredByClause,
  SqlInsertClause,
  SqlLimitClause,
  SqlOffsetClause,
  SqlOrderByClause,
  SqlReplaceClause,
} from '../sql-clause';
import { SqlExpression } from '../sql-expression';
import type { SqlLiteral } from '../sql-literal/sql-literal';
import { SqlSetStatement } from '../sql-set-statement/sql-set-statement';

export interface SqlQueryBaseValue extends SqlBaseValue {
  // Prefix
  contextStatements?: SeparatedArray<SqlSetStatement>;
  explain?: boolean;
  insertClause?: SqlInsertClause;
  replaceClause?: SqlReplaceClause;

  // Suffix
  orderByClause?: SqlOrderByClause;
  limitClause?: SqlLimitClause;
  offsetClause?: SqlOffsetClause;
  partitionedByClause?: SqlPartitionedByClause;
  clusteredByClause?: SqlClusteredByClause;
  unionQuery?: SqlQueryBase;
}

/**
 * The common base for everything that can act as a query statement.
 *
 * It owns the wrapper parts that every query form can carry (`SET`, `EXPLAIN PLAN FOR`,
 * `INSERT INTO` / `REPLACE INTO`, `ORDER BY`, `LIMIT`, `OFFSET`, `PARTITIONED BY`,
 * `CLUSTERED BY` and `UNION ALL`) and renders them around the subclass's own body.
 */
export abstract class SqlQueryBase extends SqlExpression {
  static readonly DEFAULT_EXPLAIN_PLAN_FOR_KEYWORD = 'EXPLAIN PLAN FOR';
  static readonly DEFAULT_UNION_KEYWORD = 'UNION ALL';

  public readonly contextStatements?: SeparatedArray<SqlSetStatement>;
  public readonly explain?: boolean;
  public readonly insertClause?: SqlInsertClause;
  public readonly replaceClause?: SqlReplaceClause;
  public readonly orderByClause?: SqlOrderByClause;
  public readonly limitClause?: SqlLimitClause;
  public readonly offsetClause?: SqlOffsetClause;
  public readonly partitionedByClause?: SqlPartitionedByClause;
  public readonly clusteredByClause?: SqlClusteredByClause;
  public readonly unionQuery?: SqlQueryBase;

  constructor(options: SqlQueryBaseValue, typeOverride: SqlTypeDesignator) {
    super(options, typeOverride);
    this.contextStatements = options.contextStatements;
    this.explain = options.explain;
    this.insertClause = options.insertClause;
    this.replaceClause = options.replaceClause;
    if (this.insertClause && this.replaceClause) {
      throw new Error('a query can not have both an insertClause and a replaceClause');
    }

    this.orderByClause = options.orderByClause;
    this.limitClause = options.limitClause;
    this.offsetClause = options.offsetClause;
    this.partitionedByClause = options.partitionedByClause;
    this.clusteredByClause = options.clusteredByClause;
    this.unionQuery = options.unionQuery;
  }

  public valueOf(): SqlQueryBaseValue {
    const value = super.valueOf() as SqlQueryBaseValue;
    value.contextStatements = this.contextStatements;
    value.explain = this.explain;
    value.insertClause = this.insertClause;
    value.replaceClause = this.replaceClause;
    value.orderByClause = this.orderByClause;
    value.limitClause = this.limitClause;
    value.offsetClause = this.offsetClause;
    value.partitionedByClause = this.partitionedByClause;
    value.clusteredByClause = this.clusteredByClause;
    value.unionQuery = this.unionQuery;
    return value;
  }

  /* ~~~~~ Rendering ~~~~~ */

  protected _toRawString(): string {
    return [this._toRawPrefixString(), this._toRawBodyString(), this._toRawSuffixString()].join('');
  }

  protected _toRawPrefixString(): string {
    const { contextStatements, explain, insertClause, replaceClause } = this;

    const rawParts: string[] = [];

    // SET statements
    if (contextStatements) {
      rawParts.push(contextStatements.toString(NEWLINE), this.getSpace('postSets', NEWLINE));
    }

    // Explain
    if (explain) {
      rawParts.push(
        this.getKeyword('explainPlanFor', SqlQueryBase.DEFAULT_EXPLAIN_PLAN_FOR_KEYWORD),
        this.getSpace('postExplainPlanFor', NEWLINE),
      );
    }

    // INSERT / REPLACE clause
    if (insertClause) {
      rawParts.push(insertClause.toString(), this.getSpace('postInsertClause', NEWLINE));
    } else if (replaceClause) {
      rawParts.push(replaceClause.toString(), this.getSpace('postReplaceClause', NEWLINE));
    }

    return rawParts.join('');
  }

  /**
   * The part of the query that is specific to the subclass, rendered between the shared
   * prefix and the shared suffix.
   */
  protected abstract _toRawBodyString(): string;

  protected _toRawSuffixString(): string {
    const {
      orderByClause,
      limitClause,
      offsetClause,
      partitionedByClause,
      clusteredByClause,
      unionQuery,
    } = this;

    const rawParts: string[] = [];

    if (orderByClause) {
      rawParts.push(this.getSpace('preOrderByClause', NEWLINE), orderByClause.toString());
    }

    if (limitClause) {
      rawParts.push(this.getSpace('preLimitClause', NEWLINE), limitClause.toString());
    }

    if (offsetClause) {
      rawParts.push(this.getSpace('preOffsetClause', NEWLINE), offsetClause.toString());
    }

    if (partitionedByClause) {
      rawParts.push(
        this.getSpace('prePartitionedByClause', NEWLINE),
        partitionedByClause.toString(),
      );
    }

    if (clusteredByClause) {
      rawParts.push(this.getSpace('preClusteredByClause', NEWLINE), clusteredByClause.toString());
    }

    if (unionQuery) {
      rawParts.push(
        this.getSpace('preUnion', NEWLINE),
        this.getKeyword('union', SqlQueryBase.DEFAULT_UNION_KEYWORD),
        this.getSpace('postUnion'),
        unionQuery.toString(),
      );
    }

    return rawParts.join('');
  }

  /* ~~~~~ Walking ~~~~~ */

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret: this = this;

    /* ----- prefix ----- */

    if (this.contextStatements) {
      const contextStatements = SqlBase.walkSeparatedArray(
        this.contextStatements,
        nextStack,
        fn,
        postorder,
      );
      if (!contextStatements) return;
      if (contextStatements !== this.contextStatements) {
        ret = ret.changeContextStatements(contextStatements);
      }
    }

    if (this.insertClause) {
      const insertClause = this.insertClause._walkHelper(nextStack, fn, postorder);
      if (!insertClause) return;
      if (insertClause !== this.insertClause) {
        ret = ret.changeInsertClause(insertClause as SqlInsertClause);
      }
    } else if (this.replaceClause) {
      const replaceClause = this.replaceClause._walkHelper(nextStack, fn, postorder);
      if (!replaceClause) return;
      if (replaceClause !== this.replaceClause) {
        ret = ret.changeReplaceClause(replaceClause as SqlReplaceClause);
      }
    }

    /* ----- body ----- */

    const afterBody = this._walkInnerBody(ret, nextStack, fn, postorder);
    if (!afterBody) return;
    ret = afterBody;

    /* ----- suffix ----- */

    if (this.orderByClause) {
      const orderByClause = this.orderByClause._walkHelper(nextStack, fn, postorder);
      if (!orderByClause) return;
      if (orderByClause !== this.orderByClause) {
        ret = ret.changeOrderByClause(orderByClause as SqlOrderByClause);
      }
    }

    if (this.limitClause) {
      const limitClause = this.limitClause._walkHelper(nextStack, fn, postorder);
      if (!limitClause) return;
      if (limitClause !== this.limitClause) {
        ret = ret.changeLimitClause(limitClause as SqlLimitClause);
      }
    }

    if (this.offsetClause) {
      const offsetClause = this.offsetClause._walkHelper(nextStack, fn, postorder);
      if (!offsetClause) return;
      if (offsetClause !== this.offsetClause) {
        ret = ret.changeOffsetClause(offsetClause as SqlOffsetClause);
      }
    }

    if (this.partitionedByClause) {
      const partitionedByClause = this.partitionedByClause._walkHelper(nextStack, fn, postorder);
      if (!partitionedByClause) return;
      if (partitionedByClause !== this.partitionedByClause) {
        ret = ret.changePartitionedByClause(partitionedByClause as SqlPartitionedByClause);
      }
    }

    if (this.clusteredByClause) {
      const clusteredByClause = this.clusteredByClause._walkHelper(nextStack, fn, postorder);
      if (!clusteredByClause) return;
      if (clusteredByClause !== this.clusteredByClause) {
        ret = ret.changeClusteredByClause(clusteredByClause as SqlClusteredByClause);
      }
    }

    if (this.unionQuery) {
      const unionQuery = this.unionQuery._walkHelper(nextStack, fn, postorder);
      if (!unionQuery) return;
      if (unionQuery !== this.unionQuery) {
        ret = ret.changeUnionQuery(unionQuery as SqlQueryBase);
      }
    }

    return ret;
  }

  /**
   * Walks the subclass's own children. `ret` is the accumulator threaded through from the
   * prefix stage, the original children are still read off `this`.
   */
  protected abstract _walkInnerBody(
    ret: this,
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): this | undefined;

  /* ~~~~~ SET ~~~~~ */

  public changeContextStatements(
    contextStatements: SeparatedArray<SqlSetStatement> | SqlSetStatement[] | undefined,
  ): this {
    const newContextStatements = SeparatedArray.fromPossiblyEmptyArray(contextStatements);
    const value = this.valueOf();
    if (newContextStatements) {
      value.contextStatements = newContextStatements;
    } else {
      delete value.contextStatements;
      value.spacing = this.getSpacingWithout('postSets');
    }
    return SqlBase.fromValue(value);
  }

  public hasContext(): boolean {
    return Boolean(this.contextStatements);
  }

  public getContext(): Record<string, any> {
    return SqlSetStatement.contextStatementsToContext(this.contextStatements?.values);
  }

  public changeContext(context: Record<string, any> | undefined): this {
    return this.changeContextStatements(
      context ? SqlSetStatement.contextToContextStatements(context) : undefined,
    );
  }

  /* ~~~~~ EXPLAIN ~~~~~ */

  public changeExplain(explain: boolean): this {
    if (this.explain === explain) return this;
    const value = this.valueOf();
    if (explain) {
      value.explain = true;
    } else {
      delete value.explain;
      value.spacing = this.getSpacingWithout('postExplainPlanFor');
    }
    return SqlBase.fromValue(value);
  }

  public makeExplain(): this {
    return this.changeExplain(true);
  }

  /* ~~~~~ INSERT ~~~~~ */

  public changeInsertClause(insertClause: SqlInsertClause | undefined): this {
    if (this.insertClause === insertClause) return this;
    const value = this.valueOf();
    if (insertClause) {
      value.insertClause = insertClause;
    } else {
      delete value.insertClause;
      value.spacing = this.getSpacingWithout('postInsertClause');
    }
    return SqlBase.fromValue(value);
  }

  public getInsertIntoTable(): SqlExpression | undefined {
    return this.insertClause?.table;
  }

  public changeInsertIntoTable(table: SqlExpression | string | undefined): this {
    return this.changeInsertClause(
      table
        ? this.insertClause
          ? this.insertClause.changeTable(table)
          : SqlInsertClause.create(table)
        : undefined,
    );
  }

  /* ~~~~~ REPLACE ~~~~~ */

  public changeReplaceClause(replaceClause: SqlReplaceClause | undefined): this {
    if (this.replaceClause === replaceClause) return this;
    const value = this.valueOf();
    if (replaceClause) {
      value.replaceClause = replaceClause;
    } else {
      delete value.replaceClause;
      value.spacing = this.getSpacingWithout('postReplaceClause');
    }
    return SqlBase.fromValue(value);
  }

  public getReplaceIntoTable(): SqlExpression | undefined {
    return this.replaceClause?.table;
  }

  public changeReplaceIntoTable(table: SqlExpression | string | undefined): this {
    return this.changeReplaceClause(
      table
        ? this.replaceClause
          ? this.replaceClause.changeTable(table)
          : SqlReplaceClause.create(table)
        : undefined,
    );
  }

  /* ~~~~~ INSERT + REPLACE ~~~~~ */

  public getIngestTable(): SqlExpression | undefined {
    return this.getInsertIntoTable() || this.getReplaceIntoTable();
  }

  /* ~~~~~ WITH ~~~~~ */

  /**
   * Flattens any nested `WITH` queries into a single query. Query forms that can not carry a
   * `WITH` clause are returned unchanged.
   */
  public flattenWith(): SqlQueryBase {
    return this;
  }

  /* ~~~~~ ORDER BY ~~~~~ */

  public changeOrderByClause(orderByClause: SqlOrderByClause | undefined): this {
    if (this.orderByClause === orderByClause) return this;
    const value = this.valueOf();
    if (orderByClause) {
      value.orderByClause = orderByClause;
    } else {
      delete value.orderByClause;
      value.spacing = this.getSpacingWithout('preOrderByClause');
    }
    return SqlBase.fromValue(value);
  }

  public changeOrderByExpressions(
    orderByExpressions: SeparatedArray<SqlOrderByExpression> | SqlOrderByExpression[] | undefined,
  ): this {
    if (!orderByExpressions || isEmptyArray(orderByExpressions)) {
      return this.changeOrderByClause(undefined);
    } else {
      return this.changeOrderByClause(
        this.orderByClause
          ? this.orderByClause.changeExpressions(orderByExpressions)
          : SqlOrderByClause.create(orderByExpressions),
      );
    }
  }

  public changeOrderByExpression(orderByExpression: SqlOrderByExpression | undefined): this {
    if (!orderByExpression) return this.changeOrderByClause(undefined);
    return this.changeOrderByExpressions([orderByExpression]);
  }

  public hasOrderBy(): boolean {
    return Boolean(this.orderByClause);
  }

  public getOrderByExpressions(): readonly SqlOrderByExpression[] {
    const { orderByClause } = this;
    if (!orderByClause) return [];
    return orderByClause.expressions.values;
  }

  public getOrderByForExpression(ex: SqlExpression): SqlOrderByExpression | undefined {
    if (!this.orderByClause) return;
    return this.orderByClause.toArray().find(orderByExpression => {
      return orderByExpression.expression.equals(ex);
    });
  }

  public addOrderBy(orderBy: SqlOrderByExpression): this {
    return this.changeOrderByClause(
      this.orderByClause ? this.orderByClause.addFirst(orderBy) : SqlOrderByClause.create(orderBy),
    );
  }

  /* ~~~~~ LIMIT ~~~~~ */

  public changeLimitClause(limitClause: SqlLimitClause | undefined): this {
    if (this.limitClause === limitClause) return this;
    const value = this.valueOf();
    if (limitClause) {
      value.limitClause = limitClause;
    } else {
      delete value.limitClause;
      value.spacing = this.getSpacingWithout('preLimitClause');
    }
    return SqlBase.fromValue(value);
  }

  public getLimitValue(): number | undefined {
    return this.limitClause?.getLimitValue();
  }

  public changeLimitValue(limitValue: SqlLiteral | number | undefined): this {
    if (typeof limitValue === 'number' && limitValue < 0) {
      throw new Error(`${limitValue} is not a valid limit value`);
    }
    if (typeof limitValue === 'undefined') return this.changeLimitClause(undefined);
    if (typeof limitValue === 'number' && !isFinite(limitValue)) {
      return this.changeLimitClause(undefined);
    }
    return this.changeLimitClause(
      this.limitClause
        ? this.limitClause.changeLimit(limitValue)
        : SqlLimitClause.create(limitValue),
    );
  }

  public hasLimit(): boolean {
    return Boolean(this.limitClause);
  }

  public combineWithLimitClause(otherLimitClause: SqlLimitClause): this {
    if (this.limitClause) {
      return this.changeLimitValue(
        Math.min(this.limitClause.getLimitValue(), otherLimitClause.getLimitValue()),
      );
    } else {
      return this.changeLimitClause(otherLimitClause);
    }
  }

  /* ~~~~~ OFFSET ~~~~~ */

  public changeOffsetClause(offsetClause: SqlOffsetClause | undefined): this {
    if (this.offsetClause === offsetClause) return this;
    const value = this.valueOf();
    if (offsetClause) {
      value.offsetClause = offsetClause;
    } else {
      delete value.offsetClause;
      value.spacing = this.getSpacingWithout('preOffsetClause');
    }
    return SqlBase.fromValue(value);
  }

  public getOffsetValue(): number | undefined {
    return this.offsetClause?.getOffsetValue();
  }

  public changeOffsetValue(offsetValue: SqlLiteral | number | undefined): this {
    if (typeof offsetValue === 'undefined') return this.changeOffsetClause(undefined);
    return this.changeOffsetClause(
      this.offsetClause
        ? this.offsetClause.changeOffset(offsetValue)
        : SqlOffsetClause.create(offsetValue),
    );
  }

  public hasOffset(): boolean {
    return Boolean(this.offsetClause);
  }

  public combineWithOffsetClause(otherOffsetClause: SqlOffsetClause): this {
    if (this.offsetClause) {
      return this.changeOffsetValue(
        this.offsetClause.getOffsetValue() + otherOffsetClause.getOffsetValue(),
      );
    } else {
      return this.changeOffsetClause(otherOffsetClause);
    }
  }

  /* ~~~~~ PARTITIONED BY ~~~~~ */

  public changePartitionedByClause(partitionedByClause: SqlPartitionedByClause | undefined): this {
    if (this.partitionedByClause === partitionedByClause) return this;
    const value = this.valueOf();
    if (partitionedByClause) {
      value.partitionedByClause = partitionedByClause;
    } else {
      delete value.partitionedByClause;
      value.spacing = this.getSpacingWithout('prePartitionedByClause');
    }
    return SqlBase.fromValue(value);
  }

  /* ~~~~~ CLUSTERED BY ~~~~~ */

  public changeClusteredByClause(clusteredByClause: SqlClusteredByClause | undefined): this {
    if (this.clusteredByClause === clusteredByClause) return this;
    const value = this.valueOf();
    if (clusteredByClause) {
      value.clusteredByClause = clusteredByClause;
    } else {
      delete value.clusteredByClause;
      value.spacing = this.getSpacingWithout('preClusteredByClause');
    }
    return SqlBase.fromValue(value);
  }

  public changeClusteredByExpressions(
    clusteredByExpressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): this {
    if (!clusteredByExpressions || isEmptyArray(clusteredByExpressions)) {
      return this.changeClusteredByClause(undefined);
    } else {
      return this.changeClusteredByClause(
        this.clusteredByClause
          ? this.clusteredByClause.changeExpressions(clusteredByExpressions)
          : SqlClusteredByClause.create(clusteredByExpressions),
      );
    }
  }

  /* ~~~~~ UNION ~~~~~ */

  public changeUnionQuery(unionQuery: SqlQueryBase | undefined): this {
    if (this.unionQuery === unionQuery) return this;
    const value = this.valueOf();
    if (unionQuery) {
      value.unionQuery = unionQuery;
    } else {
      delete value.unionQuery;
      value.spacing = this.getSpacingWithout('preUnion', 'postUnion');
      value.keywords = this.getKeywordsWithout('union');
    }
    return SqlBase.fromValue(value);
  }
}
