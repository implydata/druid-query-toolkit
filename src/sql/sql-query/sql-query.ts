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

import {
  parseSqlExpression,
  SeparatedArray,
  Separator,
  SqlAlias,
  SqlComparison,
  SqlExpression,
  SqlLiteral,
  SqlRef,
  Substitutor,
} from '../..';
import { parseSql } from '../../parser';
import { filterMap } from '../../utils';
import { SqlBase, SqlBaseValue } from '../sql-base';

import { SqlJoinPart } from './sql-join-part/sql-join-part';
import { Direction, SqlOrderByPart } from './sql-order-by-part/sql-order-by-part';
import { SqlWithPart } from './sql-with-part/sql-with-part';

export interface SqlQueryValue extends SqlBaseValue {
  explainKeyword?: string;

  withKeyword?: string;
  withParts?: SeparatedArray<SqlWithPart>;

  selectKeyword: string;
  selectDecorator?: string;
  selectExpressions: SeparatedArray<SqlAlias>;

  fromKeyword?: string;
  tables?: SeparatedArray<SqlAlias>;
  joinParts?: SeparatedArray<SqlJoinPart>;

  whereKeyword?: string;
  whereExpression?: SqlExpression;

  groupByKeyword?: string;
  groupByExpressions?: SeparatedArray<SqlExpression> | null;

  havingKeyword?: string;
  havingExpression?: SqlExpression;

  orderByKeyword?: string;
  orderByParts?: SeparatedArray<SqlOrderByPart>;

  limitKeyword?: string;
  limitValue?: SqlLiteral;

  offsetKeyword?: string;
  offsetValue?: SqlLiteral;

  unionKeyword?: string;
  unionQuery?: SqlQuery;
}

export class SqlQuery extends SqlBase {
  static type = 'query';

  static factory(from: SqlBase): SqlQuery {
    return new SqlQuery({
      selectKeyword: 'SELECT',
      selectExpressions: SeparatedArray.fromSingleValue(SqlAlias.STAR),
      fromKeyword: 'FROM',
      tables: SeparatedArray.fromSingleValue(SqlAlias.fromBaseAndUpgrade(from)),
    });
  }

  static getSelectExpressionOutput(selectExpression: SqlAlias, i: number) {
    return selectExpression.getOutputName() || `EXPR$${i}`;
  }

  public readonly explainKeyword?: string;
  public readonly withKeyword?: string;
  public readonly withParts?: SeparatedArray<SqlWithPart>;
  public readonly selectKeyword: string;
  public readonly selectDecorator?: string;
  public readonly selectExpressions: SeparatedArray<SqlAlias>;
  public readonly fromKeyword?: string;
  public readonly tables?: SeparatedArray<SqlAlias>;
  public readonly joinParts?: SeparatedArray<SqlJoinPart>;
  public readonly whereKeyword?: string;
  public readonly whereExpression?: SqlExpression;
  public readonly groupByKeyword?: string;
  public readonly groupByExpressions?: SeparatedArray<SqlExpression> | null;
  public readonly havingKeyword?: string;
  public readonly havingExpression?: SqlExpression;
  public readonly orderByKeyword?: string;
  public readonly orderByParts?: SeparatedArray<SqlOrderByPart>;
  public readonly limitKeyword?: string;
  public readonly limitValue?: SqlLiteral;
  public readonly offsetKeyword?: string;
  public readonly offsetValue?: SqlLiteral;
  public readonly unionKeyword?: string;
  public readonly unionQuery?: SqlQuery;

  constructor(options: SqlQueryValue) {
    super(options, SqlQuery.type);
    this.explainKeyword = options.explainKeyword;
    this.withKeyword = options.withKeyword;
    this.withParts = options.withParts;
    this.selectKeyword = options.selectKeyword;
    this.selectDecorator = options.selectDecorator;
    this.selectExpressions = options.selectExpressions;
    this.fromKeyword = options.fromKeyword;
    this.tables = options.tables;
    this.joinParts = options.joinParts;
    this.whereKeyword = options.whereKeyword;
    this.whereExpression = options.whereExpression;
    this.groupByKeyword = options.groupByKeyword;
    this.groupByExpressions = options.groupByExpressions;
    this.havingKeyword = options.havingKeyword;
    this.havingExpression = options.havingExpression;
    this.orderByKeyword = options.orderByKeyword;
    this.orderByParts = options.orderByParts;
    this.limitKeyword = options.limitKeyword;
    this.limitValue = options.limitValue;
    this.offsetKeyword = options.offsetKeyword;
    this.offsetValue = options.offsetValue;
    this.unionKeyword = options.unionKeyword;
    this.unionQuery = options.unionQuery;
  }

  public valueOf(): SqlQueryValue {
    const value = super.valueOf() as SqlQueryValue;
    value.explainKeyword = this.explainKeyword;
    value.withKeyword = this.withKeyword;
    value.withParts = this.withParts;
    value.selectKeyword = this.selectKeyword;
    value.selectDecorator = this.selectDecorator;
    value.selectExpressions = this.selectExpressions;
    value.fromKeyword = this.fromKeyword;
    value.tables = this.tables;
    value.joinParts = this.joinParts;
    value.whereKeyword = this.whereKeyword;
    value.whereExpression = this.whereExpression;
    value.groupByKeyword = this.groupByKeyword;
    value.groupByExpressions = this.groupByExpressions;
    value.havingKeyword = this.havingKeyword;
    value.havingExpression = this.havingExpression;
    value.orderByKeyword = this.orderByKeyword;
    value.orderByParts = this.orderByParts;
    value.limitKeyword = this.limitKeyword;
    value.limitValue = this.limitValue;
    value.offsetKeyword = this.offsetKeyword;
    value.offsetValue = this.offsetValue;
    value.unionKeyword = this.unionKeyword;
    value.unionQuery = this.unionQuery;
    return value;
  }

  public toRawString(): string {
    const rawParts: string[] = [this.getInnerSpace('preQuery', '')];

    // Explain clause
    if (this.explainKeyword) {
      rawParts.push(this.explainKeyword, this.getInnerSpace('postExplain'));
    }

    // With clause
    if (this.withKeyword && this.withParts) {
      rawParts.push(
        this.withKeyword,
        this.getInnerSpace('postWith'),
        this.withParts.toString(),
        this.getInnerSpace('postWithQuery'),
      );
    }

    // Select clause
    rawParts.push(this.selectKeyword, this.getInnerSpace('postSelect'));
    if (this.selectDecorator) {
      rawParts.push(this.selectDecorator, this.getInnerSpace('postSelectDecorator'));
    }

    rawParts.push(this.selectExpressions.toString());

    // From clause
    if (this.fromKeyword && this.tables) {
      rawParts.push(
        this.getInnerSpace('preFrom', '\n'),
        this.fromKeyword,
        this.getInnerSpace('postFrom'),
        this.tables.toString(),
      );
    }

    // Join Clause
    if (this.joinParts) {
      rawParts.push(this.getInnerSpace('preJoin', '\n'), this.joinParts.toString());
    }

    // Where Clause
    if (this.whereKeyword && this.whereExpression) {
      rawParts.push(
        this.getInnerSpace('preWhere', '\n'),
        this.whereKeyword,
        this.getInnerSpace('postWhere'),
        this.whereExpression.toString(),
      );
    }

    // GROUP BY
    if (this.groupByKeyword) {
      rawParts.push(
        this.getInnerSpace('preGroupBy', '\n'),
        this.groupByKeyword,
        this.getInnerSpace('postGroupBy'),
      );

      if (this.groupByExpressions) {
        rawParts.push(this.groupByExpressions.toString());
      } else {
        rawParts.push('()'); // Temp hack to allow for `GROUP BY ()`
      }
    }

    // Having Clause
    if (this.havingKeyword && this.havingExpression) {
      rawParts.push(
        this.getInnerSpace('preHaving', '\n'),
        this.havingKeyword,
        this.getInnerSpace('postHaving'),
        this.havingExpression.toString(),
      );
    }

    // OrderBy Clause
    if (this.orderByKeyword && this.orderByParts) {
      rawParts.push(
        this.getInnerSpace('preOrderBy', '\n'),
        this.orderByKeyword,
        this.getInnerSpace('postOrderBy'),
        this.orderByParts.toString(),
      );
    }

    // Limit Clause
    if (this.limitKeyword && this.limitValue) {
      rawParts.push(
        this.getInnerSpace('preLimit', '\n'),
        this.limitKeyword,
        this.getInnerSpace('postLimit'),
        this.limitValue.toString(),
      );
    }

    // Offset Clause
    if (this.offsetKeyword && this.offsetValue) {
      rawParts.push(
        this.getInnerSpace('preOffset', '\n'),
        this.offsetKeyword,
        this.getInnerSpace('postOffset'),
        this.offsetValue.toString(),
      );
    }

    // UNION
    if (this.unionKeyword && this.unionQuery) {
      rawParts.push(
        this.getInnerSpace('preUnion', '\n'),
        this.unionKeyword,
        this.getInnerSpace('postUnion'),
        this.unionQuery.toString(),
      );
    }

    rawParts.push(this.getInnerSpace('postQuery', ''));
    return rawParts.join('');
  }

  public changeWithParts(withParts: SeparatedArray<SqlWithPart> | SqlWithPart[] | undefined): this {
    const value = this.valueOf();
    if (withParts) {
      value.withParts = SeparatedArray.fromArray(withParts, '\n');
      value.withKeyword = value.withKeyword || 'WITH';
    } else {
      delete value.withParts;
      delete value.withKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('postWith', 'postWithQuery');
    }
    return SqlBase.fromValue(value);
  }

  public changeSelectExpressions(selectExpressions: SeparatedArray<SqlAlias> | SqlAlias[]): this {
    const value = this.valueOf();
    value.selectExpressions = SeparatedArray.fromArray(selectExpressions, Separator.COMMA);
    return SqlBase.fromValue(value);
  }

  public changeTables(tables: SeparatedArray<SqlAlias> | SqlAlias[] | undefined): this {
    const value = this.valueOf();
    if (tables) {
      value.tables = SeparatedArray.fromArray(tables, Separator.COMMA);
      value.fromKeyword = value.fromKeyword || 'FROM';
    } else {
      delete value.tables;
      delete value.fromKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('preFrom', 'postFrom');
    }
    return SqlBase.fromValue(value);
  }

  public changeJoinParts(joinParts: SeparatedArray<SqlJoinPart> | SqlJoinPart[] | undefined): this {
    const value = this.valueOf();
    if (joinParts) {
      value.joinParts = SeparatedArray.fromArray(joinParts, '\n');
    } else {
      delete value.joinParts;
    }
    return SqlBase.fromValue(value);
  }

  public changeWhereExpression(whereExpression: SqlExpression | string | undefined) {
    const value = this.valueOf();
    if (typeof whereExpression === 'undefined') {
      delete value.whereExpression;
      delete value.whereKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('preWhere', 'postWhere');
    } else {
      value.whereExpression = parseSqlExpression(whereExpression);
      value.whereKeyword = value.whereKeyword || 'WHERE';
    }
    return new SqlQuery(value);
  }

  public changeGroupByExpressions(
    groupByExpressions: SeparatedArray<SqlExpression> | SqlExpression[] | null | undefined,
  ): this {
    const value = this.valueOf();
    if (typeof groupByExpressions === 'undefined') {
      delete value.groupByExpressions;
      delete value.groupByKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('preGroupBy', 'postGroupBy');
    } else {
      value.groupByExpressions = groupByExpressions
        ? SeparatedArray.fromArray(groupByExpressions, Separator.COMMA)
        : null;
      value.groupByKeyword = value.groupByKeyword || 'GROUP BY';
    }
    return SqlBase.fromValue(value);
  }

  public changeHavingExpression(havingExpression: SqlExpression | string | undefined) {
    const value = this.valueOf();
    if (typeof havingExpression === 'undefined') {
      delete value.havingExpression;
      delete value.havingKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('preHaving', 'postHaving');
    } else {
      value.havingExpression = parseSqlExpression(havingExpression);
      value.havingKeyword = value.havingKeyword || 'HAVING';
    }
    return new SqlQuery(value);
  }

  public changeOrderByParts(
    orderByParts: SeparatedArray<SqlOrderByPart> | SqlOrderByPart[] | undefined,
  ): this {
    const value = this.valueOf();
    if (typeof orderByParts === 'undefined') {
      delete value.orderByParts;
      delete value.orderByKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('preOrderBy', 'postOrderBy');
    } else {
      value.orderByParts = SeparatedArray.fromArray(orderByParts, Separator.COMMA);
      value.orderByKeyword = value.orderByKeyword || 'ORDER BY';
    }
    return SqlBase.fromValue(value);
  }

  public changeLimitValue(limitValue: SqlLiteral | number | undefined): this {
    const value = this.valueOf();
    if (typeof limitValue === 'undefined') {
      delete value.limitValue;
      delete value.limitKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('preLimit', 'postLimit');
    } else {
      value.limitValue = SqlLiteral.factory(limitValue);
      value.limitKeyword = 'LIMIT';
    }
    return SqlBase.fromValue(value);
  }

  public changeOffsetValue(offsetValue: SqlLiteral | number | undefined): this {
    const value = this.valueOf();
    if (typeof offsetValue === 'undefined') {
      delete value.offsetValue;
      delete value.offsetKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('preOffset', 'postOffset');
    } else {
      value.offsetValue = SqlLiteral.factory(offsetValue);
      value.offsetKeyword = 'OFFSET';
    }
    return SqlBase.fromValue(value);
  }

  public changeUnionQuery(unionQuery: SqlQuery): this {
    const value = this.valueOf();
    value.unionQuery = unionQuery;
    return SqlBase.fromValue(value);
  }

  public walkInner(
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

    if (this.tables) {
      const tables = SqlBase.walkSeparatedArray(this.tables, nextStack, fn, postorder);
      if (!tables) return;
      if (tables !== this.tables) {
        ret = ret.changeTables(tables);
      }
    }

    if (this.joinParts) {
      const joinParts = SqlBase.walkSeparatedArray(this.joinParts, nextStack, fn, postorder);
      if (!joinParts) return;
      if (joinParts !== this.joinParts) {
        ret = ret.changeJoinParts(joinParts);
      }
    }

    if (this.whereExpression) {
      const whereExpression = this.whereExpression.walkHelper(nextStack, fn, postorder);
      if (!whereExpression) return;
      if (whereExpression !== this.whereExpression) {
        ret = ret.changeWhereExpression(whereExpression);
      }
    }

    if (this.groupByExpressions) {
      const groupByExpressions = SqlBase.walkSeparatedArray(
        this.groupByExpressions,
        nextStack,
        fn,
        postorder,
      );
      if (!groupByExpressions) return;
      if (groupByExpressions !== this.groupByExpressions) {
        ret = ret.changeGroupByExpressions(groupByExpressions);
      }
    }

    if (this.havingExpression) {
      const havingExpression = this.havingExpression.walkHelper(nextStack, fn, postorder);
      if (!havingExpression) return;
      if (havingExpression !== this.havingExpression) {
        ret = ret.changeHavingExpression(havingExpression);
      }
    }

    if (this.orderByParts) {
      const orderByParts = SqlBase.walkSeparatedArray(this.orderByParts, nextStack, fn, postorder);
      if (!orderByParts) return;
      if (orderByParts !== this.orderByParts) {
        ret = ret.changeOrderByParts(orderByParts);
      }
    }

    if (this.limitValue) {
      const limitValue = this.limitValue.walkHelper(nextStack, fn, postorder);
      if (!limitValue) return;
      if (limitValue !== this.limitValue) {
        ret = ret.changeLimitValue(limitValue as SqlLiteral);
      }
    }

    if (this.offsetValue) {
      const offsetValue = this.offsetValue.walkHelper(nextStack, fn, postorder);
      if (!offsetValue) return;
      if (offsetValue !== this.offsetValue) {
        ret = ret.changeOffsetValue(offsetValue as SqlLiteral);
      }
    }

    if (this.unionQuery) {
      const unionQuery = this.unionQuery.walkHelper(nextStack, fn, postorder);
      if (!unionQuery) return;
      if (unionQuery !== this.unionQuery) {
        ret = ret.changeUnionQuery(unionQuery as SqlQuery);
      }
    }

    return ret;
  }

  /* ~~~~~ SELECT ~~~~~ */

  /**
   * Returns an array of the string name of all columns in the select clause
   */
  getOutputColumns(): string[] {
    return this.selectExpressions.values.map(SqlQuery.getSelectExpressionOutput);
  }

  getSelectIndexForOutputColumn(outputColumn: string): number {
    return this.selectExpressions.values.findIndex((selectExpression, i) => {
      return SqlQuery.getSelectExpressionOutput(selectExpression, i) === outputColumn;
    });
  }

  getSelectIndexForExpression(ex: SqlExpression, allowAliasReferences: boolean): number {
    if (ex instanceof SqlLiteral && ex.isInteger()) {
      return Number(ex.value) - 1;
    }

    if (allowAliasReferences) {
      if (ex instanceof SqlRef) {
        const refIdx = this.selectExpressions.values.findIndex((selectExpression, i) => {
          return SqlQuery.getSelectExpressionOutput(selectExpression, i) === ex.column;
        });
        if (refIdx !== -1) {
          return refIdx;
        }
      }
    }

    return this.selectExpressions.values.findIndex(selectExpression => {
      return ex.equals(selectExpression.expression);
    });
  }

  isGroupedOutputColumn(outputColumn: string): boolean {
    const { groupByExpressions, selectExpressions } = this;
    if (!groupByExpressions) return false;
    return groupByExpressions.values.some(groupByExpression => {
      const selectIndex = this.getSelectIndexForExpression(groupByExpression, false);
      if (selectIndex === -1) return false;
      return (
        SqlQuery.getSelectExpressionOutput(selectExpressions.get(selectIndex), selectIndex) ===
        outputColumn
      );
    });
  }

  getGroupedOutputColumns(): string[] {
    if (!this.groupByExpressions) return [];
    const outputColumns = this.getOutputColumns();
    return outputColumns.filter(this.isGroupedOutputColumn, this);
  }

  isAggregateOutputColumn(outputColumn: string): boolean {
    if (!this.groupByExpressions) return false;
    return !this.isGroupedOutputColumn(outputColumn);
  }

  getAggregateOutputColumns(): string[] {
    if (!this.groupByExpressions) return [];
    const outputColumns = this.getOutputColumns();
    return outputColumns.filter(this.isAggregateOutputColumn, this);
  }

  addColumn(column: SqlBase | string, first = false) {
    const alias = SqlAlias.fromBase(typeof column === 'string' ? parseSql(column) : column);

    if (first) {
      return this.changeSelectExpressions(this.selectExpressions.addFirst(alias, Separator.COMMA));
    } else {
      return this.changeSelectExpressions(this.selectExpressions.addLast(alias, Separator.COMMA));
    }
  }

  removeOutputColumn(outputColumn: string) {
    const index = this.getSelectIndexForOutputColumn(outputColumn);
    if (index === -1) return this; // It is not even there

    const selectExpression = this.selectExpressions.get(index);
    const newSelectExpressions = this.selectExpressions.deleteByIndex(index);
    if (!newSelectExpressions) return this; // Can not remove the last column

    const value = this.valueOf();
    value.selectExpressions = newSelectExpressions;

    const sqlIndex = index + 1;
    if (value.groupByExpressions) {
      value.groupByExpressions = value.groupByExpressions.filterMap(groupByExpression => {
        if (groupByExpression instanceof SqlLiteral && groupByExpression.isInteger()) {
          if (Number(groupByExpression.value) > sqlIndex) {
            return groupByExpression.increment(-1);
          } else if (groupByExpression.value === sqlIndex) {
            return;
          }
        }
        if (groupByExpression.equals(selectExpression.expression)) return;
        return groupByExpression;
      });
    }

    if (value.orderByParts) {
      value.orderByParts = value.orderByParts.filterMap(orderByPart => {
        const { expression } = orderByPart;
        if (expression instanceof SqlLiteral && expression.isInteger()) {
          if (Number(expression.value) > sqlIndex) {
            orderByPart = orderByPart.changeExpression(expression.increment(-1));
          } else if (expression.value === sqlIndex) {
            return;
          }
        }
        return orderByPart;
      });
      if (!value.orderByParts) {
        delete value.orderByKeyword;
      }
    }

    return new SqlQuery(value);
  }

  /* ~~~~~ FROM ~~~~~ */

  getFirstTableName(): string | undefined {
    // returns the first table name
    if (!this.tables) return;

    return filterMap(this.tables.values, table => {
      const tableRef = table.expression;
      if (tableRef instanceof SqlRef) {
        return tableRef.table;
      }
      return;
    })[0];
  }

  // returns the first table namespace
  getFirstSchema(): string | undefined {
    if (!this.tables) return;

    return filterMap(this.tables.values, table => {
      const tableRef = table.expression;
      if (tableRef instanceof SqlRef) {
        return tableRef.namespace;
      }
      return;
    })[0];
  }

  replaceFrom(table: string) {
    const value = this.valueOf();
    value.tables = SeparatedArray.fromSingleValue(SqlAlias.fromBase(SqlRef.factory(table)));
    return new SqlQuery(value);
  }

  /* ~~~~~ JOIN ~~~~~ */

  addJoin(join: SqlJoinPart) {
    const value = this.valueOf();
    if (value.joinParts) {
      value.joinParts = value.joinParts.addLast(join, '\n');
    } else {
      value.joinParts = SeparatedArray.fromSingleValue(join);
    }
    return new SqlQuery(value);
  }

  removeAllJoins() {
    const value = this.valueOf();
    delete value.joinParts;
    value.innerSpacing = this.getInnerSpacingWithout('preJoin');
    return new SqlQuery(value);
  }

  /* ~~~~~ WHERE ~~~~~ */

  getWhereExpression(): SqlExpression {
    return this.whereExpression || SqlLiteral.TRUE;
  }

  addToWhere(expressionThing: string | SqlExpression) {
    const expression = parseSqlExpression(expressionThing);
    return this.changeWhereExpression(SqlExpression.and(this.whereExpression, expression));
  }

  // Removes all filters on the specified column from the where clause
  removeColumnFromWhere(column: string) {
    if (!this.whereExpression) return this;

    const value = this.valueOf();

    if (
      value.whereExpression instanceof SqlComparison &&
      value.whereExpression.containsColumn(column)
    ) {
      value.whereExpression = undefined;
      value.whereKeyword = undefined;
      value.innerSpacing = this.getInnerSpacingWithout('preWhere', 'postWhere');
    } else {
      value.whereExpression = this.whereExpression.removeColumnFromAnd(column);
    }

    return new SqlQuery(value);
  }

  /* ~~~~~ GROUP BY ~~~~~ */

  hasGroupBy(): boolean {
    return Boolean(this.groupByKeyword);
  }

  // Checks to see if a column is in the group by clause either by name or index
  hasGroupByOnColumn(column: string) {
    const index = this.getOutputColumns().indexOf(column) + 1;
    if (!this.groupByExpressions) return false;
    return this.groupByExpressions.values.some(
      expr => SqlRef.equalsString(expr, column) || SqlLiteral.equalsLiteral(expr, index),
    );
  }

  addToGroupBy(column: SqlBase) {
    // Adds a column with no alias to the group by clause
    // column is added to the select clause then the index is added to group by clause
    return this.addColumn(column, true).addFirstColumnToGroupBy();
  }

  addFirstColumnToGroupBy() {
    // Adds the last column in the select clause to the group by clause via its index
    const value = this.valueOf();

    const newGroupBy = SqlLiteral.factory(1);
    if (this.groupByExpressions) {
      value.groupByExpressions = this.groupByExpressions
        .map(groupByExpression => {
          if (groupByExpression instanceof SqlLiteral) {
            return groupByExpression.increment() || groupByExpression;
          }
          return groupByExpression;
        })
        .addFirst(newGroupBy, Separator.COMMA);
    } else {
      value.groupByExpressions = SeparatedArray.fromSingleValue(newGroupBy);
    }
    value.groupByKeyword = value.groupByKeyword || 'GROUP BY';

    return new SqlQuery(value);
  }

  // addLastColumnToGroupBy() {
  //   // Adds the last column in the select clause to the group by clause via its index
  //   const value = this.valueOf();
  //
  //   value.groupByExpressions = (value.groupByExpressions || []).concat([
  //     SqlLiteral.fromInput(value.selectExpressions.length),
  //   ]);
  //   value.groupByKeyword = value.groupByKeyword || 'GROUP BY';
  //   value.groupBySeparators = this.groupByExpressions
  //     ? Separator.fillBetween(
  //         value.groupBySeparators || [],
  //         value.groupByExpressions.length,
  //         Separator.COMMA,
  //       )
  //     : undefined;
  //
  //   return new SqlQuery(value);
  // }

  // Removes a column from the group by clause
  removeFromGroupBy(column: string): SqlQuery {
    if (!this.groupByExpressions) return this;

    const sqlIndex = this.getSelectIndexForOutputColumn(column) + 1;

    return this.changeGroupByExpressions(
      this.groupByExpressions.filter(
        groupByExpression =>
          SqlRef.equalsString(groupByExpression, column) ||
          SqlLiteral.equalsLiteral(groupByExpression, sqlIndex),
      ),
    );
  }

  /* ~~~~~ HAVING ~~~~~ */

  getHavingExpression(): SqlExpression {
    return this.havingExpression || SqlLiteral.TRUE;
  }

  addToHaving(expressionThing: string | SqlExpression) {
    const expression = parseSqlExpression(expressionThing);
    return this.changeHavingExpression(SqlExpression.and(this.havingExpression, expression));
  }

  removeFromHaving(column: string) {
    if (!this.havingExpression) return this;
    return this.changeHavingExpression(this.havingExpression.removeColumnFromAnd(column));
  }

  /* ~~~~~ ORDER BY ~~~~~ */

  getOrderByForOutputColumn(outputColumn: string): SqlOrderByPart | undefined {
    if (!this.orderByParts) return;
    const myOrderByPart = this.orderByParts.values.find(orderByPart => {
      const selectIndex = this.getSelectIndexForExpression(orderByPart.expression, true);
      if (selectIndex === -1) return;
      return (
        SqlQuery.getSelectExpressionOutput(this.selectExpressions.get(selectIndex), selectIndex) ===
        outputColumn
      );
    });

    return myOrderByPart;
  }

  getOrderedOutputColumns() {
    if (!this.orderByParts) return [];
    const outputColumns = this.getOutputColumns();
    return outputColumns.filter(this.getOrderByForOutputColumn, this);
  }

  orderBy(column: string, direction?: Direction) {
    const orderByPart = new SqlOrderByPart({
      expression: SqlRef.factoryWithQuotes(column),
      direction: direction,
    });
    const sqlIndex = this.getOutputColumns().indexOf(column) + 1;
    const value = this.valueOf();

    // If already in the OrderBy
    if (this.orderByParts) {
      if (
        this.orderByParts.values.some(
          orderByPart =>
            SqlLiteral.equalsLiteral(orderByPart.expression, sqlIndex) ||
            SqlRef.equalsString(orderByPart.expression, column),
        )
      ) {
        value.orderByParts = this.orderByParts.map(orderByPart => {
          if (
            (orderByPart.expression instanceof SqlLiteral &&
              orderByPart.expression.value === sqlIndex) ||
            SqlRef.equalsString(orderByPart.expression, column)
          ) {
            return orderByPart;
          } else {
            return orderByPart;
          }
        });
      } else {
        value.orderByParts = this.orderByParts.addFirst(orderByPart, Separator.COMMA);
      }
    } else {
      value.orderByParts = SeparatedArray.fromSingleValue(orderByPart);
    }

    value.orderByKeyword = value.orderByKeyword || 'ORDER BY';

    return new SqlQuery(value);
  }

  removeFromOrderBy(column: string) {
    if (!this.orderByParts) return this;

    // Removes and order by unit from the order by clause
    const sqlIndex = this.getSelectIndexForOutputColumn(column) + 1;

    return this.changeOrderByParts(
      this.orderByParts.filter(unit => {
        return (
          SqlRef.equalsString(unit.expression, column) ||
          SqlLiteral.equalsLiteral(unit.expression, sqlIndex)
        );
      }),
    );
  }

  /* ~~~~~ LIMIT ~~~~~ */

  // Tumbleweeds live here
}

SqlBase.register(SqlQuery.type, SqlQuery);
