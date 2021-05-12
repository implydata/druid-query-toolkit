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
import {
  clampIndex,
  normalizeIndex,
  SeparatedArray,
  Separator,
  SqlAlias,
  SqlExpression,
  SqlFromClause,
  SqlGroupByClause,
  SqlHavingClause,
  SqlLimitClause,
  SqlLiteral,
  SqlOffsetClause,
  SqlOrderByClause,
  SqlOrderByDirection,
  SqlRef,
  SqlWhereClause,
  Substitutor,
} from '..';
import { parseSql } from '../parser';
import { SqlBase, SqlBaseValue, SqlType } from '../sql-base';

import { SqlJoinPart } from './sql-join-part/sql-join-part';
import { SqlOrderByExpression } from './sql-order-by-expression/sql-order-by-expression';
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
  selectExpressions: SeparatedArray<SqlAlias>;

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

  static create(from: SqlBase): SqlQuery {
    return new SqlQuery({
      selectExpressions: SeparatedArray.fromSingleValue(SqlAlias.STAR),
      fromClause:
        from instanceof SqlFromClause
          ? from
          : SqlFromClause.create(SeparatedArray.fromSingleValue(SqlAlias.fromBaseAndUpgrade(from))),
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

  static getSelectExpressionOutput(selectExpression: SqlAlias, i: number) {
    return selectExpression.getOutputName() || `EXPR$${i}`;
  }

  static isPhonyOutputName(name: string) {
    return /^EXPR\$(?:\d|[1-9]\d*)$/.test(name);
  }

  public readonly explainPlanFor?: boolean;
  public readonly withParts?: SeparatedArray<SqlWithPart>;
  public readonly decorator?: SqlQueryDecorator;
  public readonly selectExpressions: SeparatedArray<SqlAlias>;
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
    const rawParts: string[] = [this.getSpace('preQuery', '')];

    // Explain clause
    if (this.explainPlanFor) {
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
    if (this.withParts) {
      rawParts.push(
        this.getKeyword('with', SqlQuery.DEFAULT_WITH_KEYWORD),
        this.getSpace('postWith', INDENT_SPACE),
        this.withParts.toString(INDENT_SPACE),
        this.getSpace('postWithParts', '\n'),
      );
    }

    const indentSpace = this.selectExpressions.length() > 1 ? INDENT_SPACE : ' ';

    // SELECT clause
    rawParts.push(
      this.getKeyword('select', SqlQuery.DEFAULT_SELECT_KEYWORD),
      this.getSpace('postSelect', this.decorator ? ' ' : indentSpace),
    );
    if (this.decorator) {
      rawParts.push(
        this.getKeyword('decorator', this.decorator),
        this.getSpace('postDecorator', indentSpace),
      );
    }

    rawParts.push(
      this.selectExpressions.toString(new Separator({ separator: ',', right: indentSpace })),
    );

    if (this.fromClause) {
      rawParts.push(this.getSpace('preFrom', '\n'), this.fromClause.toString());
    }

    if (this.whereClause) {
      rawParts.push(this.getSpace('preWhere', '\n'), this.whereClause.toString());
    }

    if (this.groupByClause) {
      rawParts.push(this.getSpace('preGroupBy', '\n'), this.groupByClause.toString());
    }

    if (this.havingClause) {
      rawParts.push(this.getSpace('preHaving', '\n'), this.havingClause.toString());
    }

    if (this.orderByClause) {
      rawParts.push(this.getSpace('preOrderBy', '\n'), this.orderByClause.toString());
    }

    if (this.limitClause) {
      rawParts.push(this.getSpace('preLimit', '\n'), this.limitClause.toString());
    }

    if (this.offsetClause) {
      rawParts.push(this.getSpace('preOffset', '\n'), this.offsetClause.toString());
    }

    if (this.unionQuery) {
      rawParts.push(
        this.getSpace('preUnion', '\n'),
        this.getKeyword('union', SqlQuery.DEFAULT_UNION_KEYWORD),
        this.getSpace('postUnion'),
        this.unionQuery.toString(),
      );
    }

    rawParts.push(this.getSpace('postQuery', ''));

    return rawParts.join('');
  }

  public changeWithParts(
    withParts: SeparatedArray<SqlWithPart> | SqlWithPart[] | undefined,
  ): SqlQuery {
    const value = this.valueOf();
    if (withParts) {
      value.withParts = SeparatedArray.fromArray(withParts);
    } else {
      delete value.withParts;
      value.keywords = this.getKeywordsWithout('with');
      value.spacing = this.getSpacingWithout('postWith', 'postWithParts');
    }
    return new SqlQuery(value);
  }

  public changeSelectExpressions(
    selectExpressions: SeparatedArray<SqlAlias> | SqlAlias[],
  ): SqlQuery {
    const value = this.valueOf();
    value.selectExpressions = SeparatedArray.fromArray(selectExpressions);
    return new SqlQuery(value);
  }

  public changeFromClause(fromClause: SqlFromClause | undefined): SqlQuery {
    if (this.fromClause === fromClause) return this;
    const value = this.valueOf();
    if (fromClause) {
      value.fromClause = fromClause;
    } else {
      delete value.fromClause;
      value.spacing = this.getSpacingWithout('preFrom');
    }
    return new SqlQuery(value);
  }

  public changeFromExpressions(
    fromExpressions: SeparatedArray<SqlAlias> | SqlAlias[] | undefined,
  ): SqlQuery {
    if (!fromExpressions) return this.changeFromClause(undefined);
    return this.changeFromClause(
      this.fromClause
        ? this.fromClause.changeExpressions(fromExpressions)
        : SqlFromClause.create(fromExpressions),
    );
  }

  public changeWhereClause(whereClause: SqlWhereClause | undefined): SqlQuery {
    if (this.whereClause === whereClause) return this;
    const value = this.valueOf();
    if (whereClause) {
      value.whereClause = whereClause;
    } else {
      delete value.whereClause;
      value.spacing = this.getSpacingWithout('preWhere');
    }
    return new SqlQuery(value);
  }

  public changeWhereExpression(whereExpression: SqlExpression | string | undefined): SqlQuery {
    if (!whereExpression) return this.changeWhereClause(undefined);
    return this.changeWhereClause(
      this.whereClause
        ? this.whereClause.changeExpression(whereExpression)
        : SqlWhereClause.create(whereExpression),
    );
  }

  public changeGroupByClause(groupByClause: SqlGroupByClause | undefined): SqlQuery {
    if (this.groupByClause === groupByClause) return this;
    const value = this.valueOf();
    if (groupByClause) {
      value.groupByClause = groupByClause;
    } else {
      delete value.groupByClause;
      value.spacing = this.getSpacingWithout('preGroupBy');
    }
    return new SqlQuery(value);
  }

  public changeGroupByExpressions(
    groupByExpressions: SeparatedArray<SqlExpression> | SqlExpression[] | undefined,
  ): SqlQuery {
    if (typeof groupByExpressions === 'undefined') return this.changeGroupByClause(undefined);
    return this.changeGroupByClause(
      this.groupByClause
        ? this.groupByClause.changeExpressions(groupByExpressions)
        : SqlGroupByClause.create(groupByExpressions),
    );
  }

  public changeHavingClause(havingClause: SqlHavingClause | undefined): SqlQuery {
    if (this.havingClause === havingClause) return this;
    const value = this.valueOf();
    if (havingClause) {
      value.havingClause = havingClause;
    } else {
      delete value.havingClause;
      value.spacing = this.getSpacingWithout('preHaving');
    }
    return new SqlQuery(value);
  }

  public changeHavingExpression(havingExpression: SqlExpression | string | undefined): SqlQuery {
    if (!havingExpression) return this.changeHavingClause(undefined);
    return this.changeHavingClause(
      this.havingClause
        ? this.havingClause.changeExpression(havingExpression)
        : SqlHavingClause.create(havingExpression),
    );
  }

  public changeOrderByClause(orderByClause: SqlOrderByClause | undefined): SqlQuery {
    if (this.orderByClause === orderByClause) return this;
    const value = this.valueOf();
    if (orderByClause) {
      value.orderByClause = orderByClause;
    } else {
      delete value.orderByClause;
      value.spacing = this.getSpacingWithout('preOrderBy');
    }
    return new SqlQuery(value);
  }

  public changeOrderByExpressions(
    orderByExpressions: SeparatedArray<SqlOrderByExpression> | SqlOrderByExpression[] | undefined,
  ): SqlQuery {
    if (!orderByExpressions) return this.changeOrderByClause(undefined);
    return this.changeOrderByClause(
      this.orderByClause
        ? this.orderByClause.changeExpressions(orderByExpressions)
        : SqlOrderByClause.create(orderByExpressions),
    );
  }

  public changeOrderByExpression(orderByExpression: SqlOrderByExpression | undefined): SqlQuery {
    if (!orderByExpression) return this.changeOrderByClause(undefined);
    return this.changeOrderByExpressions([orderByExpression]);
  }

  public changeLimitClause(limitClause: SqlLimitClause | undefined): SqlQuery {
    if (this.limitClause === limitClause) return this;
    const value = this.valueOf();
    if (limitClause) {
      value.limitClause = limitClause;
    } else {
      delete value.limitClause;
      value.spacing = this.getSpacingWithout('preLimit');
    }
    return new SqlQuery(value);
  }

  public changeLimitValue(limitValue: SqlLiteral | number | undefined): SqlQuery {
    if (typeof limitValue === 'undefined') return this.changeLimitClause(undefined);
    return this.changeLimitClause(
      this.limitClause
        ? this.limitClause.changeLimit(limitValue)
        : SqlLimitClause.create(limitValue),
    );
  }

  public changeOffsetClause(offsetClause: SqlOffsetClause | undefined): SqlQuery {
    if (this.offsetClause === offsetClause) return this;
    const value = this.valueOf();
    if (offsetClause) {
      value.offsetClause = offsetClause;
    } else {
      delete value.offsetClause;
      value.spacing = this.getSpacingWithout('preOffset');
    }
    return new SqlQuery(value);
  }

  public changeOffsetValue(offsetValue: SqlLiteral | number | undefined): SqlQuery {
    if (typeof offsetValue === 'undefined') return this.changeOffsetClause(undefined);
    return this.changeOffsetClause(
      this.offsetClause
        ? this.offsetClause.changeOffset(offsetValue)
        : SqlOffsetClause.create(offsetValue),
    );
  }

  public changeUnionQuery(unionQuery: SqlQuery | undefined): SqlQuery {
    const value = this.valueOf();
    if (typeof unionQuery === 'undefined') {
      delete value.unionQuery;
      value.spacing = this.getSpacingWithout('preUnion', 'postUnion');
      value.keywords = this.getKeywordsWithout('union');
    } else {
      value.unionQuery = unionQuery;
    }
    return new SqlQuery(value);
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

    if (this.withParts) {
      value.withParts = this.withParts.clearSeparators();
    }

    value.selectExpressions = this.selectExpressions.clearSeparators();

    return SqlBase.fromValue(value);
  }

  /* ~~~~~ EXPLAIN ~~~~~ */

  public makeExplain(): SqlQuery {
    const value = this.valueOf();
    value.explainPlanFor = true;
    return SqlBase.fromValue(value);
  }

  /* ~~~~~ WITH ~~~~~ */

  public prependWith(name: string, query: SqlQuery): SqlQuery {
    const { withParts } = this;
    const withPart = SqlWithPart.simple(name, query.ensureParens());
    return this.changeWithParts(withParts ? withParts.prepend(withPart) : [withPart]);
  }

  /* ~~~~~ SELECT ~~~~~ */

  public isValidSelectIndex(selectIndex: number): boolean {
    return 0 <= selectIndex && selectIndex < this.selectExpressions.length();
  }

  public getAllSelectExpressions(): readonly SqlAlias[] {
    return this.selectExpressions.values;
  }

  public getSelectExpressionForIndex(selectIndex: number): SqlAlias | undefined {
    return this.selectExpressions.get(selectIndex);
  }

  public hasStarInSelect(): boolean {
    return this.selectExpressions.values.some(v => v.isStar());
  }

  public getOutputColumns(): string[] {
    return this.selectExpressions.values.map(SqlQuery.getSelectExpressionOutput);
  }

  public getSelectIndexesForColumn(column: string): number[] {
    return filterMap(this.selectExpressions.values, (selectExpression, i) => {
      return selectExpression.containsColumn(column) ? i : undefined;
    });
  }

  public getSelectIndexForOutputColumn(outputColumn: string): number {
    return this.selectExpressions.values.findIndex((selectExpression, i) => {
      return SqlQuery.getSelectExpressionOutput(selectExpression, i) === outputColumn;
    });
  }

  private expressionReferrsToSelectIndex(
    ex: SqlExpression,
    selectIndex: number,
    allowAliasReferences: boolean,
  ): boolean {
    const { selectExpressions } = this;
    const selectExpression = selectExpressions.get(selectIndex);
    if (!selectExpression) return false;

    if (ex instanceof SqlLiteral && ex.isIndex()) {
      return selectIndex === ex.getIndexValue();
    }

    if (allowAliasReferences && ex instanceof SqlRef && ex.column) {
      return selectExpression.getOutputName() === ex.column;
    }

    return ex.equals(selectExpression.expression);
  }

  public getSelectIndexForExpression(ex: SqlExpression, allowAliasReferences: boolean): number {
    const { selectExpressions } = this;

    if (ex instanceof SqlLiteral && ex.isIndex()) {
      const idx = ex.getIndexValue();
      return this.isValidSelectIndex(idx) ? idx : -1;
    }

    if (allowAliasReferences && ex instanceof SqlRef) {
      const refIdx = selectExpressions.values.findIndex((selectExpression, i) => {
        return SqlQuery.getSelectExpressionOutput(selectExpression, i) === ex.column;
      });
      if (refIdx !== -1) {
        return refIdx;
      }
    }

    return selectExpressions.values.findIndex(selectExpression => {
      return ex.equals(selectExpression.expression);
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
      .some(ex => this.expressionReferrsToSelectIndex(ex, selectIndex, false));
  }

  public isGroupedOutputColumn(outputColumn: string): boolean {
    return this.isGroupedSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  public getGroupedSelectExpressions(): SqlAlias[] {
    if (!this.hasGroupBy()) return [];
    return this.selectExpressions.values.filter((_selectExpression, i) => {
      return this.isGroupedSelectIndex(i);
    });
  }

  getGroupedOutputColumns(): string[] {
    if (!this.hasGroupBy()) return [];
    return filterMap(this.selectExpressions.values, (selectExpression, i) => {
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

  getAggregateSelectExpressions(): SqlAlias[] {
    if (!this.groupByClause) return [];
    return this.selectExpressions.values.filter((_selectExpression, i) => {
      return this.isAggregateSelectIndex(i);
    });
  }

  getAggregateOutputColumns(): string[] {
    if (!this.groupByClause) return [];
    return filterMap(this.selectExpressions.values, (selectExpression, i) => {
      if (!this.isAggregateSelectIndex(i)) return;
      return SqlQuery.getSelectExpressionOutput(selectExpression, i);
    });
  }

  private decodeInsertIndex(insertIndex: InsertIndex = 'last'): number {
    const { selectExpressions } = this;
    if (insertIndex === 'last-grouping') {
      return selectExpressions.values.reduce<number>((maxSeenGrouping, _, i) => {
        return this.isGroupedSelectIndex(i) ? i + 1 : maxSeenGrouping;
      }, 0);
    } else if (insertIndex === 'last') {
      return selectExpressions.length();
    } else if (typeof insertIndex === 'number') {
      const n = selectExpressions.length();
      return clampIndex(normalizeIndex(insertIndex, n), 0, n);
    } else {
      throw new Error(`unsupported insert index (${insertIndex})`);
    }
  }

  public addSelect(ex: SqlBase | string, options: AddSelectOptions = {}) {
    const alias = SqlAlias.fromBase(typeof ex === 'string' ? SqlBase.parseSql(ex) : ex);
    const { insertIndex, addToGroupBy, addToOrderBy, orderByExpression, direction } = options;
    const idx = this.decodeInsertIndex(insertIndex);

    const selectExpressions = this.selectExpressions.insert(idx, alias);

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

  public removeSelectIndex(selectIndex: number) {
    const selectExpression = this.getSelectExpressionForIndex(selectIndex);
    if (!selectExpression) return this;

    const newSelectExpressions = this.selectExpressions.remove(selectIndex);
    if (!newSelectExpressions) return this; // Can not remove the last column

    let ret: SqlQuery = this;

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

  public removeSelectIndexes(selectIndexes: number[]): SqlQuery {
    return selectIndexes
      .sort((a, b) => b - a)
      .reduce<SqlQuery>((a, idx) => a.removeSelectIndex(idx), this);
  }

  public removeOutputColumn(outputColumn: string) {
    return this.removeSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  /* ~~~~~ FROM ~~~~~ */

  public hasFrom(): boolean {
    return Boolean(this.fromClause);
  }

  public getFromExpressions(): readonly SqlAlias[] {
    if (!this.fromClause) return [];
    return this.fromClause.expressions.values;
  }

  public getFirstFromExpression(): SqlAlias | undefined {
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

  public addLeftJoin(table: SqlBase, onExpression: SqlExpression | SqlExpression[]) {
    return this.addJoin(SqlJoinPart.create('LEFT', table, onExpression));
  }

  public addRightJoin(table: SqlBase, onExpression: SqlExpression | SqlExpression[]) {
    return this.addJoin(SqlJoinPart.create('RIGHT', table, onExpression));
  }

  public addInnerJoin(table: SqlBase, onExpression: SqlExpression | SqlExpression[]) {
    return this.addJoin(SqlJoinPart.create('INNER', table, onExpression));
  }

  public addFullJoin(table: SqlBase, onExpression: SqlExpression | SqlExpression[]) {
    return this.addJoin(SqlJoinPart.create('FULL', table, onExpression));
  }

  public addCrossJoin(table: SqlBase) {
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
        const selectExpression = this.selectExpressions.get(selectIndex)!;
        return {
          expression: selectExpression.expression as SqlExpression,
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
        this.expressionReferrsToSelectIndex(orderByExpression.expression, selectIndex, true),
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
    return this.selectExpressions.values.filter((_selectExpression, i) => {
      return this.getOrderByForSelectIndex(i);
    });
  }

  public getOrderedOutputColumns() {
    if (!this.orderByClause) return [];
    return filterMap(this.selectExpressions.values, (selectExpression, i) => {
      if (!this.getOrderByForSelectIndex(i)) return;
      return SqlQuery.getSelectExpressionOutput(selectExpression, i);
    });
  }

  public removeOrderByForSelectIndex(selectIndex: number): SqlQuery {
    if (!this.orderByClause || !this.isValidSelectIndex(selectIndex)) return this;
    return this.changeOrderByExpressions(
      this.orderByClause.expressions.filter(orderByExpression =>
        this.expressionReferrsToSelectIndex(orderByExpression.expression, selectIndex, true),
      ),
    );
  }

  public removeOrderByForOutputColumn(outputColumn: string) {
    return this.removeOrderByForSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  public addOrderBy(orderBy: SqlOrderByExpression): SqlQuery {
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
