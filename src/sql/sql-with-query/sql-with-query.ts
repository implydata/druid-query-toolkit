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
  SqlWithClause,
  SqlWithPart,
} from '../sql-clause';
import { SqlExpression } from '../sql-expression';
import type { SqlLiteral } from '../sql-literal/sql-literal';
import { SqlQuery } from '../sql-query/sql-query';
import { SqlSetStatement } from '../sql-set-statement/sql-set-statement';

export interface SqlWithQueryValue extends SqlBaseValue {
  contextStatements?: SeparatedArray<SqlSetStatement>;
  explain?: boolean;
  insertClause?: SqlInsertClause;
  replaceClause?: SqlReplaceClause;
  withClause: SqlWithClause;

  query: SqlQuery | SqlWithQuery;

  orderByClause?: SqlOrderByClause;
  limitClause?: SqlLimitClause;
  offsetClause?: SqlOffsetClause;
  partitionedByClause?: SqlPartitionedByClause;
  clusteredByClause?: SqlClusteredByClause;
}

export class SqlWithQuery extends SqlExpression {
  static type: SqlTypeDesignator = 'withQuery';

  public readonly contextStatements?: SeparatedArray<SqlSetStatement>;
  public readonly explain?: boolean;
  public readonly insertClause?: SqlInsertClause;
  public readonly replaceClause?: SqlReplaceClause;
  public readonly withClause: SqlWithClause;
  public readonly query: SqlQuery | SqlWithQuery;
  public readonly orderByClause?: SqlOrderByClause;
  public readonly limitClause?: SqlLimitClause;
  public readonly offsetClause?: SqlOffsetClause;
  public readonly partitionedByClause?: SqlPartitionedByClause;
  public readonly clusteredByClause?: SqlClusteredByClause;

  constructor(options: SqlWithQueryValue) {
    super(options, SqlWithQuery.type);
    this.contextStatements = options.contextStatements;
    this.explain = options.explain;
    this.insertClause = options.insertClause;
    this.replaceClause = options.replaceClause;
    if (this.insertClause && this.replaceClause) {
      throw new Error('SqlWithQuery can not have both an insertClause and a replaceClause');
    }

    this.withClause = options.withClause;
    this.query = options.query;
    this.orderByClause = options.orderByClause;
    this.limitClause = options.limitClause;
    this.offsetClause = options.offsetClause;
    this.partitionedByClause = options.partitionedByClause;
    this.clusteredByClause = options.clusteredByClause;
  }

  public valueOf(): SqlWithQueryValue {
    const value = super.valueOf() as SqlWithQueryValue;
    value.contextStatements = this.contextStatements;
    value.explain = this.explain;
    value.insertClause = this.insertClause;
    value.replaceClause = this.replaceClause;
    value.withClause = this.withClause;
    value.query = this.query;
    value.orderByClause = this.orderByClause;
    value.limitClause = this.limitClause;
    value.offsetClause = this.offsetClause;
    value.partitionedByClause = this.partitionedByClause;
    value.clusteredByClause = this.clusteredByClause;
    return value;
  }

  protected _toRawString(): string {
    const {
      contextStatements,
      explain,
      insertClause,
      replaceClause,
      withClause,
      query,
      orderByClause,
      limitClause,
      offsetClause,
      partitionedByClause,
      clusteredByClause,
    } = this;

    const rawParts: string[] = [];

    // SET clauses
    if (contextStatements) {
      rawParts.push(contextStatements.toString(NEWLINE), this.getSpace('postSets', NEWLINE));
    }

    // Explain
    if (explain) {
      rawParts.push(
        this.getKeyword('explainPlanFor', SqlQuery.DEFAULT_EXPLAIN_PLAN_FOR_KEYWORD),
        this.getSpace('postExplainPlanFor', NEWLINE),
      );
    }

    // INSERT / REPLACE clause
    if (insertClause) {
      rawParts.push(insertClause.toString(), this.getSpace('postInsertClause', NEWLINE));
    } else if (replaceClause) {
      rawParts.push(replaceClause.toString(), this.getSpace('postReplaceClause', NEWLINE));
    }

    // WITH clause
    rawParts.push(withClause.toString(), this.getSpace('postWithClause', NEWLINE));

    // Sub query
    rawParts.push(query.toString());

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

    return rawParts.join('');
  }

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

  public changeContext(context: Record<string, any>): this {
    return this.changeContextStatements(
      context ? SqlSetStatement.contextToContextStatements(context) : undefined,
    );
  }

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

  public changeWithClause(withClause: SqlWithClause): this {
    if (this.withClause === withClause) return this;
    const value = this.valueOf();
    value.withClause = withClause;
    return SqlBase.fromValue(value);
  }

  public changeQuery(query: SqlQuery): this {
    if (this.query === query) return this;
    const value = this.valueOf();
    value.query = query;
    return SqlBase.fromValue(value);
  }

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
    if (!orderByExpressions) return this.changeOrderByClause(undefined);
    return this.changeOrderByClause(
      this.orderByClause
        ? this.orderByClause.changeExpressions(orderByExpressions)
        : SqlOrderByClause.create(orderByExpressions),
    );
  }

  public changeOrderByExpression(orderByExpression: SqlOrderByExpression | undefined): this {
    if (!orderByExpression) return this.changeOrderByClause(undefined);
    return this.changeOrderByExpressions([orderByExpression]);
  }

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

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlWithQuery | undefined {
    let ret: SqlWithQuery = this;

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

    const withClause = this.withClause._walkHelper(nextStack, fn, postorder);
    if (!withClause) return;
    if (withClause !== this.withClause) {
      ret = ret.changeWithClause(withClause as SqlWithClause);
    }

    const query = this.query._walkHelper(nextStack, fn, postorder);
    if (!query) return;
    if (query !== this.query) {
      ret = ret.changeQuery(query as SqlQuery);
    }

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

    return ret;
  }

  /* ~~~~~ EXPLAIN ~~~~~ */

  public makeExplain(): this {
    return this.changeExplain(true);
  }

  /* ~~~~~ INSERT ~~~~~ */

  public getInsertIntoTable(): SqlExpression | undefined {
    return this.insertClause?.table;
  }

  public changeInsertIntoTable(table: SqlExpression | string | undefined): this {
    const value = this.valueOf();
    value.insertClause = table
      ? value.insertClause
        ? value.insertClause.changeTable(table)
        : SqlInsertClause.create(table)
      : undefined;
    return SqlBase.fromValue(value);
  }

  /* ~~~~~ REPLACE ~~~~~ */

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

  public getWithParts(): readonly SqlWithPart[] {
    const { withClause } = this;
    return withClause.withParts.values;
  }

  public changeWithParts(withParts: SeparatedArray<SqlWithPart> | SqlWithPart[]): this {
    return this.changeWithClause(
      this.withClause
        ? this.withClause.changeWithParts(withParts)
        : SqlWithClause.create(withParts),
    );
  }

  public prependWith(name: string, query: SqlQuery): this {
    return this.changeWithParts(
      [SqlWithPart.simple(name, query.ensureParens())].concat(this.getWithParts()),
    );
  }

  public flattenWith(): SqlQuery {
    let flatQuery = this.query
      .flattenWith()
      .changeParens([])
      .changeSpaces({ initial: this.spacing['initial'], final: this.spacing['final'] });

    flatQuery = flatQuery.changeWithParts(this.getWithParts().concat(flatQuery.getWithParts()));

    if (this.insertClause) {
      flatQuery = flatQuery.changeInsertClause(this.insertClause);
    } else if (this.replaceClause) {
      flatQuery = flatQuery.changeReplaceClause(this.replaceClause);
    }

    if (this.orderByClause) {
      flatQuery = flatQuery.changeOrderByClause(this.orderByClause);
    }

    if (this.limitClause) {
      flatQuery = flatQuery.combineWithLimitClause(this.limitClause);
    }

    if (this.offsetClause) {
      flatQuery = flatQuery.combineWithOffsetClause(this.offsetClause);
    }

    if (this.partitionedByClause) {
      flatQuery = flatQuery.changePartitionedByClause(this.partitionedByClause);
    }

    if (this.clusteredByClause) {
      flatQuery = flatQuery.changeClusteredByClause(this.clusteredByClause);
    }

    return flatQuery;
  }

  /* ~~~~~ ORDER BY ~~~~~ */

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

  public hasLimit(): boolean {
    return Boolean(this.limitClause);
  }

  /* ~~~~~ OFFSET ~~~~~ */

  public hasOffset(): boolean {
    return Boolean(this.offsetClause);
  }
}

SqlBase.register(SqlWithQuery);
