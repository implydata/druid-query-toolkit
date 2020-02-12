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

import { Separator, SqlAliasRef, SqlLiteral } from '../index';
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlQueryValue extends SqlBaseValue {
  explainKeyword?: string;
  withKeyword?: string;
  withUnits?: WithUnit[];
  withSeparators?: Separator[];
  AsKeyword?: string;
  withQuery?: SqlQuery;
  selectKeyword?: string;
  selectDecorator?: string;
  selectValues?: SqlBase[];
  selectSeparators?: Separator[];
  fromKeyword?: string;
  table?: SqlAliasRef;
  whereKeyword?: string;
  whereExpression?: SqlBase;
  groupByKeyword?: string;
  groupByExpression?: SqlBase[];
  groupByExpressionSeparators?: Separator[];
  havingKeyword?: string;
  havingExpression?: SqlBase;
  orderByKeyword?: string;
  orderByUnits?: OrderByUnit[];
  orderBySeparators?: Separator[];
  limitKeyword?: string;
  limitValue?: SqlLiteral;
  unionKeyword?: string;
  unionQuery?: SqlQuery;
}

export interface WithUnit {
  withTableName: string;
  postWithTable: SqlBase;
  postLeftParen: string;
  withColumns: SqlBase[];
  withColumnsSeparators: Separator[];
  preRightParen: string;
  postWithColumns: string;
  AsKeyword: string;
  postAs: string;
  withQuery: SqlQuery;
}

export interface OrderByUnit {
  expression: SqlBase;
  postExpression: string;
  direction: 'ASC' | 'DESC';
}
export class SqlQuery extends SqlBase {
  public explainKeyword?: string;
  public withKeyword?: string;
  public withUnits?: WithUnit[];
  public withSeparators?: Separator[];
  public AsKeyword?: string;
  public selectKeyword?: string;
  public selectDecorator?: string;
  public selectValues: SqlBase[];
  public selectSeparators?: Separator[];
  public fromKeyword?: string;
  public table?: SqlAliasRef;
  public whereKeyword?: string;
  public whereExpression?: SqlBase;
  public groupByKeyword?: string;
  public groupByExpression?: SqlBase[];
  public groupByExpressionSeparators?: Separator[];
  public havingKeyword?: string;
  public havingExpression?: SqlBase;
  public orderByKeyword?: string;
  public orderByUnits?: OrderByUnit[];
  public orderBySeparators?: Separator[];
  public limitKeyword?: string;
  public limitValue?: SqlLiteral;
  public unionKeyword?: string;
  public unionQuery?: SqlQuery;

  static withUnitToString(unit: WithUnit): string {
    let rawString = unit.withTableName.toString() + unit.postWithTable;

    if (unit.withColumns) {
      rawString +=
        '(' +
        unit.postLeftParen +
        Separator.spacilator(unit.withColumns, unit.withColumnsSeparators) +
        unit.preRightParen +
        ')' +
        unit.postWithColumns;
    }
    rawString += unit.AsKeyword + unit.postAs + unit.withQuery.toString();
    return rawString;
  }

  constructor(options: SqlQueryValue) {
    super(options, 'query');

    this.explainKeyword = options.explainKeyword;
    this.withKeyword = options.withKeyword;
    this.withUnits = options.withUnits;
    this.withSeparators = options.withSeparators;
    this.AsKeyword = options.AsKeyword;
    this.selectKeyword = options.selectKeyword;
    this.selectDecorator = options.selectDecorator;
    this.selectValues = options.selectValues || [];
    this.selectSeparators = options.selectSeparators;
    this.fromKeyword = options.fromKeyword;
    this.table = options.table;
    this.whereKeyword = options.whereKeyword;
    this.whereExpression = options.whereExpression;
    this.groupByKeyword = options.groupByKeyword;
    this.groupByExpressionSeparators = options.groupByExpressionSeparators;
    this.groupByExpression = options.groupByExpression;
    this.havingKeyword = options.havingKeyword;
    this.havingExpression = options.havingExpression;
    this.orderByKeyword = options.orderByKeyword;
    this.orderByUnits = options.orderByUnits;
    this.orderBySeparators = options.orderBySeparators;
    this.limitKeyword = options.limitKeyword;
    this.limitValue = options.limitValue;
    this.unionKeyword = options.unionKeyword;
    this.unionQuery = options.unionQuery;
  }

  public valueOf() {
    const value: SqlQueryValue = super.valueOf();
    value.explainKeyword = this.explainKeyword;
    value.withKeyword = this.withKeyword;
    value.withUnits = this.withUnits;
    value.withSeparators = this.withSeparators;
    value.AsKeyword = this.AsKeyword;
    value.selectKeyword = this.selectKeyword;
    value.selectDecorator = this.selectDecorator;
    value.selectValues = this.selectValues;
    value.selectSeparators = this.selectSeparators;
    value.fromKeyword = this.fromKeyword;
    value.table = this.table;
    value.whereKeyword = this.whereKeyword;
    value.whereExpression = this.whereExpression;
    value.groupByKeyword = this.groupByKeyword;
    value.groupByExpressionSeparators = this.groupByExpressionSeparators;
    value.groupByExpression = this.groupByExpression;
    value.havingKeyword = this.havingKeyword;
    value.havingExpression = this.havingExpression;
    value.orderByKeyword = this.orderByKeyword;
    value.orderByUnits = this.orderByUnits;
    value.limitKeyword = this.limitKeyword;
    value.limitValue = this.limitValue;
    value.unionKeyword = this.unionKeyword;
    value.unionQuery = this.unionQuery;
    return value;
  }

  public toRawString(): string {
    let rawString = this.innerSpacing.preQuery;

    if (this.explainKeyword) {
      rawString += this.explainKeyword + this.innerSpacing.postExplain;
    }
    if (this.withKeyword && this.withUnits) {
      rawString +=
        this.withKeyword +
        this.innerSpacing.postWith +
        Separator.interfaceSpacilator<WithUnit>(
          this.withUnits,
          SqlQuery.withUnitToString,
          this.withSeparators,
        ) +
        this.innerSpacing.postWithQuery;
    }
    rawString += this.selectKeyword + this.innerSpacing.postSelect;
    if (this.selectDecorator) {
      rawString += this.selectDecorator + this.innerSpacing.postSelectDecorator;
    }

    rawString +=
      Separator.spacilator(this.selectValues, this.selectSeparators) +
      this.innerSpacing.postSelectValues +
      this.fromKeyword +
      this.innerSpacing.postFrom +
      this.table;

    if (this.whereKeyword && this.whereExpression) {
      rawString +=
        this.innerSpacing.preWhereKeyword +
        this.whereKeyword +
        this.innerSpacing.postWhereKeyword +
        this.whereExpression.toString();
    }

    if (this.groupByKeyword && this.groupByExpression) {
      rawString +=
        this.innerSpacing.preGroupByKeyword +
        this.groupByKeyword +
        this.innerSpacing.postGroupByKeyword +
        Separator.spacilator(this.groupByExpression, this.groupByExpressionSeparators);
    }

    if (this.havingKeyword && this.havingExpression) {
      rawString +=
        this.innerSpacing.preHavingKeyword +
        this.havingKeyword +
        this.innerSpacing.postHavingKeyword +
        this.havingExpression.toString();
    }

    if (this.orderByKeyword && this.orderByUnits) {
      rawString +=
        this.innerSpacing.preOrderByKeyword +
        this.orderByKeyword +
        this.innerSpacing.postOrderByKeyword +
        Separator.interfaceSpacilator<OrderByUnit>(
          this.orderByUnits,
          unit => [unit.expression.toString(), unit.postExpression, unit.direction].join(''),
          this.orderBySeparators,
        );
    }

    if (this.limitKeyword && this.limitValue) {
      rawString +=
        this.innerSpacing.preLimitKeyword +
        this.limitKeyword +
        this.innerSpacing.postLimitKeyword +
        this.limitValue;
    }

    if (this.unionKeyword && this.unionQuery) {
      rawString +=
        this.innerSpacing.preUnionKeyword +
        this.unionKeyword +
        this.innerSpacing.postUnionKeyword +
        this.unionQuery.toString();
    }

    return rawString + this.innerSpacing.postQuery;
  }
}

SqlBase.register('query', SqlQuery);
