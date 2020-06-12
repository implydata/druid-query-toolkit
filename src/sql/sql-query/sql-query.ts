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
import { deepDelete, deepSet, filterMap } from '../../utils';
import { SqlBase, SqlBaseValue } from '../sql-base';

import { Direction, SqlOrderByPart } from './sql-order-by-part/sql-order-by-part';
import { SqlWithPart } from './sql-with-part/sql-with-part';

export interface SqlQueryValue extends SqlBaseValue {
  explainKeyword?: string;

  withKeyword?: string;
  withParts?: SeparatedArray<SqlWithPart>;

  selectKeyword?: string;
  selectDecorator?: string;
  selectValues: SeparatedArray<SqlAlias>;

  fromKeyword?: string;

  tables?: SeparatedArray<SqlAlias>;

  joinType?: string;
  joinKeyword?: string;
  joinTable?: SqlAlias;
  onKeyword?: string;
  onExpression?: SqlExpression;

  whereKeyword?: string;
  whereExpression?: SqlExpression;

  groupByKeyword?: string;
  groupByExpressions?: SeparatedArray<SqlExpression>;

  havingKeyword?: string;
  havingExpression?: SqlExpression;

  orderByKeyword?: string;
  orderByParts?: SeparatedArray<SqlOrderByPart>;

  limitKeyword?: string;
  limitValue?: SqlLiteral;

  unionKeyword?: string;
  unionQuery?: SqlQuery;
}

export class SqlQuery extends SqlBase {
  static type = 'query';

  public readonly explainKeyword?: string;
  public readonly withKeyword?: string;
  public readonly withParts?: SeparatedArray<SqlWithPart>;
  public readonly selectKeyword?: string;
  public readonly selectDecorator?: string;
  public readonly selectValues: SeparatedArray<SqlAlias>;
  public readonly fromKeyword?: string;
  public readonly joinType?: string;
  public readonly joinKeyword?: string;
  public readonly joinTable?: SqlAlias;
  public readonly onKeyword?: string;
  public readonly onExpression?: SqlExpression;
  public readonly tables?: SeparatedArray<SqlAlias>;
  public readonly whereKeyword?: string;
  public readonly whereExpression?: SqlExpression;
  public readonly groupByKeyword?: string;
  public readonly groupByExpressions?: SeparatedArray<SqlExpression>;
  public readonly havingKeyword?: string;
  public readonly havingExpression?: SqlExpression;
  public readonly orderByKeyword?: string;
  public readonly orderByParts?: SeparatedArray<SqlOrderByPart>;
  public readonly limitKeyword?: string;
  public readonly limitValue?: SqlLiteral;
  public readonly unionKeyword?: string;
  public readonly unionQuery?: SqlQuery;

  constructor(options: SqlQueryValue) {
    super(options, SqlQuery.type);
    this.explainKeyword = options.explainKeyword;
    this.withKeyword = options.withKeyword;
    this.withParts = options.withParts;
    this.selectKeyword = options.selectKeyword;
    this.selectDecorator = options.selectDecorator;
    this.selectValues = options.selectValues;
    this.fromKeyword = options.fromKeyword;
    this.joinType = options.joinType;
    this.joinKeyword = options.joinKeyword;
    this.joinTable = options.joinTable;
    this.onKeyword = options.onKeyword;
    this.onExpression = options.onExpression;
    this.tables = options.tables;
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
    value.selectValues = this.selectValues;
    value.fromKeyword = this.fromKeyword;
    value.joinType = this.joinType;
    value.joinKeyword = this.joinKeyword;
    value.joinTable = this.joinTable;
    value.onKeyword = this.onKeyword;
    value.onExpression = this.onExpression;
    value.tables = this.tables;
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
    value.unionKeyword = this.unionKeyword;
    value.unionQuery = this.unionQuery;
    return value;
  }

  public toRawString(): string {
    const rawStringParts: string[] = [this.getInnerSpace('preQuery')];

    // Explain clause
    if (this.explainKeyword) {
      rawStringParts.push(this.explainKeyword, this.getInnerSpace('postExplain'));
    }

    // With clause
    if (this.withKeyword && this.withParts) {
      rawStringParts.push(
        this.withKeyword,
        this.getInnerSpace('postWith'),
        this.withParts.toString(),
        this.getInnerSpace('postWithQuery'),
      );
    }

    // Select clause
    if (this.selectKeyword && this.selectValues) {
      rawStringParts.push(this.selectKeyword, this.getInnerSpace('postSelect'));
      if (this.selectDecorator) {
        rawStringParts.push(this.selectDecorator, this.getInnerSpace('postSelectDecorato'));
      }

      rawStringParts.push(this.selectValues.toString());
    }

    // From clause
    if (this.fromKeyword && this.tables) {
      rawStringParts.push(
        this.getInnerSpace('preFrom', '\n'),
        this.fromKeyword,
        this.getInnerSpace('postFrom'),
        this.tables.toString(),
      );
    }

    // Join Clause
    if (this.joinKeyword && this.joinType && this.joinTable) {
      rawStringParts.push(
        this.getInnerSpace('preJoin'),
        this.joinType,
        this.getInnerSpace('postJoinType'),
        this.joinKeyword,
        this.getInnerSpace('postJoinKeyword'),
        this.joinTable.toString(),
      );

      if (this.onKeyword && this.onExpression) {
        rawStringParts.push(
          this.getInnerSpace('preOnKeyword'),
          this.onKeyword,
          this.getInnerSpace('postOn'),
          this.onExpression.toString(),
        );
      }
    }

    // Where Clause
    if (this.whereKeyword && this.whereExpression) {
      rawStringParts.push(
        this.getInnerSpace('preWhereKeyword', '\n'),
        this.whereKeyword,
        this.getInnerSpace('postWhereKeyword'),
        this.whereExpression.toString(),
      );
    }

    // GroupBy Clause
    if (this.groupByKeyword && this.groupByExpressions) {
      rawStringParts.push(
        this.getInnerSpace('preGroupByKeyword', '\n'),
        this.groupByKeyword,
        this.getInnerSpace('postGroupByKeyword'),
        this.groupByExpressions.toString(),
      );
    }

    // Having Clause
    if (this.havingKeyword && this.havingExpression) {
      rawStringParts.push(
        this.getInnerSpace('preHavingKeyword', '\n'),
        this.havingKeyword,
        this.getInnerSpace('postHavingKeyword'),
        this.havingExpression.toString(),
      );
    }

    // OrderBy Clause
    if (this.orderByKeyword && this.orderByParts) {
      rawStringParts.push(
        this.getInnerSpace('preOrderByKeyword', '\n'),
        this.orderByKeyword,
        this.getInnerSpace('postOrderByKeyword'),
        this.orderByParts.toString(),
      );
    }

    // Limit Clause
    if (this.limitKeyword && this.limitValue) {
      rawStringParts.push(
        this.getInnerSpace('preLimitKeyword', '\n'),
        this.limitKeyword,
        this.getInnerSpace('postLimitKeyword'),
        this.limitValue.toString(),
      );
    }

    // Union Clause
    if (this.unionKeyword && this.unionQuery) {
      rawStringParts.push(
        this.getInnerSpace('preUnionKeyword', '\n'),
        this.unionKeyword,
        this.getInnerSpace('postUnionKeyword'),
        this.unionQuery.toString(),
      );
    }

    rawStringParts.push(this.getInnerSpace('postQuery'));
    return rawStringParts.join('');
  }

  public changeWithParts(withParts: SeparatedArray<SqlWithPart>): this {
    const value = this.valueOf();
    value.withParts = withParts;
    return SqlBase.fromValue(value);
  }

  public changeSelectValues(selectValues: SeparatedArray<SqlAlias>): this {
    const value = this.valueOf();
    value.selectValues = selectValues;
    return SqlBase.fromValue(value);
  }

  public changeTables(tables: SeparatedArray<SqlAlias>): this {
    const value = this.valueOf();
    value.tables = tables;
    return SqlBase.fromValue(value);
  }

  public changeJoinTable(joinTable: SqlAlias): this {
    const value = this.valueOf();
    value.joinTable = joinTable;
    return SqlBase.fromValue(value);
  }

  public changeOnExpression(onExpression: SqlExpression): this {
    const value = this.valueOf();
    value.onExpression = onExpression;
    return SqlBase.fromValue(value);
  }

  public changeWhereExpression(whereExpression: SqlExpression): this {
    const value = this.valueOf();
    value.whereExpression = whereExpression;
    return SqlBase.fromValue(value);
  }

  public changeGroupByExpressions(groupByExpressions: SeparatedArray<SqlExpression>): this {
    const value = this.valueOf();
    value.groupByExpressions = groupByExpressions;
    return SqlBase.fromValue(value);
  }

  public changeHavingExpression(havingExpression: SqlExpression): this {
    const value = this.valueOf();
    value.havingExpression = havingExpression;
    return SqlBase.fromValue(value);
  }

  public changeOrderByParts(orderByParts: SeparatedArray<SqlOrderByPart>): this {
    const value = this.valueOf();
    value.orderByParts = orderByParts;
    return SqlBase.fromValue(value);
  }

  public changeLimitValue(limitValue: SqlLiteral): this {
    const value = this.valueOf();
    value.limitValue = limitValue;
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
    let ret = this;

    if (this.withParts) {
      const withParts = SqlBase.walkSeparatedArray(this.withParts, nextStack, fn, postorder);
      if (!withParts) return;
      if (withParts !== this.withParts) {
        ret = ret.changeWithParts(withParts);
      }
    }

    if (this.selectValues) {
      const selectValues = SqlBase.walkSeparatedArray(this.selectValues, nextStack, fn, postorder);
      if (!selectValues) return;
      if (selectValues !== this.selectValues) {
        ret = ret.changeSelectValues(selectValues);
      }
    }

    if (this.tables) {
      const tables = SqlBase.walkSeparatedArray(this.tables, nextStack, fn, postorder);
      if (!tables) return;
      if (tables !== this.tables) {
        ret = ret.changeTables(tables);
      }
    }

    if (this.joinTable) {
      const joinTable = this.joinTable.walkHelper(nextStack, fn, postorder);
      if (!joinTable) return;
      if (joinTable !== this.joinTable) {
        ret = ret.changeJoinTable(joinTable as SqlAlias);
      }

      if (this.onExpression) {
        const onExpression = this.onExpression.walkHelper(nextStack, fn, postorder);
        if (!onExpression) return;
        if (onExpression !== this.onExpression) {
          ret = ret.changeOnExpression(onExpression);
        }
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

    if (this.unionQuery) {
      const unionQuery = this.unionQuery.walkHelper(nextStack, fn, postorder);
      if (!unionQuery) return;
      if (unionQuery !== this.unionQuery) {
        ret = ret.changeUnionQuery(unionQuery as SqlQuery);
      }
    }

    return ret;
  }

  /* ~~~~~ General Stuff ~~~~~ */

  remove(column: string) {
    return this.removeFilter(column)
      .removeFromGroupBy(column)
      .removeFromWhere(column)
      .removeFromHaving(column)
      .removeFromOrderBy(column)
      .removeColumn(column);
  }

  removeFilter(column: string): SqlQuery {
    let ret: SqlQuery = this;

    if (this.whereExpression) {
      ret = this.removeFromWhere(column) || ret;
    }

    if (this.havingExpression) {
      ret = this.removeFromHaving(column) || ret;
    }

    return ret;
  }

  getCurrentFilters() {
    let filterSqlRefs: SqlRef[] = [];

    if (this.havingExpression) {
      filterSqlRefs = filterSqlRefs.concat(this.havingExpression.getSqlRefs());
    }
    if (this.whereExpression) {
      filterSqlRefs = filterSqlRefs.concat(this.whereExpression.getSqlRefs());
    }

    return filterSqlRefs.map(sqlRef => sqlRef.column);
  }

  /* ~~~~~ SELECT ~~~~~ */

  /**
   * Returns an array of the string name of all columns in the select clause
   */
  getOutputColumns(): string[] {
    return this.selectValues.values.map((selectValue, i) => {
      return selectValue.getOutputName() || `EXPR$${i}`;
    });
  }

  getGroupedColumns(): string[] {
    if (!this.groupByExpressions) return [];
    const columns = this.getOutputColumns();
    return filterMap(this.groupByExpressions.values, column => {
      if (column instanceof SqlRef) {
        return column.column;
      } else if (column instanceof SqlLiteral && typeof column.value === 'number') {
        return columns[column.value - 1];
      }
      return;
    });
  }

  getAggregateColumns(): string[] {
    if (!this.groupByExpressions) return [];
    const groupedColumns = this.getGroupedColumns();
    return this.getOutputColumns().filter(column => !groupedColumns.includes(column));
  }

  addColumn(column: SqlBase | string, first = false) {
    const alias = SqlAlias.fromBase(typeof column === 'string' ? parseSql(column) : column);

    const value = this.valueOf();
    if (first) {
      value.selectValues = this.selectValues.addFirst(alias, Separator.COMMA);
    } else {
      value.selectValues = this.selectValues.addLast(alias, Separator.COMMA);
    }
    return new SqlQuery(value);
  }

  removeColumn(column: string) {
    const index = this.getOutputColumns().indexOf(column);
    if (index === -1) return this;
    const selectValues = this.selectValues.deleteByIndex(index);
    if (!selectValues) return this;

    const value = this.valueOf();
    value.selectValues = selectValues;

    const sqlIndex = index + 1;
    if (value.groupByExpressions) {
      value.groupByExpressions = value.groupByExpressions.filterMap(groupByExpression => {
        if (
          groupByExpression instanceof SqlLiteral &&
          typeof groupByExpression.value === 'number'
        ) {
          if (groupByExpression.value > sqlIndex) {
            return groupByExpression.increment(-1)!;
          } else if (groupByExpression.value === sqlIndex) {
            return;
          }
        }
        return groupByExpression;
      });
    }

    if (value.orderByParts) {
      value.orderByParts = value.orderByParts.filterMap(orderByPart => {
        const { expression } = orderByPart;
        if (expression instanceof SqlLiteral && typeof expression.value === 'number') {
          if (expression.value > sqlIndex) {
            orderByPart = deepSet(orderByPart, 'expression', expression.increment(-1));
          } else if (expression.value === sqlIndex) {
            return;
          }
        }
        return orderByPart;
      });
      if (!value.orderByParts) {
        delete value.orderByKeyword;
        delete value.orderByParts;
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
    value.tables = SeparatedArray.fromSingleValue(SqlAlias.fromBase(SqlRef.fromString(table)));
    return new SqlQuery(value);
  }

  /* ~~~~~ JOIN ~~~~~ */

  addJoin(joinType: 'LEFT' | 'INNER', joinTable: SqlBase, onExpression: SqlExpression) {
    const value = this.valueOf();
    value.joinType = joinType;
    value.joinKeyword = 'JOIN';
    value.joinTable = SqlAlias.fromBase(joinTable);
    value.onKeyword = 'ON';
    value.onExpression = onExpression;
    return new SqlQuery(value);
  }

  removeJoin() {
    const value = this.valueOf();
    delete value.joinType;
    delete value.joinKeyword;
    delete value.joinTable;
    delete value.onKeyword;
    delete value.onExpression;
    value.innerSpacing = this.getInnerSpacingWithout(
      'preJoin',
      'postJoinType',
      'postJoinKeyword',
      'preOnKeyword',
      'postOn',
    );
    return new SqlQuery(value);
  }

  /* ~~~~~ WHERE ~~~~~ */

  addWhereFilter(expressionString: string | SqlExpression) {
    const expression: SqlExpression =
      typeof expressionString === 'string'
        ? parseSqlExpression(expressionString)
        : expressionString;

    const value = this.valueOf();

    // If a filter exists for this column replace it otherwise add it with an and expression
    value.whereExpression = expression;
    // this.filterExpression
    // ? this.filterExpression.addOrReplaceColumn(SqlBase.getColumnName(column), filter)
    // : filter;

    value.whereKeyword = value.whereKeyword || 'WHERE';
    return new SqlQuery(value);
  }

  // Removes all filters on the specified column from the where clause
  removeFromWhere(column: string) {
    if (!this.whereExpression) return this;

    const value = this.valueOf();

    if (
      value.whereExpression instanceof SqlComparison &&
      value.whereExpression.containsColumn(column)
    ) {
      value.whereExpression = undefined;
      value.whereKeyword = undefined;
      value.innerSpacing = this.getInnerSpacingWithout('preWhereKeyword', 'postWhereKeyword');
    } else {
      value.whereExpression = this.whereExpression.removeColumnFromAnd(column);
    }

    return new SqlQuery(value);
  }

  /* ~~~~~ GROUP BY ~~~~~ */

  // Checks to see if a column is in the group by clause either by name or index
  hasGroupByColumn(column: string) {
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

    const newGroupBy = SqlLiteral.fromInput(1);
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
  //     SqlLiteral.fromInput(value.selectValues.length),
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

    const value = this.valueOf();
    const index = this.getOutputColumns().indexOf(column) + 1;

    value.groupByExpressions = this.groupByExpressions.filter(
      groupByExpression =>
        SqlRef.equalsString(groupByExpression, column) ||
        SqlLiteral.equalsLiteral(groupByExpression, index),
    );

    if (!value.groupByExpressions) {
      delete value.groupByKeyword;
      value.innerSpacing = this.getInnerSpacingWithout('preGroupByKeyword', 'postGroupByKeyword');
    }

    return new SqlQuery(value);
  }

  /* ~~~~~ HAVING ~~~~~ */

  addHavingFilter(expressionString: SqlExpression | string) {
    const expression: SqlExpression =
      typeof expressionString === 'string'
        ? parseSqlExpression(expressionString)
        : expressionString;

    const value = this.valueOf();

    // // If a filter exists for this column replace it other wise add it with an and expression
    value.havingExpression = expression;
    // filterExpression
    // ? filterExpression.addOrReplaceColumn(SqlBase.getColumnName(column), filter)
    // : filter;

    value.havingKeyword = value.havingKeyword || 'HAVING';

    return new SqlQuery(value);
  }

  removeFromHaving(column: string) {
    if (!this.havingExpression) return this;

    // Removes all filters on the specified column from the having clause
    let value = this.valueOf();

    if (
      value.havingExpression instanceof SqlExpression &&
      value.havingExpression.containsColumn(column)
    ) {
      value.havingExpression = undefined;
      value.havingKeyword = undefined;
      value = deepDelete(value, 'innerSpacing.preHavingKeyord');
      value = deepDelete(value, 'innerSpacing.postHavingKeyword');
    } else {
      value.havingExpression = this.havingExpression.removeColumnFromAnd(column);
    }

    return new SqlQuery(value);
  }

  /* ~~~~~ ORDER BY ~~~~~ */

  getSorted() {
    if (!this.orderByParts) return;

    const columns = this.getOutputColumns();
    return this.orderByParts.values.map(unit => {
      let id = '';
      if (unit.expression instanceof SqlLiteral && typeof unit.expression.value === 'number') {
        id = (columns[unit.expression.value - 1] || '').toString();
      } else if (unit.expression instanceof SqlRef && unit.expression.column) {
        id = unit.expression.column;
      }
      return {
        // if the order by contains a number instead of a column name get the proper column name
        id: id,
        // if direction undefined it should sort by desc:true
        direction: unit.getActualDirection(),
      };
    });
  }

  getOrderByColumns(): string[] {
    throw new Error('ToDo');
  }

  orderBy(column: string, direction?: Direction) {
    const orderByPart = new SqlOrderByPart({
      expression: SqlRef.fromStringWithDoubleQuotes(column),
      direction: direction,
    });
    const value = this.valueOf();
    const sqlIndex = this.getOutputColumns().indexOf(column) + 1;

    // If already in the OrderBy
    if (this.orderByParts) {
      if (
        this.orderByParts.values.some(
          unit =>
            SqlLiteral.equalsLiteral(unit.expression, sqlIndex) ||
            SqlRef.equalsString(unit.expression, column),
        )
      ) {
        value.orderByParts = this.orderByParts.map(unit => {
          if (
            (unit.expression instanceof SqlLiteral && unit.expression.value === sqlIndex) ||
            SqlRef.equalsString(unit.expression, column)
          ) {
            return orderByPart;
          } else {
            return unit;
          }
        });
      } else {
        value.orderByParts = this.orderByParts.addLast(orderByPart, Separator.COMMA);
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
    let value = this.valueOf();
    const sqlIndex = this.getOutputColumns().indexOf(column) + 1;

    value.orderByParts = this.orderByParts.filter(unit => {
      return (
        SqlRef.equalsString(unit.expression, column) ||
        SqlLiteral.equalsLiteral(unit.expression, sqlIndex)
      );
    });

    if (!value.orderByParts) {
      delete value.orderByKeyword;
      value = deepDelete(value, 'innerSpacing.preOrderByKeyword');
      value = deepDelete(value, 'innerSpacing.postOrderByKeyword');
    }
    return new SqlQuery(value);
  }

  /* ~~~~~ LIMIT ~~~~~ */

  // Tumbleweeds live here
}

SqlBase.register(SqlQuery.type, SqlQuery);
