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
  Annotation,
  Separator,
  SqlAliasRef,
  SqlFunction,
  SqlLiteral,
  SqlMulti,
  SqlRef,
  SqlUnary,
} from '../index';
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlQueryValue extends SqlBaseValue {
  explainKeyword?: string;

  withKeyword?: string;
  withUnits?: WithUnit[];
  withSeparators?: Separator[];

  selectKeyword?: string;
  selectDecorator?: string;
  selectValues: SqlBase[];
  selectSeparators?: Separator[];

  fromKeyword?: string;

  tables?: (SqlAliasRef | SqlRef)[];
  tableSeparators?: [];

  selectAnnotations?: Annotation[];

  joinType?: string;
  joinKeyword?: string;
  joinTable?: SqlRef;
  onKeyword?: string;
  onExpression?: SqlBase;

  whereKeyword?: string;
  whereExpression?: SqlMulti | SqlUnary;

  groupByKeyword?: string;
  groupByExpression?: SqlBase[];
  groupByExpressionSeparators?: Separator[];

  havingKeyword?: string;
  havingExpression?: SqlMulti | SqlUnary;

  orderByKeyword?: string;
  orderByUnits?: OrderByUnit[];
  orderBySeparators?: Separator[];

  limitKeyword?: string;
  limitValue?: SqlLiteral;

  unionKeyword?: string;
  unionQuery?: SqlQuery;

  postQueryAnnotation?: Annotation[];
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

export type Direction = 'ASC' | 'DESC';

export interface OrderByUnit {
  expression: SqlBase;
  postExpression: string;
  direction?: Direction;
}

export class SqlQuery extends SqlBase {
  public explainKeyword?: string;
  public withKeyword?: string;
  public withUnits?: WithUnit[];
  public withSeparators?: Separator[];
  public selectKeyword?: string;
  public selectDecorator?: string;
  public selectValues: SqlBase[];
  public selectSeparators?: Separator[];
  public fromKeyword?: string;
  public joinType?: string;
  public joinKeyword?: string;
  public joinTable?: SqlRef;
  public onKeyword?: string;
  public onExpression?: SqlBase;
  public tables?: (SqlAliasRef | SqlRef)[];
  public tableSeparators?: [];
  public selectAnnotations?: Annotation[];
  public whereKeyword?: string;
  public whereExpression?: SqlMulti | SqlUnary;
  public groupByKeyword?: string;
  public groupByExpression?: SqlBase[];
  public groupByExpressionSeparators?: Separator[];
  public havingKeyword?: string;
  public havingExpression?: SqlMulti | SqlUnary;
  public orderByKeyword?: string;
  public orderByUnits?: OrderByUnit[];
  public orderBySeparators?: Separator[];
  public limitKeyword?: string;
  public limitValue?: SqlLiteral;
  public unionKeyword?: string;
  public unionQuery?: SqlQuery;
  public postQueryAnnotation?: Annotation[];

  static type = 'query';

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
    super(options, SqlQuery.type);

    this.explainKeyword = options.explainKeyword;
    this.withKeyword = options.withKeyword;
    this.withUnits = options.withUnits;
    this.withSeparators = options.withSeparators;
    this.selectKeyword = options.selectKeyword;
    this.selectDecorator = options.selectDecorator;
    this.selectValues = options.selectValues || [];
    this.selectSeparators = options.selectSeparators;
    this.fromKeyword = options.fromKeyword;
    this.joinType = options.joinType;
    this.joinKeyword = options.joinKeyword;
    this.joinTable = options.joinTable;
    this.onKeyword = options.onKeyword;
    this.onExpression = options.onExpression;
    this.tables = options.tables;
    this.tableSeparators = options.tableSeparators;
    this.selectAnnotations = options.selectAnnotations;
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
    this.postQueryAnnotation = options.postQueryAnnotation;
  }

  public valueOf(): SqlQueryValue {
    const value = super.valueOf() as SqlQueryValue;
    value.explainKeyword = this.explainKeyword;
    value.withKeyword = this.withKeyword;
    value.withUnits = this.withUnits;
    value.withSeparators = this.withSeparators;
    value.selectKeyword = this.selectKeyword;
    value.selectDecorator = this.selectDecorator;
    value.selectValues = this.selectValues;
    value.selectSeparators = this.selectSeparators;
    value.fromKeyword = this.fromKeyword;
    value.selectAnnotations = this.selectAnnotations;
    value.joinType = this.joinType;
    value.joinKeyword = this.joinKeyword;
    value.joinTable = this.joinTable;
    value.onKeyword = this.onKeyword;
    value.onExpression = this.onExpression;
    value.tables = this.tables;
    value.tableSeparators = this.tableSeparators;
    value.whereKeyword = this.whereKeyword;
    value.whereExpression = this.whereExpression;
    value.groupByKeyword = this.groupByKeyword;
    value.groupByExpressionSeparators = this.groupByExpressionSeparators;
    value.groupByExpression = this.groupByExpression;
    value.havingKeyword = this.havingKeyword;
    value.havingExpression = this.havingExpression;
    value.orderByKeyword = this.orderByKeyword;
    value.orderByUnits = this.orderByUnits;
    value.orderBySeparators = this.orderBySeparators;
    value.limitKeyword = this.limitKeyword;
    value.limitValue = this.limitValue;
    value.unionKeyword = this.unionKeyword;
    value.unionQuery = this.unionQuery;
    value.postQueryAnnotation = this.postQueryAnnotation;
    return value;
  }

  public toRawString(): string {
    const rawStringParts: string[] = [this.innerSpacing.preQuery];

    // Explain clause
    if (this.explainKeyword) {
      rawStringParts.push(this.explainKeyword, this.innerSpacing.postExplain);
    }

    // With clause
    if (this.withKeyword && this.withUnits) {
      rawStringParts.push(
        this.withKeyword,
        this.innerSpacing.postWith,
        Separator.customSpacilator<WithUnit>(
          this.withUnits,
          SqlQuery.withUnitToString,
          this.withSeparators,
        ),
        this.innerSpacing.postWithQuery,
      );
    }

    // Select clause
    if (this.selectKeyword && this.selectValues && this.selectAnnotations) {
      rawStringParts.push(this.selectKeyword, this.innerSpacing.postSelect);
      if (this.selectDecorator) {
        rawStringParts.push(this.selectDecorator, this.innerSpacing.postSelectDecorato);
      }

      rawStringParts.push(
        Separator.customSpacilator<any>(
          this.selectValues.map((column, i) => {
            return {
              column: column,
              comment: this.selectAnnotations ? this.selectAnnotations[i] : '',
            };
          }),
          column => {
            return column.column.toString() + (column.comment || '').toString();
          },
          this.selectSeparators,
        ),
      );
    }

    // From clause
    if (this.tables && this.fromKeyword) {
      rawStringParts.push(
        this.innerSpacing.preFrom,
        this.fromKeyword,
        this.innerSpacing.postFrom,
        Separator.spacilator(this.tables, this.tableSeparators),
      );
    }

    // Join Clause
    if (
      this.joinKeyword &&
      this.joinType &&
      this.joinTable &&
      this.onKeyword &&
      this.onExpression
    ) {
      rawStringParts.push(
        this.innerSpacing.preJoin,
        this.joinType,
        this.innerSpacing.postJoinType,
        this.joinKeyword,
        this.innerSpacing.postJoinKeyword,
        this.joinTable.toString(),
        this.innerSpacing.postJoinTable,
        this.onKeyword,
        this.innerSpacing.postOn,
        this.onExpression.toString(),
      );
    }

    // Where Clause
    if (this.whereKeyword && this.whereExpression) {
      rawStringParts.push(
        this.innerSpacing.preWhereKeyword,
        this.whereKeyword,
        this.innerSpacing.postWhereKeyword,
        this.whereExpression.toString(),
      );
    }

    // GroupBy Clause
    if (this.groupByKeyword && this.groupByExpression) {
      rawStringParts.push(
        this.innerSpacing.preGroupByKeyword,
        this.groupByKeyword,
        this.innerSpacing.postGroupByKeyword,
        Separator.spacilator(this.groupByExpression, this.groupByExpressionSeparators),
      );
    }

    // Having Clause
    if (this.havingKeyword && this.havingExpression) {
      rawStringParts.push(
        this.innerSpacing.preHavingKeyword,
        this.havingKeyword,
        this.innerSpacing.postHavingKeyword,
        this.havingExpression.toString(),
      );
    }

    // OrderBy Clause
    if (this.orderByKeyword && this.orderByUnits) {
      rawStringParts.push(
        this.innerSpacing.preOrderByKeyword,
        this.orderByKeyword,
        this.innerSpacing.postOrderByKeyword,
        Separator.customSpacilator<OrderByUnit>(
          this.orderByUnits,
          unit => [unit.expression.toString(), unit.postExpression, unit.direction].join(''),
          this.orderBySeparators,
        ),
      );
    }

    // Limit Clause
    if (this.limitKeyword && this.limitValue) {
      rawStringParts.push(
        this.innerSpacing.preLimitKeyword,
        this.limitKeyword,
        this.innerSpacing.postLimitKeyword,
        this.limitValue.toString(),
      );
    }

    // Union Clause
    if (this.unionKeyword && this.unionQuery) {
      rawStringParts.push(
        this.innerSpacing.preUnionKeyword,
        this.unionKeyword,
        this.innerSpacing.postUnionKeyword,
        this.unionQuery.toString(),
      );
    }

    // Post Query Annotated Comments
    if (this.postQueryAnnotation) {
      rawStringParts.push(
        this.innerSpacing.preQueryAnnotatedComments,
        this.postQueryAnnotation.map(comment => comment.toString()).join(''),
      );
    }

    rawStringParts.push(this.innerSpacing.postQuery);
    return rawStringParts.join('');
  }

  getTableName() {
    // returns the first table name
    if (!this.tables) return;

    return this.tables.map(table => {
      if (table instanceof SqlRef) {
        return table.table;
      } else if (table.alias && table.alias.table) {
        return table.alias.table;
      }
      return;
    })[0];
  }

  getSchema() {
    // returns the first table namespace
    if (!this.tables) return;
    return this.tables.map(table => {
      if (table instanceof SqlRef) {
        return table.namespace;
      } else if (table.alias) {
        return table.alias.namespace;
      }
      return;
    })[0];
  }

  getSorted() {
    if (!this.orderByUnits) return;

    const columns = this.getColumns();
    return this.orderByUnits.map(unit => {
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
        desc: unit.direction !== 'ASC',
      };
    });
  }

  getOrderByColumns(): string[] {
    if (!this.groupByExpression) return [];
    const columns = this.getColumns();
    const aggregateColumns = this.groupByExpression.map(column => {
      if (column instanceof SqlRef) {
        return column.column;
      } else if (typeof column === 'number') {
        return columns[column - 1] || '';
      } else if (column instanceof SqlLiteral && typeof column.value === 'number') {
        return columns[column.value - 1] || '';
      } else {
        return '';
      }
    });
    return this.getColumns().filter(
      column => column && !aggregateColumns.includes(column),
    ) as string[];
  }

  orderBy(column: string, direction?: Direction) {
    const orderByUnit = {
      expression: SqlRef.fromStringWithDoubleQuotes(column),
      postExpression: direction ? ' ' : '',
      direction: direction,
    };
    const value = this.valueOf();
    const index = this.getColumns().indexOf(column) + 1;
    value.orderByUnits = value.orderByUnits || [];

    // If already in the OrderBy
    if (
      value.orderByUnits.filter(
        unit =>
          SqlLiteral.equalsLiteral(unit.expression, index) ||
          SqlRef.equalsString(unit.expression, column),
      ).length
    ) {
      value.orderByUnits = value.orderByUnits.map(unit => {
        if (
          (unit.expression instanceof SqlLiteral && unit.expression.value === index) ||
          SqlRef.equalsString(unit.expression, column)
        ) {
          return orderByUnit;
        } else {
          return unit;
        }
      });
    } else {
      value.orderByUnits = (value.orderByUnits || []).concat([orderByUnit]);
    }

    value.orderByKeyword = value.orderByKeyword || 'ORDER BY';
    value.innerSpacing.postOrderByKeyword = value.innerSpacing.postOrderByKeyword || ' ';
    value.innerSpacing.preOrderByKeyword = value.innerSpacing.preOrderByKeyword || `\n`;
    value.orderBySeparators = Separator.fillBetween(
      value.orderBySeparators || [],
      (value.orderByUnits || []).length,
      Separator.rightSeparator(','),
    );

    return new SqlQuery(value);
  }

  remove(column: string) {
    return this.removeFilter(column)
      .removeFromGroupBy(column)
      .removeFromWhere(column)
      .removeFromHaving(column)
      .removeFromOrderBy(column)
      .removeFromSelect(column);
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

  // todo fix groupBy indexes
  removeFromSelect(column: string) {
    const value = this.valueOf();
    const index = this.getColumns().indexOf(column);
    const filteredList = Separator.filterStringFromList(
      column,
      value.selectValues,
      value.selectSeparators,
    );

    if (value.orderByUnits) {
      value.orderByUnits = value.orderByUnits.map(unit => {
        if (unit instanceof SqlLiteral && typeof unit.value === 'number' && unit.value > index) {
          unit.value += -1;
        }
        return unit;
      });
    }

    if (value.orderByUnits) {
      value.orderByUnits = value.orderByUnits.map(unit => {
        if (
          unit.expression instanceof SqlLiteral &&
          typeof unit.expression.value === 'number' &&
          unit.expression.value > index
        ) {
          unit.expression.value += -1;
        }
        return unit;
      });
    }
    value.selectSeparators = filteredList ? filteredList.separators : undefined;
    value.selectValues = filteredList ? filteredList.values : value.selectValues;

    return new SqlQuery(value);
  }

  removeFromWhere(column: string) {
    // Removes all filters on the specified column from the where clause
    const value = this.valueOf();
    if (!value.whereExpression) return this;

    if (
      value.whereExpression.isType('Comparison') &&
      value.whereExpression.containsColumn(column)
    ) {
      value.whereExpression = undefined;
      value.whereKeyword = undefined;
      value.innerSpacing.preWhereKeyord = '';
      value.innerSpacing.postWhereKeyword = '';
    } else {
      value.whereExpression = value.whereExpression.removeColumn(column);
    }

    return new SqlQuery(value);
  }

  removeFromHaving(column: string) {
    // Removes all filters on the specified column from the having clause
    const value = this.valueOf();
    if (!value.havingExpression) return this;

    if (
      value.havingExpression.isType('Comparison') &&
      value.havingExpression.containsColumn(column)
    ) {
      value.havingExpression = undefined;
      value.havingKeyword = undefined;
      value.innerSpacing.preHavingKeyord = '';
      value.innerSpacing.postHavingKeyword = '';
    } else {
      value.havingExpression = value.havingExpression.removeColumn(column);
    }

    return new SqlQuery(value);
  }

  removeFromOrderBy(column: string) {
    // Removes and order by unit from the order by clause
    const value = this.valueOf();
    const index = this.getColumns().indexOf(column) + 1;
    if (!value.orderByUnits) return this;

    const filteredUnitsList = Separator.filterStringFromInterfaceList<OrderByUnit>(
      value.orderByUnits,
      unit => {
        return (
          SqlRef.equalsString(unit.expression, column) ||
          SqlLiteral.equalsLiteral(unit.expression, index)
        );
      },
      value.orderBySeparators,
    );

    value.orderByUnits = filteredUnitsList.units;
    value.orderBySeparators = filteredUnitsList.separators;

    if (!value.orderByUnits) {
      value.orderByKeyword = undefined;
      value.innerSpacing.preOrderByKeyword = '';
      value.innerSpacing.postOrderByKeywordv = '';
    }
    return new SqlQuery(value);
  }

  removeFromGroupBy(column: string): SqlQuery {
    // Removes a column from the group by clause
    const value = this.valueOf();
    const index = this.getColumns().indexOf(column) + 1;
    if (!value.groupByExpression) return this;

    const filteredUnitsList = Separator.filterStringFromInterfaceList<SqlBase>(
      value.groupByExpression,
      unit => SqlRef.equalsString(unit, column) || SqlLiteral.equalsLiteral(unit, index),
      value.groupByExpressionSeparators,
    );

    value.groupByExpression = filteredUnitsList.units;
    value.groupByExpressionSeparators = filteredUnitsList.separators;

    if (!value.groupByExpression) {
      value.groupByKeyword = undefined;
      value.innerSpacing.preGroupByKeyword = '';
      value.innerSpacing.postGroupByKeyword = '';
    }
    return new SqlQuery(value);
  }

  getAggregateColumns(): string[] {
    if (!this.groupByExpression) return [];
    const columns = this.getColumns();
    const aggregateColumns = this.groupByExpression.map(column => {
      if (column instanceof SqlRef) {
        return column.column;
      } else if (typeof column === 'number') {
        return columns[column - 1] || '';
      } else if (column instanceof SqlLiteral && typeof column.value === 'number') {
        return columns[column.value - 1] || '';
      } else {
        return '';
      }
    });
    return this.getColumns().filter(
      column => column && !aggregateColumns.includes(column),
    ) as string[];
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

  addWhereFilter(
    column: string | SqlBase,
    operator: string,
    filterValue: SqlBase | string | number,
  ) {
    const value = this.valueOf();
    const filterExpression = value.whereExpression;

    // create new  filter to be added
    const filter: SqlMulti = new SqlMulti({
      arguments: [
        typeof column === 'string' ? SqlRef.fromStringWithDoubleQuotes(column) : column,
        filterValue instanceof SqlBase ? filterValue : SqlLiteral.fromInput(filterValue),
      ],
      separators: [Separator.bothSeparator(operator)],
    } as SqlMulti);

    // If a filter  exists for this column replace it other wise add it with an and expression
    value.whereExpression = filterExpression
      ? filterExpression.addOrReplaceColumn(SqlBase.getColumnName(column), filter)
      : filter;

    value.whereKeyword = value.whereKeyword || 'WHERE';
    value.innerSpacing.preWhereKeyword = value.innerSpacing.preWhereKeyword || '\n';
    value.innerSpacing.postWhereKeyword = value.innerSpacing.postWhereKeyword || ' ';
    return new SqlQuery(value);
  }

  addHavingFilter(
    column: string | SqlBase,
    operator: string,
    filterValue: SqlBase | string | number,
  ) {
    const value = this.valueOf();
    const filterExpression = value.havingExpression;

    // create new  filter to be added
    const filter: SqlMulti = new SqlMulti({
      arguments: [
        typeof column === 'string' ? SqlRef.fromStringWithDoubleQuotes(column) : column,
        filterValue instanceof SqlBase ? filterValue : SqlLiteral.fromInput(filterValue),
      ],
      separators: [Separator.bothSeparator(operator)],
    } as SqlMulti);

    // If a filter  exists for this column replace it other wise add it with an and expression
    value.havingExpression = filterExpression
      ? filterExpression.addOrReplaceColumn(SqlBase.getColumnName(column), filter)
      : filter;

    value.havingKeyword = value.havingKeyword || 'HAVING';
    value.innerSpacing.preHavingKeyword = value.innerSpacing.prehavingKeyword || '\n';
    value.innerSpacing.postHavingKeyword = value.innerSpacing.postHavingKeyword || ' ';

    return new SqlQuery(value);
  }

  addToGroupBy(column: SqlBase) {
    // Adds a column with no alias to the group by clause
    // column is added to the select clause then the index is added to group by clause
    return this.addColumn(column).addFirstColumnToGroupBy();
  }

  addLastColumnToGroupBy() {
    // Adds the last column in the select clause to the group by clause via its index
    const value = this.valueOf();

    value.groupByExpression = (value.groupByExpression || []).concat([
      SqlLiteral.fromInput(value.selectValues.length),
    ]);
    value.groupByKeyword = value.groupByKeyword || 'GROUP BY';
    value.groupByExpressionSeparators = this.groupByExpression
      ? Separator.fillBetween(
          value.groupByExpressionSeparators || [],
          value.groupByExpression.length,
          Separator.rightSeparator(','),
        )
      : undefined;
    value.innerSpacing.postGroupByKeyword = value.innerSpacing.postGroupByKeyword || ' ';
    value.innerSpacing.preGroupByKeyword = value.innerSpacing.preGroupByKeyword || `\n`;

    return new SqlQuery(value);
  }

  addFirstColumnToGroupBy() {
    // Adds the last column in the select clause to the group by clause via its index
    const value = this.valueOf();

    value.groupByExpression = [SqlLiteral.fromInput(1) as SqlBase].concat(
      (value.groupByExpression || []).map(column => {
        if (column instanceof SqlLiteral) {
          column = column.increment() || column;
        }
        return column;
      }),
    );
    value.groupByKeyword = value.groupByKeyword || 'GROUP BY';
    value.groupByExpressionSeparators = this.groupByExpression
      ? Separator.fillBetween(
          value.groupByExpressionSeparators || [],
          value.groupByExpression.length,
          Separator.rightSeparator(','),
        )
      : undefined;
    value.innerSpacing.postGroupByKeyword = value.innerSpacing.postGroupByKeyword || ' ';
    value.innerSpacing.preGroupByKeyword = value.innerSpacing.preGroupByKeyword || `\n`;

    return new SqlQuery(value);
  }

  addColumn(column: SqlBase) {
    const value = this.valueOf();
    if (!value.selectValues) return this;

    value.selectValues = [column].concat(value.selectValues);
    value.selectSeparators = (value.selectSeparators || []).concat(Separator.rightSeparator(','));
    return new SqlQuery(value);
  }

  addAggregateColumn(
    columns: SqlBase[],
    functionName: string,
    alias: string,
    filter?: SqlBase,
    decorator?: string,
  ) {
    // Adds an aggregate column to the select
    const value = this.valueOf();

    const selectValue = SqlAliasRef.sqlAliasFactory(
      SqlFunction.sqlFunctionFactory(functionName, columns, [], filter, decorator),
      alias,
    );

    value.selectValues = value.selectValues.concat([selectValue]);
    value.selectSeparators = (value.selectSeparators || []).concat(Separator.rightSeparator(','));
    return new SqlQuery(value);
  }

  getColumns() {
    // returns an array of the string name of all columns in the select clause
    if (!this.selectValues) return [];

    return this.selectValues.map(column => {
      if (column instanceof SqlRef) {
        return column.column;
      } else if (column instanceof SqlAliasRef) {
        return column.alias.column;
      }
      return;
    });
  }

  hasGroupByColumn(column: string) {
    // Checks to see if a column is in the group by clause either by name or index
    const value = this.valueOf();
    const index = this.getColumns().indexOf(column) + 1;
    if (!value.groupByExpression) return false;
    return value.groupByExpression.some(
      expr => SqlRef.equalsString(expr, column) || SqlLiteral.equalsLiteral(expr, index),
    );
  }

  replaceFrom(table: string) {
    const value = this.valueOf();

    value.tables = [SqlRef.fromString(table)];
    value.tableSeparators = [];
    return new SqlQuery(value);
  }

  addJoin(joinType: 'LEFT' | 'INNER', joinTable: SqlRef, onExpression: SqlMulti) {
    const value = this.valueOf();
    value.joinType = joinType;
    value.joinKeyword = 'JOIN';
    value.joinTable = joinTable;
    value.onKeyword = 'ON';
    value.onExpression = onExpression;
    value.innerSpacing = Object.assign({}, value.innerSpacing, {
      preJoin: `\n`,
      postJoinType: ' ',
      postJoinKeyword: ' ',
      postJoinTable: ' ',
      postOn: ' ',
    });
    return new SqlQuery(value);
  }

  removeJoin() {
    const value = this.valueOf();
    value.joinType = undefined;
    value.joinKeyword = undefined;
    value.joinTable = undefined;
    value.onKeyword = undefined;
    value.onExpression = undefined;
    value.innerSpacing = Object.assign({}, value.innerSpacing, {
      preJoin: '',
      postJoinType: '',
      postJoinKeyword: '',
      postJoinTable: '',
      postOn: '',
    });
    return new SqlQuery(value);
  }
}
SqlBase.register(SqlQuery.type, SqlQuery);
