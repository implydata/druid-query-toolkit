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
  Column,
  Columns,
  ComparisonExpression,
  ComparisonExpressionRhs,
  FilterClause,
  FromClause,
  Function,
  GroupByClause,
  HavingClause,
  LimitClause,
  NumberType,
  OrderByClause,
  OrderByPart,
  OrExpression,
  StringType,
  Sub,
  WhereClause,
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
  ): SqlQuery {
    if (!this.groupByClause) {
      return this;
    }

    const functionValue = new Function({
      parens: [],
      fn: functionName,
      value: argumentsArray,
      spacing: spacing,
    });
    const columns = this.columns.columns;
    const columnSpacing = this.columns.spacing;
    columnSpacing.unshift(' ');
    columns.unshift(
      new Column({
        alias: null,
        spacing: [],
        parens: [],
        ex: functionValue,
      }),
    );
    const groupby = this.groupByClause.groupBy.map(part =>
      part instanceof NumberType ? new NumberType(Number(part.value) + 1) : part,
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

  addToGroupBy(columnName: string): SqlQuery {
    if (!this.groupByClause) {
      return this;
    }
    const columns = this.columns.columns;
    const columnSpacing = this.columns.spacing;
    columnSpacing.unshift(' ');
    columns.unshift(
      new Column({
        alias: null,
        spacing: [],
        parens: [],
        ex: new StringType({ chars: columnName, quote: '"', spacing: [] }),
      }),
    );
    const groupby = this.groupByClause.groupBy.map(part =>
      part instanceof NumberType ? new NumberType(Number(part.value) + 1) : part,
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
    columnName: string,
    functionName: string,
    alias?: Alias,
    distinct?: boolean,
    filter?: FilterClause,
  ): SqlQuery {
    const column = new Function({
      parens: [],
      fn: functionName,
      value: [new StringType({ spacing: [], quote: '"', chars: columnName })],
      spacing: distinct ? ['', ' '] : [],
      filterClause: filter ? filter : undefined,
      distinct: distinct ? 'DISTINCT' : undefined,
    });
    if (distinct) {
      column.spacing = ['', ' ', '', '', ''];
    }
    if (filter) {
      if (column.spacing.length) {
        column.spacing[4] = ' ';
      } else {
        column.spacing = ['', '', '', '', ' '];
      }
    }

    const columns = this.columns.columns;
    const columnSpacing = this.columns.spacing;
    columnSpacing.push(' ');
    columns.push(
      new Column({
        alias: alias ? alias : null,
        spacing: [alias ? ' ' : ''],
        parens: [],
        ex: column,
      }),
    );

    return new SqlQuery({
      columns: new Columns({ columns: columns, parens: [], spacing: columnSpacing }),
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
    if (!this.orderByClause) {
      return;
    } else {
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
    }
    return undefined;
  }

  getGroupByClauseWithoutColumn(columnVal: string): GroupByClause | undefined {
    let groupByClause;
    if (this.groupByClause) {
      const groupByColumns = this.groupByClause.groupBy.map(part => part.getBasicValue());

      if (this.groupByClause.groupBy.length > 1) {
        // get array of grouping columns as strings
        const newGroupByColumns: any[] = [];

        groupByColumns.map((groupByColumn, index) => {
          // if grouping column is a number and the column to be removed is less than that column decrease the value of the grouping column by 1
          if (this.getColumnsArray().indexOf(columnVal) + 1 < Number(groupByColumn)) {
            newGroupByColumns.push(new NumberType(Number(groupByColumn) - 1));
          } else if (this.getColumnsArray().indexOf(columnVal) + 1 > Number(groupByColumn)) {
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
        if (
          columnVal !== groupByColumns[0] &&
          this.getColumnsArray().indexOf(columnVal) + 1 < Number(groupByColumns[0])
        ) {
          groupByClause = new GroupByClause({
            groupBy: [
              new OrExpression({
                ex: [new NumberType(groupByColumns[0] - 1)],
                parens: [],
                spacing: [],
              }),
            ],
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
    }
    return groupByClause;
  }

  filterRow(
    header: string,
    row: string | number | AdditiveExpression,
    operator: '!=' | '=' | '>' | '<' | 'like' | '>=' | '<=' | 'LIKE',
  ): SqlQuery {
    const aggregateColumns = this.getAggregateColumns();
    if (aggregateColumns) {
      if (aggregateColumns.includes(header)) {
        return this.filterAggregateRow(header, row, operator);
      }
    }

    const spacing = this.spacing;
    let whereClause = this.whereClause;
    const headerBaseString = new StringType({ chars: header, quote: '"', spacing: ['', ''] });
    // @ts-ignore
    let rowBaseString;
    if (typeof row === 'number') {
      rowBaseString = new NumberType(row);
    } else if (row instanceof AdditiveExpression) {
      rowBaseString = row;
    } else {
      rowBaseString = new StringType({
        chars: String(row),
        quote: "'",
        spacing: ['', ''],
      });
    }

    const rhs = new ComparisonExpressionRhs({
      parens: [],
      op: operator,
      rhs: rowBaseString,
      spacing: [' '],
    });
    const comparisonExpression = new ComparisonExpression({
      ex: headerBaseString,
      rhs: rhs,
      parens: [],
      spacing: [' '],
    });

    // No where clause present
    if (!whereClause) {
      whereClause = new WhereClause({
        keyword: 'WHERE',
        spacing: [' '],
        filter: comparisonExpression,
      });
      this.spacing[4] = '\n';
    } else if (whereClause && whereClause.filter instanceof OrExpression) {
      // filtered by an or clause
      whereClause = new WhereClause({
        keyword: 'WHERE',
        spacing: [' '],
        filter: new AndExpression({
          parens: [],
          ex: [
            new Sub({ parens: [{ open: ['(', ''], close: ['', ')'] }], ex: whereClause.filter }),
            comparisonExpression,
          ],
          spacing: [' AND '],
        }),
      });
      this.spacing[4] = '\n';
    } else if (whereClause && whereClause.filter instanceof AndExpression) {
      // Multiple
      let contained = false;
      whereClause.filter.ex = whereClause.filter.ex.map(filter => {
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
        whereClause.filter.ex.chars === header
      ) {
        whereClause.filter = comparisonExpression;
      } else {
        whereClause.filter = new AndExpression({
          parens: [],
          spacing: [' AND '],
          // @ts-ignore I know this is wrong but Idk how to fix it
          ex: [whereClause.filter, comparisonExpression],
        });
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
    header: string,
    row: string | number | AdditiveExpression,
    operator: '!=' | '=' | '>' | '<' | 'like' | '>=' | '<=' | 'LIKE',
  ): SqlQuery {
    const spacing = this.spacing;
    let havingClause = this.havingClause;
    const headerBaseString = new StringType({ chars: header, quote: '"', spacing: ['', ''] });
    let rowBaseString;
    if (typeof row === 'number') {
      rowBaseString = new NumberType(row);
    } else if (row instanceof AdditiveExpression) {
      rowBaseString = row;
    } else {
      rowBaseString = new StringType({
        chars: String(row),
        quote: "'",
        spacing: ['', ''],
      });
    }
    const rhs = new ComparisonExpressionRhs({
      parens: [],
      op: operator,
      rhs: rowBaseString,
      spacing: [''],
    });
    const comparisonExpression = new ComparisonExpression({
      ex: headerBaseString,
      rhs: rhs,
      parens: [],
      spacing: [''],
    });

    // No having clause present
    if (!havingClause) {
      havingClause = new HavingClause({
        keyword: 'HAVING',
        spacing: [' '],
        having: comparisonExpression,
      });
      this.spacing[6] = '\n';
    } else if (havingClause && havingClause.having instanceof OrExpression) {
      // filtered by an or clause
      havingClause = new HavingClause({
        keyword: 'HAVING',
        spacing: [' '],
        having: new AndExpression({
          parens: [],
          ex: [
            new Sub({ parens: [{ open: ['(', ''], close: ['', ')'] }], ex: havingClause.having }),
            comparisonExpression,
          ],
          spacing: [' AND '],
        }),
      });
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
        havingClause.having = new AndExpression({
          parens: [],
          spacing: [' AND '],
          // @ts-ignore I know this is wrong but Idk how to fix it
          ex: [havingClause.having, comparisonExpression],
        });
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
