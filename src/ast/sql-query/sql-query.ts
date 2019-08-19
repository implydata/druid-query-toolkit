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

import { BaseAst } from '../base-ast';
import {
  AdditiveExpression,
  Alias,
  AndExpression,
  andExpressionFactory,
  Column,
  columnFactory,
  Columns,
  columnsFactory,
  ComparisonExpression,
  comparisonFactory,
  comparisonRhsFactory,
  FilterClause,
  FromClause,
  functionFactory,
  GroupByClause,
  HavingClause,
  havingFactory,
  LimitClause,
  numberFactory,
  NumberType,
  OrderByClause,
  OrderByPart,
  OrExpression,
  orExpressionFactory,
  RefExpression,
  stringFactory,
  StringType,
  subFactory,
  Timestamp,
  WhereClause,
  whereFactory,
} from '../index';

import { arrayContains, getColumns } from './helpers';
export interface SqlQueryValue {
  verb: string;
  distinct: string;
  columns: Columns;
  fromClause: FromClause;
  whereClause?: WhereClause;
  groupByClause?: GroupByClause;
  havingClause?: HavingClause;
  orderByClause?: OrderByClause;
  limitClause?: LimitClause;
  spacing: string[];
}

export class SqlQuery extends BaseAst {
  public verb: string;
  public distinct: string;
  public columns: Columns;
  public fromClause: FromClause;
  public whereClause?: WhereClause;
  public groupByClause?: GroupByClause;
  public havingClause?: HavingClause;
  public orderByClause?: OrderByClause;
  public limitClause?: LimitClause;
  public spacing: string[];

  constructor(options: SqlQueryValue) {
    super('query');
    this.verb = options.verb;
    this.distinct = options.distinct;
    this.fromClause = options.fromClause;
    this.columns = options.columns;
    this.whereClause = options.whereClause;
    this.groupByClause = options.groupByClause;
    this.havingClause = options.havingClause;
    this.orderByClause = options.orderByClause;
    this.limitClause = options.limitClause;
    this.spacing = options.spacing;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC'): SqlQuery {
    // If selecting from a sub query apply actions to sub query
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        this.fromClause.fc = this.fromClause.fc.orderBy(column, direction);
        return this;
      }
    }

    const orderByClause = new OrderByClause({
      orderKeyword: 'ORDER',
      byKeyword: 'BY',
      orderBy: [],
      spacing: [' ', ' ', ''],
    });
    const spacing = this.spacing;

    spacing[6] = '\n';
    orderByClause.orderByColumn(column, direction);
    return new SqlQuery({
      columns: this.columns,
      distinct: this.distinct,
      fromClause: this.fromClause,
      groupByClause: this.groupByClause,
      havingClause: this.havingClause,
      limitClause: this.limitClause,
      orderByClause: orderByClause,
      spacing: spacing,
      verb: this.verb,
      whereClause: this.whereClause,
    });
  }

  excludeColumn(columnVal: string): SqlQuery {
    // If selecting from a sub query apply actions to sub query
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        this.fromClause.fc = this.fromClause.fc.excludeColumn(columnVal);
        return this;
      }
    }

    const columns: Column[] = [];
    const spacing: string[] = [];

    this.columns.columns.map((column, index) => {
      if (column.getAlias()) {
        const alias = column.getAlias();
        if (alias) {
          if (
            (alias.value instanceof StringType ? alias.value.getBasicValue() : alias.value) !==
            columnVal
          ) {
            columns.push(column);
            spacing.push(this.columns.spacing[index]);
          }
        }
      } else if (column.getBasicValue() !== columnVal) {
        columns.push(column);
        spacing.push(this.columns.spacing[index]);
      }
    });

    const columnsArray = new Columns({
      columns: columns,
      spacing: spacing,
      parens: this.columns.parens,
    });
    const query = new SqlQuery({
      columns: columnsArray,
      distinct: this.distinct,
      fromClause: this.fromClause,
      groupByClause: this.getGroupByClauseWithoutColumn(columnVal),
      havingClause: this.havingClause,
      limitClause: this.limitClause,
      orderByClause: this.getOrderByClauseWithoutColumn(columnVal),
      spacing: this.spacing,
      verb: this.verb,
      whereClause: this.whereClause,
    });
    return query;
  }

  addFunctionToGroupBy(
    functionName: string,
    spacing: string[],
    argumentsArray: (StringType | number)[],
    alias: Alias,
  ): SqlQuery {
    // If selecting from a sub query apply actions to sub query
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        this.fromClause.fc = this.fromClause.fc.addFunctionToGroupBy(
          functionName,
          spacing,
          argumentsArray,
          alias,
        );
        return this;
      }
    }

    if (!this.groupByClause) {
      return this;
    }

    const columns = this.columns.columns;
    const columnSpacing = this.columns.spacing;

    columnSpacing.unshift(' ');
    columns.unshift(columnFactory(functionFactory(functionName, spacing, argumentsArray), alias));
    const groupby = this.groupByClause.groupBy.map(part =>
      part instanceof NumberType ? numberFactory(Number(part.value) + 1) : part,
    );
    groupby.unshift(numberFactory(1));

    return new SqlQuery({
      columns: new Columns({ columns: columns, parens: [], spacing: columnSpacing }),
      distinct: this.distinct,
      fromClause: this.fromClause,
      groupByClause: new GroupByClause({
        groupKeyword: this.groupByClause.groupKeyword,
        byKeyword: this.groupByClause.byKeyword,
        groupBy: groupby,
        spacing: this.groupByClause.spacing,
      }),
      havingClause: this.havingClause,
      limitClause: this.limitClause,
      orderByClause: this.orderByClause,
      spacing: this.spacing,
      verb: this.verb,
      whereClause: this.whereClause,
    });
  }

  addToGroupBy(columnName: string): SqlQuery {
    // If selecting from a sub query apply actions to sub query
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        this.fromClause.fc = this.fromClause.fc.addToGroupBy(columnName);
        return this;
      }
    }

    if (!this.groupByClause) {
      return this;
    }

    const columns = this.columns.columns;
    const columnSpacing = this.columns.spacing;

    columnSpacing.unshift(' ');
    columns.unshift(columnFactory(columnName));
    const groupby = this.groupByClause.groupBy.map(part =>
      part instanceof NumberType ? numberFactory(Number(part.value) + 1) : part,
    );
    groupby.unshift(new NumberType(1));

    return new SqlQuery({
      columns: new Columns({ columns: columns, parens: [], spacing: columnSpacing }),
      distinct: this.distinct,
      fromClause: this.fromClause,
      groupByClause: new GroupByClause({
        groupKeyword: this.groupByClause.groupKeyword,
        byKeyword: this.groupByClause.byKeyword,
        groupBy: groupby,
        spacing: this.groupByClause.spacing,
      }),
      havingClause: this.havingClause,
      limitClause: this.limitClause,
      orderByClause: this.orderByClause,
      spacing: this.spacing,
      verb: this.verb,
      whereClause: this.whereClause,
    });
  }

  addAggregateColumn(
    columnName: string | RefExpression,
    functionName: string,
    alias?: Alias,
    distinct?: boolean,
    filter?: FilterClause,
  ): SqlQuery {
    // If selecting from a sub query apply actions to sub query
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        this.fromClause.fc = this.fromClause.fc.addAggregateColumn(
          columnName,
          functionName,
          alias,
          distinct,
          filter,
        );
        return this;
      }
    }

    const columns = this.columns.columns;
    const columnSpacing = this.columns.spacing;
    const column = functionFactory(
      functionName,
      distinct ? ['', ' '] : [],
      [columnName instanceof RefExpression ? columnName : stringFactory(columnName, `"`)],
      filter,
      distinct,
    );

    if (distinct) {
      column.spacing = ['', ' ', '', '', ''];
    }
    if (filter) {
      if (column.spacing.length) {
        column.spacing[3] = ' ';
      } else {
        column.spacing = ['', '', '', '', ' '];
      }
    }
    columnSpacing.push(' ');
    columns.push(columnFactory(column, alias));

    return new SqlQuery({
      columns: columnsFactory(columns, columnSpacing),
      distinct: this.distinct,
      fromClause: this.fromClause,
      groupByClause: this.groupByClause,
      havingClause: this.havingClause,
      limitClause: this.limitClause,
      orderByClause: this.orderByClause,
      spacing: this.spacing,
      verb: this.verb,
      whereClause: this.whereClause,
    });
  }

  getOrderByClauseWithoutColumn(columnVal: string): OrderByClause | undefined {
    // If selecting from a sub query apply actions to sub query
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        return this.fromClause.fc.getOrderByClauseWithoutColumn(columnVal);
      }
    }

    if (!this.orderByClause) return;

    const orderByClause: OrderByClause | undefined = this.orderByClause;
    const orderByArray: OrderByPart[] = [];
    const spacing = [this.orderByClause.spacing[0], this.orderByClause.spacing[1]];

    orderByClause.orderBy.map((filter, index) => {
      if (filter.orderBy.getBasicValue() !== columnVal && this.orderByClause) {
        orderByArray.push(filter);
        spacing.push(this.orderByClause.spacing[2 + index]);
      }
    });

    if (orderByArray.length) {
      orderByClause.orderBy = orderByArray;
      return orderByClause;
    }

    return undefined;
  }

  getGroupByClauseWithoutColumn(columnVal: string): GroupByClause | undefined {
    // If selecting from a sub query apply actions to sub query
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        return this.fromClause.fc.getGroupByClauseWithoutColumn(columnVal);
      }
    }

    if (!this.groupByClause) return;

    let groupByClause;
    // get array of grouping columns as strings
    const groupByColumns = this.groupByClause.groupBy.map(part => part.getBasicValue());

    if (this.groupByClause.groupBy.length > 1) {
      const newGroupByColumns: any[] = [];

      groupByColumns.map((groupByColumn, index) => {
        // if grouping column is a number and the column to be removed is less than that column decrease the value of the grouping column by 1
        if (this.getColumnsArray().indexOf(columnVal) + 1 < Number(groupByColumn)) {
          newGroupByColumns.push(new NumberType(Number(groupByColumn) - 1));
        } else if (this.getColumnsArray().indexOf(columnVal) + 1 > Number(groupByColumn)) {
          // if column index is greater than grouping column groupbyclause remains the same
          if (this.groupByClause) {
            newGroupByColumns.push(this.groupByClause.groupBy[index]);
          }
        } else if (
          columnVal !== groupByColumn &&
          this.getColumnsArray().indexOf(columnVal) + 1 !== Number(groupByColumn)
        ) {
          if (this.groupByClause) {
            newGroupByColumns.push(this.groupByClause.groupBy[index]);
          }
        }
      });
      groupByClause = new GroupByClause({
        groupBy: newGroupByColumns,
        groupKeyword: this.groupByClause.groupKeyword,
        byKeyword: this.groupByClause.byKeyword,
        spacing: this.groupByClause.spacing,
      });
    } else {
      // only grouping column
      if (
        columnVal !== groupByColumns[0] &&
        this.getColumnsArray().indexOf(columnVal) + 1 < Number(groupByColumns[0])
      ) {
        groupByClause = new GroupByClause({
          groupBy: [orExpressionFactory([new NumberType(groupByColumns[0] - 1)])],
          groupKeyword: this.groupByClause.groupKeyword,
          byKeyword: this.groupByClause.byKeyword,
          spacing: this.groupByClause.spacing,
        });
      } else if (
        columnVal !== groupByColumns[0] &&
        this.getColumnsArray().indexOf(columnVal) + 1 > Number(groupByColumns[0])
      ) {
        groupByClause = this.groupByClause;
      } else {
        groupByClause = undefined;
      }
    }

    return groupByClause;
  }

  filterRow(
    left: string | Timestamp | StringType,
    right: string | number | AdditiveExpression | Timestamp | StringType,
    operator: '!=' | '=' | '>' | '<' | 'like' | '>=' | '<=' | 'LIKE',
  ): SqlQuery {
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        this.fromClause.fc = this.fromClause.fc.filterRow(left, right, operator);
        return this;
      }
    }

    // If selecting from a sub query apply actions to sub query
    const aggregateColumns = this.getAggregateColumns();
    const spacing = this.spacing;
    let whereClause = this.whereClause;
    let headerBaseString;
    let rowBaseString;

    if (aggregateColumns) {
      if (typeof left === 'string') {
        if (aggregateColumns.includes(left)) {
          return this.filterAggregateRow(left, right, operator);
        }
      }
      if (left instanceof StringType) {
        if (aggregateColumns.includes(left.chars)) {
          return this.filterAggregateRow(left, right, operator);
        }
      }
    }

    if (left instanceof Timestamp || left instanceof StringType) {
      headerBaseString = left;
    } else {
      headerBaseString = new StringType({ chars: left, quote: '"', spacing: ['', ''] });
    }

    if (typeof right === 'number') {
      rowBaseString = new NumberType(right);
    } else if (
      right instanceof StringType ||
      right instanceof AdditiveExpression ||
      right instanceof Timestamp
    ) {
      rowBaseString = right;
    } else {
      rowBaseString = stringFactory(String(right), `'`);
    }

    const comparisonExpression = comparisonFactory(
      headerBaseString,
      comparisonRhsFactory(operator, rowBaseString),
    );

    // No where clause present
    if (!whereClause) {
      whereClause = whereFactory(comparisonExpression);
      this.spacing[4] = '\n';
    } else if (whereClause && whereClause.filter instanceof OrExpression) {
      // filtered by an or clause
      whereClause = whereFactory(
        andExpressionFactory([subFactory(whereClause.filter), comparisonExpression]),
      );
      this.spacing[4] = '\n';
    } else if (whereClause && whereClause.filter instanceof AndExpression) {
      // Multiple
      let contained = false;
      whereClause.filter.ex = whereClause.filter.ex.map(filter => {
        if (
          filter instanceof ComparisonExpression &&
          filter.ex instanceof StringType &&
          filter.ex.chars === left
        ) {
          contained = true;
          return comparisonExpression;
        } else {
          return filter;
        }
      });
      if (!contained) {
        whereClause.filter.ex.push(comparisonExpression);
        if (whereClause.filter.spacing) {
          whereClause.filter.spacing.push(' AND ');
        } else {
          whereClause.filter.spacing = [' AND '];
        }
      }
    } else if (!(whereClause.filter instanceof AndExpression)) {
      // only one
      if (
        whereClause.filter instanceof ComparisonExpression &&
        whereClause.filter.ex instanceof StringType &&
        whereClause.filter.ex.chars === left
      ) {
        whereClause.filter = comparisonExpression;
      } else {
        // @ts-ignore
        whereClause.filter = andExpressionFactory([whereClause.filter, comparisonExpression]);
      }
    }

    return new SqlQuery({
      columns: this.columns,
      distinct: this.distinct,
      fromClause: this.fromClause,
      groupByClause: this.groupByClause,
      havingClause: this.havingClause,
      limitClause: this.limitClause,
      orderByClause: this.orderByClause,
      spacing: spacing,
      verb: this.verb,
      whereClause: whereClause,
    });
  }

  filterAggregateRow(
    header: string | Timestamp | StringType,
    row: string | number | AdditiveExpression | Timestamp | StringType,
    operator: '!=' | '=' | '>' | '<' | 'like' | '>=' | '<=' | 'LIKE',
  ): SqlQuery {
    if (this.fromClause) {
      if (this.fromClause.fc instanceof SqlQuery) {
        this.fromClause.fc = this.fromClause.fc.filterAggregateRow(header, row, operator);
        return this;
      }
    }

    const spacing = this.spacing;
    let havingClause = this.havingClause;
    const headerBaseString =
      header instanceof Timestamp || header instanceof StringType
        ? header
        : stringFactory(header, '"');
    let rowBaseString;
    if (typeof row === 'number') {
      rowBaseString = numberFactory(row);
    } else if (row instanceof AdditiveExpression || row instanceof StringType) {
      rowBaseString = row;
    } else {
      rowBaseString = stringFactory(String(row), `'`);
    }

    const comparisonExpression = comparisonFactory(
      headerBaseString,
      comparisonRhsFactory(operator, rowBaseString),
    );

    // No having clause present
    if (!havingClause) {
      havingClause = havingFactory(comparisonExpression);
      this.spacing[6] = '\n';
    } else if (havingClause && havingClause.having instanceof OrExpression) {
      // filtered by an or clause
      havingClause = havingFactory(
        andExpressionFactory([subFactory(havingClause.having), comparisonExpression]),
      );
      this.spacing[6] = '\n';
    } else if (havingClause && havingClause.having instanceof AndExpression) {
      // Multiple
      let contained = false;
      havingClause.having.ex = havingClause.having.ex.map(filter => {
        if (
          filter instanceof ComparisonExpression &&
          filter.ex instanceof StringType &&
          filter.ex.chars === header
        ) {
          contained = true;
          return comparisonExpression;
        } else {
          return filter;
        }
      });
      if (!contained) {
        havingClause.having.ex.push(comparisonExpression);
        if (havingClause.having.spacing) {
          havingClause.having.spacing.push(' AND ');
        } else {
          havingClause.having.spacing = [' AND '];
        }
      }
    } else if (!(havingClause.having instanceof AndExpression)) {
      // only one
      if (
        havingClause.having instanceof ComparisonExpression &&
        havingClause.having.ex instanceof StringType &&
        havingClause.having.ex.chars === header
      ) {
        havingClause.having = comparisonExpression;
      } else {
        // @ts-ignore
        havingClause.having = andExpressionFactory([havingClause.having, comparisonExpression]);
      }
    }

    return new SqlQuery({
      columns: this.columns,
      distinct: this.distinct,
      fromClause: this.fromClause,
      groupByClause: this.groupByClause,
      havingClause: havingClause,
      limitClause: this.limitClause,
      orderByClause: this.orderByClause,
      spacing: spacing,
      verb: this.verb,
      whereClause: this.whereClause,
    });
  }

  getCurrentFilters(): string[] {
    if (this.whereClause) {
      if (this.whereClause.filter instanceof AndExpression) {
        return this.whereClause.filter.ex.flatMap(expression => {
          if (expression instanceof ComparisonExpression) {
            const filteredColumns: string[] = [];
            if (expression.ex instanceof StringType || expression.ex instanceof RefExpression) {
              filteredColumns.push(expression.ex.getBasicValue());
            }
            if (
              expression.rhs &&
              (expression.rhs.rhs instanceof StringType ||
                expression.rhs.rhs instanceof RefExpression)
            ) {
              filteredColumns.push(expression.rhs.rhs.getBasicValue());
            }
            return filteredColumns;
          }
          return [];
        });
      }
      if (this.whereClause.filter instanceof ComparisonExpression) {
        const filteredColumns: string[] = [];
        if (
          this.whereClause.filter.ex instanceof StringType ||
          this.whereClause.filter.ex instanceof RefExpression
        ) {
          filteredColumns.push(this.whereClause.filter.ex.getBasicValue());
        }
        if (
          this.whereClause.filter.rhs &&
          (this.whereClause.filter.rhs.rhs instanceof StringType ||
            this.whereClause.filter.rhs.rhs instanceof RefExpression)
        ) {
          filteredColumns.push(this.whereClause.filter.rhs.rhs.getBasicValue());
        }
        return filteredColumns;
      }
    }
    return [];
  }

  removeFilter(column: string): SqlQuery {
    let whereClauseEx = this.whereClause;
    if (this.whereClause && whereClauseEx && whereClauseEx.filter) {
      if (
        this.whereClause.filter instanceof AndExpression &&
        whereClauseEx.filter instanceof AndExpression
      ) {
        whereClauseEx.filter.ex = this.whereClause.filter.ex.filter(expression => {
          if (expression instanceof ComparisonExpression) {
            if (expression.ex) {
              if (
                expression.rhs &&
                (expression.rhs.rhs instanceof StringType ||
                  expression.rhs.rhs instanceof RefExpression) &&
                expression.rhs.rhs.getBasicValue() === column
              ) {
                return;
              } else if (
                (expression.ex instanceof StringType || expression.ex instanceof RefExpression) &&
                expression.ex.getBasicValue() === column
              ) {
                return;
              }
            }
          }
          return expression;
        });
        if (!whereClauseEx.filter.ex.length) {
          whereClauseEx = undefined;
        }
      }
      if (this.whereClause.filter instanceof ComparisonExpression) {
        if (
          (this.whereClause.filter.ex instanceof StringType ||
            this.whereClause.filter.ex instanceof RefExpression) &&
          this.whereClause.filter.ex.getBasicValue() === column
        ) {
          whereClauseEx = undefined;
        }
        if (
          this.whereClause.filter.rhs &&
          (this.whereClause.filter.rhs.rhs instanceof StringType ||
            this.whereClause.filter.rhs.rhs instanceof RefExpression) &&
          this.whereClause.filter.rhs.rhs.getBasicValue() === column
        ) {
          whereClauseEx = undefined;
        }
      }
    }
    return new SqlQuery({
      columns: this.columns,
      distinct: this.distinct,
      fromClause: this.fromClause,
      groupByClause: this.groupByClause,
      havingClause: this.havingClause,
      limitClause: this.limitClause,
      orderByClause: this.orderByClause,
      spacing: this.spacing,
      verb: this.verb,
      whereClause: whereClauseEx,
    });
  }

  getSorted(): { id: string; desc: boolean }[] {
    if (this.orderByClause) {
      return this.orderByClause.getSorted(this.columns);
    }
    return [];
  }

  getSchema(): string | undefined {
    if (this.fromClause) {
      return this.fromClause.getFromNameSpace();
    }
    return;
  }

  getTableName(): string | undefined {
    if (this.fromClause) {
      return this.fromClause.getFromName();
    }
    return;
  }

  getAggregateColumns() {
    if (!this.groupByClause) {
      return;
    }
    const aggregateColumns: string[] = [];
    const groupByColumns = this.groupByClause.groupBy.map(part => part.getBasicValue());
    this.columns.columns.map((column, index) => {
      index = index + 1;
      if (column.getAlias()) {
        const alias = column.getAlias();
        if (alias) {
          if (
            !arrayContains(
              alias.value instanceof StringType ? alias.value.getBasicValue() : alias.value,
              groupByColumns,
            ) &&
            !arrayContains(String(index), groupByColumns)
          ) {
            aggregateColumns.push(
              alias.value instanceof StringType ? alias.value.getBasicValue() : alias.value,
            );
          }
        }
      } else if (
        !arrayContains(column.getBasicValue(), groupByColumns) &&
        !arrayContains(String(index), groupByColumns)
      ) {
        aggregateColumns.push(column.getBasicValue());
      }
    });
    return aggregateColumns;
  }

  getColumnsArray() {
    return getColumns(this.columns);
  }

  toString() {
    const query = [];
    if (this.spacing[0]) {
      query.push(this.spacing[0]);
    }
    query.push(this.verb);
    if (this.spacing[1] && this.distinct) {
      query.push(this.spacing[1] + this.distinct);
    }
    query.push(this.spacing[2]);
    query.push(this.columns.toString());
    if (this.fromClause) {
      query.push(this.spacing[3]);
      query.push(this.fromClause.toString());
    }
    if (this.whereClause) {
      query.push(this.spacing[4]);
      query.push(this.whereClause.toString());
    }
    if (this.groupByClause) {
      query.push(this.spacing[5]);
      query.push(this.groupByClause.toString());
    }
    if (this.havingClause) {
      query.push(this.spacing[6]);
      query.push(this.havingClause.toString());
    }
    if (this.orderByClause) {
      query.push(this.spacing[7]);
      query.push(this.orderByClause.toString());
    }
    if (this.limitClause) {
      query.push(this.spacing[8]);
      query.push(this.limitClause.toString());
    }
    if (this.spacing[9]) {
      query.push(this.spacing[9]);
    }

    return query.join('');
  }
}
