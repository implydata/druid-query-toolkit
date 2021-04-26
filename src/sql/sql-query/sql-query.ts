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

  public clearOwnSeparators(): this {
    const value = this.valueOf();

    if (this.withParts) {
      value.withParts = this.withParts.clearSeparators();
    }

    value.selectExpressions = this.selectExpressions.clearSeparators();

    return SqlBase.fromValue(value);
  }

  /* ~~~~~ EXPLAIN ~~~~~ */

  makeExplain(): SqlQuery {
    const value = this.valueOf();
    value.explainPlanFor = true;
    return SqlBase.fromValue(value);
  }

  /* ~~~~~ WITH ~~~~~ */

  prependWith(name: string, query: SqlQuery): SqlQuery {
    const { withParts } = this;
    const withPart = SqlWithPart.simple(name, query.ensureParens());
    return this.changeWithParts(withParts ? withParts.prepend(withPart) : [withPart]);
  }

  /* ~~~~~ SELECT ~~~~~ */

  isValidSelectIndex(selectIndex: number): boolean {
    return selectIndex >= 0 && selectIndex < this.selectExpressions.length();
  }

  getAllSelectExpressions(): readonly SqlAlias[] {
    return this.selectExpressions.values;
  }

  getSelectExpressionForIndex(selectIndex: number): SqlAlias | undefined {
    return this.selectExpressions.get(selectIndex);
  }

  hasStarInSelect(): boolean {
    return this.selectExpressions.values.some(v => v.isStar());
  }

  getOutputColumns(): string[] {
    return this.selectExpressions.values.map(SqlQuery.getSelectExpressionOutput);
  }

  getSelectIndexForColumn(column: string): number {
    return this.selectExpressions.values.findIndex(selectExpression => {
      return selectExpression.containsColumn(column);
    });
  }

  getSelectIndexForOutputColumn(outputColumn: string): number {
    return this.selectExpressions.values.findIndex((selectExpression, i) => {
      return SqlQuery.getSelectExpressionOutput(selectExpression, i) === outputColumn;
    });
  }

  getSelectIndexForExpression(ex: SqlExpression, allowAliasReferences: boolean): number {
    const { selectExpressions } = this;

    if (ex instanceof SqlLiteral && ex.isInteger()) {
      const idx = Number(ex.value) - 1;
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

  isRealOutputColumnAtSelectIndex(selectIndex: number): boolean {
    const selectExpression = this.getSelectExpressionForIndex(selectIndex);
    if (!selectExpression) return false;
    return Boolean(selectExpression.getOutputName());
  }

  isGroupedSelectIndex(selectIndex: number): boolean {
    const { groupByClause } = this;
    if (!groupByClause || !this.isValidSelectIndex(selectIndex)) return false;
    return groupByClause.toArray().some(groupByClause => {
      return this.getSelectIndexForExpression(groupByClause, false) === selectIndex;
    });
  }

  isGroupedOutputColumn(outputColumn: string): boolean {
    return this.isGroupedSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  getGroupedSelectExpressions(): SqlAlias[] {
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

  addSelectExpression(ex: SqlBase | string, first = false) {
    const alias = SqlAlias.fromBase(typeof ex === 'string' ? SqlBase.parseSql(ex) : ex);

    if (first) {
      return this.changeSelectExpressions(this.selectExpressions.prepend(alias));
    } else {
      return this.changeSelectExpressions(this.selectExpressions.append(alias));
    }
  }

  removeSelectIndex(selectIndex: number) {
    const selectExpression = this.getSelectExpressionForIndex(selectIndex);
    if (!selectExpression) return this;

    const newSelectExpressions = this.selectExpressions.deleteByIndex(selectIndex);
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

  removeOutputColumn(outputColumn: string) {
    return this.removeSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  /* ~~~~~ FROM ~~~~~ */

  hasFrom(): boolean {
    return Boolean(this.fromClause);
  }

  getFromExpressions(): readonly SqlAlias[] {
    if (!this.fromClause) return [];
    return this.fromClause.expressions.values;
  }

  getFirstFromExpression(): SqlAlias | undefined {
    if (!this.fromClause) return;
    return this.fromClause.expressions.first();
  }

  getFirstTableName(): string | undefined {
    if (!this.fromClause) return;
    return this.fromClause.getFirstTableName();
  }

  // returns the first table namespace
  getFirstSchema(): string | undefined {
    if (!this.fromClause) return;
    return this.fromClause.getFirstSchema();
  }

  hasJoin(): boolean {
    if (!this.fromClause) return false;
    return this.fromClause.hasJoin();
  }

  getJoins(): readonly SqlJoinPart[] {
    if (!this.fromClause) return [];
    return this.fromClause.getJoins();
  }

  addJoin(join: SqlJoinPart) {
    if (!this.fromClause) return this;
    return this.changeFromClause(this.fromClause.addJoin(join));
  }

  removeAllJoins() {
    if (!this.fromClause) return this;
    return this.changeFromClause(this.fromClause.changeJoinParts(undefined));
  }

  /* ~~~~~ WHERE ~~~~~ */

  hasWhere(): boolean {
    return Boolean(this.whereClause);
  }

  getWhereExpression(): SqlExpression | undefined {
    if (!this.whereClause) return;
    return this.whereClause.expression;
  }

  getEffectiveWhereExpression(): SqlExpression {
    if (!this.whereClause) return SqlLiteral.TRUE;
    return this.whereClause.expression;
  }

  addToWhere(expressionThing: SqlExpression | string) {
    const expression = SqlExpression.parse(expressionThing);
    return this.changeWhereExpression(SqlExpression.and(this.getWhereExpression(), expression));
  }

  // Removes all filters on the specified column from the where clause
  removeColumnFromWhere(column: string) {
    if (!this.whereClause) return this;
    return this.changeWhereClause(this.whereClause.removeColumnFromAnd(column));
  }

  /* ~~~~~ GROUP BY ~~~~~ */

  hasGroupBy(): boolean {
    return Boolean(this.groupByClause);
  }

  addToGroupBy(column: SqlBase) {
    // Adds a column with no alias to the group by clause
    // column is added to the select clause then the index is added to group by clause
    return this.addSelectExpression(column, true).addFirstColumnToGroupBy();
  }

  addFirstColumnToGroupBy() {
    // Adds the last column in the select clause to the group by clause via its index
    const newGroupBy = SqlLiteral.create(1);
    return this.changeGroupByExpressions(
      this.groupByClause && this.groupByClause.expressions
        ? this.groupByClause.expressions
            .map(groupByExpression => {
              if (groupByExpression instanceof SqlLiteral) {
                return groupByExpression.increment() || groupByExpression;
              }
              return groupByExpression;
            })
            .prepend(newGroupBy)
        : SeparatedArray.fromSingleValue(newGroupBy),
    );
  }

  /* ~~~~~ HAVING ~~~~~ */

  hasHaving(): boolean {
    return Boolean(this.havingClause);
  }

  getHavingExpression(): SqlExpression | undefined {
    if (!this.havingClause) return;
    return this.havingClause.expression;
  }

  getEffectiveHavingExpression(): SqlExpression {
    if (!this.havingClause) return SqlLiteral.TRUE;
    return this.havingClause.expression;
  }

  addToHaving(expressionThing: SqlExpression | string) {
    const expression = SqlExpression.parse(expressionThing);
    return this.changeHavingExpression(SqlExpression.and(this.getHavingExpression(), expression));
  }

  removeFromHaving(column: string) {
    if (!this.havingClause) return this;
    return this.changeHavingClause(this.havingClause.removeColumnFromAnd(column));
  }

  /* ~~~~~ ORDER BY ~~~~~ */

  hasOrderBy(): boolean {
    return Boolean(this.orderByClause);
  }

  getOrderByForSelectIndex(selectIndex: number): SqlOrderByExpression | undefined {
    if (!this.orderByClause || !this.isValidSelectIndex(selectIndex)) return;
    return this.orderByClause.toArray().find(orderByExpression => {
      return this.getSelectIndexForExpression(orderByExpression.expression, true) === selectIndex;
    });
  }

  getOrderByForOutputColumn(outputColumn: string): SqlOrderByExpression | undefined {
    return this.getOrderByForSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  getOrderedSelectExpressions() {
    if (!this.orderByClause) return [];
    return this.selectExpressions.values.filter((_selectExpression, i) => {
      return this.getOrderByForSelectIndex(i);
    });
  }

  getOrderedOutputColumns() {
    if (!this.orderByClause) return [];
    return filterMap(this.selectExpressions.values, (selectExpression, i) => {
      if (!this.getOrderByForSelectIndex(i)) return;
      return SqlQuery.getSelectExpressionOutput(selectExpression, i);
    });
  }

  removeOrderByForSelectIndex(selectIndex: number): SqlQuery {
    if (!this.orderByClause || !this.isValidSelectIndex(selectIndex)) return this;
    return this.changeOrderByExpressions(
      this.orderByClause.expressions.filter(orderByExpression => {
        return this.getSelectIndexForExpression(orderByExpression.expression, true) === selectIndex;
      }),
    );
  }

  removeOrderByForOutputColumn(outputColumn: string) {
    return this.removeOrderByForSelectIndex(this.getSelectIndexForOutputColumn(outputColumn));
  }

  addOrderBy(orderBy: SqlOrderByExpression): SqlQuery {
    return this.changeOrderByClause(
      this.orderByClause ? this.orderByClause.addFirst(orderBy) : SqlOrderByClause.create(orderBy),
    );
  }

  /* ~~~~~ LIMIT ~~~~~ */

  hasLimit(): boolean {
    return Boolean(this.limitClause);
  }

  /* ~~~~~ OFFSET ~~~~~ */

  hasOffset(): boolean {
    return Boolean(this.offsetClause);
  }
}

SqlBase.register(SqlQuery);
