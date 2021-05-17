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

import { filterMap } from '../../utils';
import { parseSql } from '../parser';
import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../sql-base';
import {
  SqlFromClause,
  SqlGroupByClause,
  SqlHavingClause,
  SqlJoinPart,
  SqlLimitClause,
  SqlOffsetClause,
  SqlOrderByClause,
  SqlOrderByDirection,
  SqlOrderByExpression,
  SqlWhereClause,
} from '../sql-clause';
import { SqlExpression } from '../sql-expression';
import { SqlLiteral } from '../sql-literal/sql-literal';
import { SqlRef } from '../sql-ref/sql-ref';
import { SqlStar } from '../sql-star/sql-star';
import { clampIndex, normalizeIndex, SeparatedArray, Separator } from '../utils';

import { SqlWithPart } from './sql-with-part/sql-with-part';

const INDENT_SPACE = '\n  ';

export type SqlQueryDecorator = 'ALL' | 'DISTINCT';

export type InsertIndex = number | 'last-grouping' | 'last';

export interface ExpressionInfo {
  expression: SqlExpression;
  selectIndex: number;
  outputColumn?: string;
  orderByExpression?: SqlOrderByExpression;
}

export interface AddSelectOptions {
  insertIndex?: InsertIndex;
  addToGroupBy?: 'start' | 'end';
  addToOrderBy?: 'start' | 'end';
  orderByExpression?: SqlOrderByExpression;
  direction?: SqlOrderByDirection;
}

export interface SqlQueryValue extends SqlBaseValue {
  explainPlanFor?: boolean;
  withParts?: SeparatedArray<SqlWithPart>;
  decorator?: SqlQueryDecorator;
  selectExpressions?: SeparatedArray<SqlExpression>;

  fromClause?: SqlFromClause;
  whereClause?: SqlWhereClause;
  groupByClause?: SqlGroupByClause;
  havingClause?: SqlHavingClause;
  orderByClause?: SqlOrderByClause;
  limitClause?: SqlLimitClause;
  offsetClause?: SqlOffsetClause;
  unionQuery?: SqlQuery;
}

export class SqlQuery extends SqlExpression {
  static type: SqlType = 'query';

  static readonly DEFAULT_EXPLAIN_KEYWORD = 'EXPLAIN';
  static readonly DEFAULT_PLAN_KEYWORD = 'PLAN';
  static readonly DEFAULT_FOR_KEYWORD = 'FOR';
  static readonly DEFAULT_WITH_KEYWORD = 'WITH';
  static readonly DEFAULT_SELECT_KEYWORD = 'SELECT';
  static readonly DEFAULT_UNION_KEYWORD = 'UNION ALL';

  static create(from: SqlExpression | SqlFromClause): SqlQuery {
    return new SqlQuery({
      selectExpressions: SeparatedArray.fromSingleValue(SqlStar.PLAIN),
      fromClause:
        from instanceof SqlFromClause
          ? from
          : SqlFromClause.create(SeparatedArray.fromSingleValue(from.convertToTableRef())),
    });
  }

  static from(from: SqlExpression | SqlFromClause): SqlQuery {
    return new SqlQuery({
      fromClause:
        from instanceof SqlFromClause
          ? from
          : SqlFromClause.create(SeparatedArray.fromSingleValue(from.convertToTableRef())),
    });
  }

  static parse(input: string | SqlQuery): SqlQuery {
    if (typeof input === 'string') {
      const parsed = parseSql(input);
      if (!(parsed instanceof SqlQuery)) {
        throw new Error('Provided SQL was not a query');
      }
      return parsed;
    } else if (input instanceof SqlQuery) {
      return input;
    } else {
      throw new Error('unknown input');
    }
  }

  static getSelectExpressionOutput(selectExpression: SqlExpression, i: number) {
    return selectExpression.getOutputName() || `EXPR$${i}`;
  }

  static isPhonyOutputName(name: string) {
    return /^EXPR\$(?:\d|[1-9]\d*)$/.test(name);
  }

  public readonly explainPlanFor?: boolean;
  public readonly withParts?: SeparatedArray<SqlWithPart>;
  public readonly decorator?: SqlQueryDecorator;
  public readonly selectExpressions?: SeparatedArray<SqlExpression>;
  public readonly fromClause?: SqlFromClause;
  public readonly whereClause?: SqlWhereClause;
  public readonly groupByClause?: SqlGroupByClause;
  public readonly havingClause?: SqlHavingClause;
  public readonly orderByClause?: SqlOrderByClause;
  public readonly limitClause?: SqlLimitClause;
  public readonly offsetClause?: SqlOffsetClause;
  public readonly unionQuery?: SqlQuery;

  constructor(options: SqlQueryValue) {
    super(options, SqlQuery.type);
    this.explainPlanFor = options.explainPlanFor;
    this.withParts = options.withParts;
    this.decorator = options.decorator;
    this.selectExpressions = options.selectExpressions;
    this.fromClause = options.fromClause;
    this.whereClause = options.whereClause;
    this.groupByClause = options.groupByClause;
    this.havingClause = options.havingClause;
    this.orderByClause = options.orderByClause;
    this.limitClause = options.limitClause;
    this.offsetClause = options.offsetClause;
    this.unionQuery = options.unionQuery;
  }

  public valueOf(): SqlQueryValue {
    const value = super.valueOf() as SqlQueryValue;
    if (this.explainPlanFor) value.explainPlanFor = true;
    value.withParts = this.withParts;
    value.decorator = this.decorator;
    value.selectExpressions = this.selectExpressions;
    value.fromClause = this.fromClause;
    value.whereClause = this.whereClause;
    value.groupByClause = this.groupByClause;
    value.havingClause = this.havingClause;
    value.orderByClause = this.orderByClause;
    value.limitClause = this.limitClause;
    value.offsetClause = this.offsetClause;
    value.unionQuery = this.unionQuery;
    return value;
  }

  protected _toRawString(): string {
    const {
      explainPlanFor,
      withParts,
      decorator,
      selectExpressions,
      fromClause,
      whereClause,
      groupByClause,
      havingClause,
      orderByClause,
      limitClause,
      offsetClause,
      unionQuery,
    } = this;

    const rawParts: string[] = [this.getSpace('preQuery', '')];

    // Explain clause
    if (explainPlanFor) {
      rawParts.push(
        this.getKeyword('explain', SqlQuery.DEFAULT_EXPLAIN_KEYWORD),
        this.getSpace('postExplain'),
        this.getKeyword('plan', SqlQuery.DEFAULT_PLAN_KEYWORD),
        this.getSpace('postPlan'),
        this.getKeyword('for', SqlQuery.DEFAULT_FOR_KEYWORD),
        this.getSpace('postFor', '\n'),
      );
    }

    // WITH clause
    if (withParts) {
      rawParts.push(
        this.getKeyword('with', SqlQuery.DEFAULT_WITH_KEYWORD),
        this.getSpace('postWith', INDENT_SPACE),
        withParts.toString(INDENT_SPACE),
        this.getSpace('postWithParts', '\n'),
      );
    }

    const indentSpace = selectExpressions && selectExpressions.length() > 1 ? INDENT_SPACE : ' ';

    // SELECT clause
    rawParts.push(
      this.getKeyword('select', SqlQuery.DEFAULT_SELECT_KEYWORD),
      this.getSpace('postSelect', decorator ? ' ' : indentSpace),
    );
    if (this.decorator) {
      rawParts.push(
        this.getKeyword('decorator', this.decorator),
        this.getSpace('postDecorator', indentSpace),
      );
    }

    rawParts.push(
      selectExpressions
        ? selectExpressions.toString(new Separator({ separator: ',', right: indentSpace }))
        : '...',
    );

    if (fromClause) {
      rawParts.push(this.getSpace('preFrom', '\n'), fromClause.toString());
    }

    if (whereClause) {
      rawParts.push(this.getSpace('preWhere', '\n'), whereClause.toString());
    }

    if (groupByClause) {
      rawParts.push(this.getSpace('preGroupBy', '\n'), groupByClause.toString());
    }

    if (havingClause) {
      rawParts.push(this.getSpace('preHaving', '\n'), havingClause.toString());
    }

    if (orderByClause) {
      rawParts.push(this.getSpace('preOrderBy', '\n'), orderByClause.toString());
    }

    if (limitClause) {
      rawParts.push(this.getSpace('preLimit', '\n'), limitClause.toString());
    }

    if (offsetClause) {
      rawParts.push(this.getSpace('preOffset', '\n'), offsetClause.toString());
    }

    if (unionQuery) {
      rawParts.push(
        this.getSpace('preUnion', '\n'),
        this.getKeyword('union', SqlQuery.DEFAULT_UNION_KEYWORD),
        this.getSpace('postUnion'),
        unionQuery.toString(),
      );
    }

    rawParts.push(this.getSpace('postQuery', ''));

    return rawParts.join('');
  }

  public changeWithParts(withParts: SeparatedArray<SqlWithPart> | SqlWithPart[] | undefined): this {
    if (this.withParts === withParts) return this;
    const value = this.valueOf();
    if (withParts) {
      value.withParts = SeparatedArray.fromArray(withParts);
    } else {
      delete value.withParts;
      value.keywords = this.getKeywordsWithout('with');
      value.spacing = this.getSpacingWithout('postWith', 'postWithParts');
    }
    return SqlBase.fromValue(value);
  }

  public changeSelectExpressions(
    selectExpressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): this {
    if (this.selectExpressions === selectExpressions) return this;
    const value = this.valueOf();
    if (selectExpressions) {
      value.selectExpressions = SeparatedArray.fromArray(selectExpressions);
    } else {
      delete value.selectExpressions;
    }
    return SqlBase.fromValue(value);
  }

  public changeFromClause(fromClause: SqlFromClause | undefined): this {
    if (this.fromClause === fromClause) return this;
    const value = this.valueOf();
    if (fromClause) {
      value.fromClause = fromClause;
    } else {
      delete value.fromClause;
      value.spacing = this.getSpacingWithout('preFrom');
    }
    return SqlBase.fromValue(value);
  }

  public changeFromExpressions(
    fromExpressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): this {
    if (!fromExpressions) return this.changeFromClause(undefined);
    return this.changeFromClause(
      this.fromClause
        ? this.fromClause.changeExpressions(fromExpressions)
        : SqlFromClause.create(fromExpressions),
    );
  }

  public changeWhereClause(whereClause: SqlWhereClause | undefined): this {
    if (this.whereClause === whereClause) return this;
    const value = this.valueOf();
    if (whereClause) {
      value.whereClause = whereClause;
    } else {
      delete value.whereClause;
      value.spacing = this.getSpacingWithout('preWhere');
    }
    return SqlBase.fromValue(value);
  }

  public changeWhereExpression(whereExpression: SqlExpression | string | undefined): this {
    if (!whereExpression) return this.changeWhereClause(undefined);
    return this.changeWhereClause(
      this.whereClause
        ? this.whereClause.changeExpression(whereExpression)
        : SqlWhereClause.create(whereExpression),
    );
  }

  public changeGroupByClause(groupByClause: SqlGroupByClause | undefined): this {
    if (this.groupByClause === groupByClause) return this;
    const value = this.valueOf();
    if (groupByClause) {
      value.groupByClause = groupByClause;
    } else {
      delete value.groupByClause;
      value.spacing = this.getSpacingWithout('preGroupBy');
    }
    return SqlBase.fromValue(value);
  }

  public changeGroupByExpressions(
    groupByExpressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): this {
    if (typeof groupByExpressions === 'undefined') return this.changeGroupByClause(undefined);
    return this.changeGroupByClause(
      this.groupByClause
        ? this.groupByClause.changeExpressions(groupByExpressions)
        : SqlGroupByClause.create(groupByExpressions),
    );
  }

  public changeHavingClause(havingClause: SqlHavingClause | undefined): this {
    if (this.havingClause === havingClause) return this;
    const value = this.valueOf();
    if (havingClause) {
      value.havingClause = havingClause;
    } else {
      delete value.havingClause;
      value.spacing = this.getSpacingWithout('preHaving');
    }
    return SqlBase.fromValue(value);
  }

  public changeHavingExpression(havingExpression: SqlExpression | string | undefined): this {
    if (!havingExpression) return this.changeHavingClause(undefined);
    return this.changeHavingClause(
      this.havingClause
        ? this.havingClause.changeExpression(havingExpression)
        : SqlHavingClause.create(havingExpression),
    );
  }

  public changeOrderByClause(orderByClause: SqlOrderByClause | undefined): this {
    if (this.orderByClause === orderByClause) return this;
    const value = this.valueOf();
    if (orderByClause) {
      value.orderByClause = orderByClause;
    } else {
      delete value.orderByClause;
      value.spacing = this.getSpacingWithout('preOrderBy');
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
      value.spacing = this.getSpacingWithout('preLimit');
    }
    return SqlBase.fromValue(value);
  }

  public changeLimitValue(limitValue: SqlLiteral | number | undefined): this {
    if (typeof limitValue === 'undefined') return this.changeLimitClause(undefined);
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
      value.spacing = this.getSpacingWithout('preOffset');
    }
    return SqlBase.fromValue(value);
  }

  public changeOffsetValue(offsetValue: SqlLiteral | number | undefined): this {
    if (typeof offsetValue === 'undefined') return this.changeOffsetClause(undefined);
    return this.changeOffsetClause(
      this.offsetClause
        ? this.offsetClause.changeOffset(offsetValue)
        : SqlOffsetClause.create(offsetValue),
    );
  }

  public changeUnionQuery(unionQuery: SqlQuery | undefined): this {
    const value = this.valueOf();
    if (typeof unionQuery === 'undefined') {
      delete value.unionQuery;
      value.spacing = this.getSpacingWithout('preUnion', 'postUnion');
      value.keywords = this.getKeywordsWithout('union');
    } else {
      value.unionQuery = unionQuery;
    }
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlQuery | undefined {
    let ret: SqlQuery = this;

    if (this.withParts) {
      const withParts = SqlBase.walkSeparatedArray(this.withParts, nextStack, fn, postorder);
      if (!withParts) return;
      if (withParts !== this.withParts) {
        ret = ret.changeWithParts(withParts);
      }
    }

    if (this.selectExpressions) {
      const selectExpressions = SqlBase.walkSeparatedArray(
        this.selectExpressions,
        nextStack,
        fn,
        postorder,
      );
      if (!selectExpressions) return;
      if (selectExpressions !== this.selectExpressions) {
        ret = ret.changeSelectExpressions(selectExpressions);
      }
    }

    if (this.fromClause) {
      const fromClause = this.fromClause._walkHelper(nextStack, fn, postorder);
      if (!fromClause) return;
      if (fromClause !== this.fromClause) {
        ret = ret.changeFromClause(fromClause as SqlFromClause);
      }
    }

    if (this.whereClause) {
      const whereClause = this.whereClause._walkHelper(nextStack, fn, postorder);
      if (!whereClause) return;
      if (whereClause !== this.whereClause) {
        ret = ret.changeWhereClause(whereClause as SqlWhereClause);
      }
    }

    if (this.groupByClause) {
      const groupByClause = this.groupByClause._walkHelper(nextStack, fn, postorder);
      if (!groupByClause) return;
      if (groupByClause !== this.groupByClause) {
        ret = ret.changeGroupByClause(groupByClause as SqlGroupByClause);
      }
    }

    if (this.havingClause) {
      const havingClause = this.havingClause._walkHelper(nextStack, fn, postorder);
      if (!havingClause) return;
      if (havingClause !== this.havingClause) {
        ret = ret.changeHavingClause(havingClause as SqlHavingClause);
      }
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

    if (this.unionQuery) {
      const unionQuery = this.unionQuery._walkHelper(nextStack, fn, postorder);
      if (!unionQuery) return;
      if (unionQuery !== this.unionQuery) {
        ret = ret.changeUnionQuery(unionQuery as SqlQuery);
      }
    }

    return ret;
  }

  /* ~~~~~ General stuff ~~~~~ */

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.withParts = this.withParts?.clearSeparators();
    value.selectExpressions = this.selectExpressions?.clearSeparators();
    return SqlBase.fromValue(value);
  }

  /* ~~~~~ EXPLAIN ~~~~~ */

  public makeExplain(): this {
    const value = this.valueOf();
    value.explainPlanFor = true;
    return SqlBase.fromValue(value);
  }

  /* ~~~~~ WITH ~~~~~ */

  public prependWith(name: string, query: SqlQuery): this {
    const { withParts } = this;
    const withPart = SqlWithPart.simple(name, query.ensureParens());
    return this.changeWithParts(withParts ? withParts.prepend(withPart) : [withPart]);
  }

  /* ~~~~~ SELECT ~~~~~ */

  public isValidSelectIndex(selectIndex: number): boolean {
    const { selectExpressions } = this;
    if (!selectExpressions) return false;
    return 0 <= selectIndex && selectIndex < selectExpressions.length();
  }

  public getSelectExpressionsArray(): readonly SqlExpression[] {
    return this.selectExpressions?.values || [];
  }

  public getSelectExpressionForIndex(selectIndex: number): SqlExpression | undefined {
    return this.selectExpressions?.get(selectIndex);
  }

  public hasStarInSelect(): boolean {
    return this.getSelectExpressionsArray().some(v => v instanceof SqlStar);
  }

  public getOutputColumns(): string[] {
    return this.getSelectExpressionsArray().map(SqlQuery.getSelectExpressionOutput);
  }

  public getSelectIndexesForColumn(column: string): number[] {
    return filterMap(this.getSelectExpressionsArray(), (selectExpression, i) => {
      return selectExpression.containsColumn(column) ? i : undefined;
    });
  }

  public getGroupedSelectIndexesForColumn(column: string): number[] {
    return this.getSelectIndexesForColumn(column).filter(selectIndex =>
      this.isGroupedSelectIndex(selectIndex),
    );
  }

  public getSelectIndexForOutputColumn(outputColumn: string): number {
    return this.getSelectExpressionsArray().findIndex((selectExpression, i) => {
      return SqlQuery.getSelectExpressionOutput(selectExpression, i) === outputColumn;
    });
  }

  private expressionRefersToSelectIndex(
    ex: SqlExpression,
    selectIndex: number,
    allowAliasReferences: boolean,
  ): boolean {
    const selectExpression = this.getSelectExpressionForIndex(selectIndex);
    if (!selectExpression) return false;

    if (ex instanceof SqlLiteral && ex.isIndex()) {
      return selectIndex === ex.getIndexValue();
    }

    if (allowAliasReferences && ex instanceof SqlRef) {
      return selectExpression.getOutputName() === ex.getColumn();
    }

    return ex.equals(selectExpression.getUnderlyingExpression());
  }

  public getSelectIndexForExpression(ex: SqlExpression, allowAliasReferences: boolean): number {
    const selectExpressionsArray = this.getSelectExpressionsArray();

    if (ex instanceof SqlLiteral && ex.isIndex()) {
      const idx = ex.getIndexValue();
      return this.isValidSelectIndex(idx) ? idx : -1;
    }

    if (allowAliasReferences && ex instanceof SqlRef) {
      const refIdx = selectExpressionsArray.findIndex((selectExpression, i) => {
        return SqlQuery.getSelectExpressionOutput(selectExpression, i) === ex.getColumn();
      });
      if (refIdx !== -1) {
        return refIdx;
      }
    }

    return selectExpressionsArray.findIndex(selectExpression => {
      return ex.equals(selectExpression.getUnderlyingExpression());
    });
  }

  public isRealOutputColumnAtSelectIndex(selectIndex: number): boolean {
    const selectExpression = this.getSelectExpressionForIndex(selectIndex);
    if (!selectExpression) return false;
    return Boolean(selectExpression.getOutputName());
  }

  public isGroupedSelectIndex(selectIndex: number): boolean {
    const { groupByClause } = this;
    if (!groupByClause || !this.isValidSelectIndex(selectIndex)) return false;
    return groupByClause
      .toArray()
      .some(ex => this.expressionRefersToSelectIndex(ex, selectIndex, false));
  }

  public isGroupedOutputColumn(outputColumn: string): boolean {
    return this.isGroupedSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  public getGroupedSelectExpressions(): SqlExpression[] {
    if (!this.hasGroupBy()) return [];
    return this.getSelectExpressionsArray().filter((_selectExpression, i) => {
      return this.isGroupedSelectIndex(i);
    });
  }

  getGroupedOutputColumns(): string[] {
    if (!this.hasGroupBy()) return [];
    return filterMap(this.getSelectExpressionsArray(), (selectExpression, i) => {
      if (!this.isGroupedSelectIndex(i)) return;
      return SqlQuery.getSelectExpressionOutput(selectExpression, i);
    });
  }

  isAggregateSelectIndex(selectIndex: number): boolean {
    const { groupByClause } = this;
    if (!groupByClause || !this.isValidSelectIndex(selectIndex)) return false;
    return !this.isGroupedSelectIndex(selectIndex);
  }

  isAggregateOutputColumn(outputColumn: string): boolean {
    return this.isAggregateSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  getAggregateSelectExpressions(): SqlExpression[] {
    if (!this.groupByClause) return [];
    return this.getSelectExpressionsArray().filter((_selectExpression, i) => {
      return this.isAggregateSelectIndex(i);
    });
  }

  getAggregateOutputColumns(): string[] {
    if (!this.groupByClause) return [];
    return filterMap(this.getSelectExpressionsArray(), (selectExpression, i) => {
      if (!this.isAggregateSelectIndex(i)) return;
      return SqlQuery.getSelectExpressionOutput(selectExpression, i);
    });
  }

  private decodeInsertIndex(insertIndex: InsertIndex = 'last'): number {
    const selectExpressionsArray = this.getSelectExpressionsArray();
    if (insertIndex === 'last-grouping') {
      return selectExpressionsArray.reduce<number>((maxSeenGrouping, _, i) => {
        return this.isGroupedSelectIndex(i) ? i + 1 : maxSeenGrouping;
      }, 0);
    } else if (insertIndex === 'last') {
      return selectExpressionsArray.length;
    } else if (typeof insertIndex === 'number') {
      const n = selectExpressionsArray.length;
      return clampIndex(normalizeIndex(insertIndex, n), 0, n);
    } else {
      throw new Error(`unsupported insert index (${insertIndex})`);
    }
  }

  public addSelect(ex: SqlExpression | string, options: AddSelectOptions = {}): this {
    const selectExpression = SqlExpression.parse(ex);
    const { insertIndex, addToGroupBy, addToOrderBy, orderByExpression, direction } = options;
    const idx = this.decodeInsertIndex(insertIndex);

    const selectExpressions =
      this.selectExpressions?.insert(idx, selectExpression) ||
      SeparatedArray.fromSingleValue(selectExpression);

    let groupByClause = this.groupByClause?.shiftIndexes(idx);
    if (addToGroupBy) {
      const indexLiteral = SqlLiteral.index(idx);
      groupByClause = groupByClause
        ? groupByClause.addExpression(indexLiteral, addToGroupBy)
        : SqlGroupByClause.create([indexLiteral]);
    }

    let orderByClause = this.orderByClause?.shiftIndexes(idx);
    if (addToOrderBy) {
      const indexOrderBy = orderByExpression
        ? orderByExpression.changeExpression(SqlLiteral.index(idx))
        : SqlOrderByExpression.index(idx, direction);

      orderByClause = orderByClause
        ? orderByClause.addExpression(indexOrderBy, addToOrderBy)
        : SqlOrderByClause.create([indexOrderBy]);
    }

    return this.changeSelectExpressions(selectExpressions)
      .changeGroupByClause(groupByClause)
      .changeOrderByClause(orderByClause);
  }

  public changeSelect(selectIndex: number, ex: SqlExpression | string): this {
    if (!this.selectExpressions) return this;
    const selectExpression = SqlExpression.parse(ex);
    return this.changeSelectExpressions(
      this.selectExpressions.change(selectIndex, selectExpression),
    );
  }

  public removeSelectIndex(selectIndex: number): this {
    if (!this.selectExpressions) return this;
    const selectExpression = this.getSelectExpressionForIndex(selectIndex);
    if (!selectExpression) return this;

    const newSelectExpressions = this.selectExpressions.remove(selectIndex);

    let ret = this;

    if (this.groupByClause) {
      ret = ret.changeGroupByClause(
        this.groupByClause.removeExpression(selectExpression, selectIndex),
      );
    }

    if (this.orderByClause) {
      ret = ret.changeOrderByClause(
        this.orderByClause.removeExpression(selectExpression, selectIndex),
      );
    }

    return ret.changeSelectExpressions(newSelectExpressions);
  }

  public removeSelectIndexes(selectIndexes: number[]): this {
    return this.applyForEach(
      selectIndexes.slice().sort((a, b) => b - a),
      (a, idx) => a.removeSelectIndex(idx),
    );
  }

  public removeOutputColumn(outputColumn: string) {
    return this.removeSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  /* ~~~~~ FROM ~~~~~ */

  public hasFrom(): boolean {
    return Boolean(this.fromClause);
  }

  public getFromExpressions(): readonly SqlExpression[] {
    if (!this.fromClause) return [];
    return this.fromClause.expressions.values;
  }

  public getFirstFromExpression(): SqlExpression | undefined {
    if (!this.fromClause) return;
    return this.fromClause.expressions.first();
  }

  public getFirstTableName(): string | undefined {
    if (!this.fromClause) return;
    return this.fromClause.getFirstTableName();
  }

  // returns the first table namespace
  public getFirstSchema(): string | undefined {
    if (!this.fromClause) return;
    return this.fromClause.getFirstSchema();
  }

  public hasJoin(): boolean {
    if (!this.fromClause) return false;
    return this.fromClause.hasJoin();
  }

  public getJoins(): readonly SqlJoinPart[] {
    if (!this.fromClause) return [];
    return this.fromClause.getJoins();
  }

  public addJoin(join: SqlJoinPart) {
    if (!this.fromClause) return this;
    return this.changeFromClause(this.fromClause.addJoin(join));
  }

  public addLeftJoin(table: SqlExpression, onExpression: SqlExpression | SqlExpression[]) {
    return this.addJoin(SqlJoinPart.create('LEFT', table, onExpression));
  }

  public addRightJoin(table: SqlExpression, onExpression: SqlExpression | SqlExpression[]) {
    return this.addJoin(SqlJoinPart.create('RIGHT', table, onExpression));
  }

  public addInnerJoin(table: SqlExpression, onExpression: SqlExpression | SqlExpression[]) {
    return this.addJoin(SqlJoinPart.create('INNER', table, onExpression));
  }

  public addFullJoin(table: SqlExpression, onExpression: SqlExpression | SqlExpression[]) {
    return this.addJoin(SqlJoinPart.create('FULL', table, onExpression));
  }

  public addCrossJoin(table: SqlExpression) {
    return this.addJoin(SqlJoinPart.cross(table));
  }

  public removeAllJoins() {
    if (!this.fromClause) return this;
    return this.changeFromClause(this.fromClause.changeJoinParts(undefined));
  }

  /* ~~~~~ WHERE ~~~~~ */

  public hasWhere(): boolean {
    return Boolean(this.whereClause);
  }

  public getWhereExpression(): SqlExpression | undefined {
    if (!this.whereClause) return;
    return this.whereClause.expression;
  }

  public getEffectiveWhereExpression(): SqlExpression {
    if (!this.whereClause) return SqlLiteral.TRUE;
    return this.whereClause.expression;
  }

  public addWhere(ex: SqlExpression | string) {
    const expression = SqlExpression.parse(ex);
    return this.changeWhereExpression(SqlExpression.and(this.getWhereExpression(), expression));
  }

  // Removes all filters on the specified column from the where clause
  public removeColumnFromWhere(column: string) {
    if (!this.whereClause) return this;
    return this.changeWhereClause(this.whereClause.removeColumnFromAnd(column));
  }

  /* ~~~~~ GROUP BY ~~~~~ */

  public hasGroupBy(): boolean {
    return Boolean(this.groupByClause);
  }

  public getGroupingExpressionInfos(): ExpressionInfo[] {
    const { groupByClause } = this;
    if (!groupByClause) return [];

    return groupByClause.toArray().map(ex => {
      const selectIndex = this.getSelectIndexForExpression(ex, true);
      if (selectIndex === -1) {
        return {
          expression: ex,
          selectIndex,
          orderByExpression: this.getOrderByForExpression(ex),
        };
      } else {
        const selectExpression = this.getSelectExpressionForIndex(selectIndex)!;
        return {
          expression: selectExpression.getUnderlyingExpression(),
          selectIndex,
          outputColumn: SqlQuery.getSelectExpressionOutput(selectExpression, selectIndex),
          orderByExpression: this.getOrderByForSelectIndex(selectIndex),
        };
      }
    });
  }

  public getGroupingExpressions(): SqlExpression[] {
    return this.getGroupingExpressionInfos().map(info => info.expression);
  }

  public addGroupBy(expression: SqlExpression | string) {
    const ex = SqlExpression.parse(expression);
    return this.changeGroupByClause(
      this.groupByClause ? this.groupByClause.addExpression(ex) : SqlGroupByClause.create([ex]),
    );
  }

  /* ~~~~~ HAVING ~~~~~ */

  public hasHaving(): boolean {
    return Boolean(this.havingClause);
  }

  public getHavingExpression(): SqlExpression | undefined {
    if (!this.havingClause) return;
    return this.havingClause.expression;
  }

  public getEffectiveHavingExpression(): SqlExpression {
    if (!this.havingClause) return SqlLiteral.TRUE;
    return this.havingClause.expression;
  }

  public addHaving(ex: SqlExpression | string) {
    const expression = SqlExpression.parse(ex);
    return this.changeHavingExpression(SqlExpression.and(this.getHavingExpression(), expression));
  }

  public removeFromHaving(column: string) {
    if (!this.havingClause) return this;
    return this.changeHavingClause(this.havingClause.removeColumnFromAnd(column));
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

  public getOrderByForSelectIndex(selectIndex: number): SqlOrderByExpression | undefined {
    if (!this.orderByClause || !this.isValidSelectIndex(selectIndex)) return;
    return this.orderByClause
      .toArray()
      .find(orderByExpression =>
        this.expressionRefersToSelectIndex(orderByExpression.expression, selectIndex, true),
      );
  }

  public getOrderByForExpression(ex: SqlExpression): SqlOrderByExpression | undefined {
    if (!this.orderByClause) return;
    return this.orderByClause.toArray().find(orderByExpression => {
      return orderByExpression.expression.equals(ex);
    });
  }

  public getOrderByForOutputColumn(outputColumn: string): SqlOrderByExpression | undefined {
    return this.getOrderByForSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  public getOrderedSelectExpressions() {
    if (!this.orderByClause) return [];
    return this.getSelectExpressionsArray().filter((_selectExpression, i) => {
      return this.getOrderByForSelectIndex(i);
    });
  }

  public getOrderedOutputColumns() {
    if (!this.orderByClause) return [];
    return filterMap(this.getSelectExpressionsArray(), (selectExpression, i) => {
      if (!this.getOrderByForSelectIndex(i)) return;
      return SqlQuery.getSelectExpressionOutput(selectExpression, i);
    });
  }

  public removeOrderByForSelectIndex(selectIndex: number): this {
    if (!this.orderByClause || !this.isValidSelectIndex(selectIndex)) return this;
    return this.changeOrderByExpressions(
      this.orderByClause.expressions.filter(orderByExpression =>
        this.expressionRefersToSelectIndex(orderByExpression.expression, selectIndex, true),
      ),
    );
  }

  public removeOrderByForOutputColumn(outputColumn: string) {
    return this.removeOrderByForSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
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

SqlBase.register(SqlQuery);
