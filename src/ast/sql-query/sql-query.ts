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
  AndExpression,
  Column,
  Columns,
  ComparisonExpression,
  ComparisonExpressionRhs,
  FromClause,
  GroupByClause,
  HavingClause,
  Integer,
  LimitClause,
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
            newGroupByColumns.push(new Integer(Number(groupByColumn) - 1));
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
        groupByClause = undefined;
      }
    }
    return groupByClause;
  }

  filterRow(header: string, row: string, operator: '!=' | '='): SqlQuery {
    const spacing = this.spacing;
    let whereClause = this.whereClause;
    const headerBaseString = new StringType({ chars: header, quote: '"', spacing: ['', ''] });
    const rowBaseString = new StringType({ chars: row, quote: "'", spacing: ['', ''] });
    const rhs = new ComparisonExpressionRhs({
      parens: [],
      op: operator,
      is: null,
      not: null,
      rhs: rowBaseString,
      spacing: [''],
    });
    const comparisonExpression = new ComparisonExpression({
      ex: headerBaseString,
      rhs: rhs,
      parens: [],
      spacing: [''],
    });

    // No where clause present
    if (!whereClause) {
      whereClause = new WhereClause({
        keyword: 'WHERE',
        spacing: [' '],
        filter: comparisonExpression,
      });
      this.spacing[3] = '\n';
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
      this.spacing[3] = '\n';
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

  getSorted(): { id: string; desc: boolean }[] {
    if (this.orderByClause) {
      return this.orderByClause.getSorted(this.columns);
    }
    return [];
  }

  getSchema(): string | undefined {
    return this.fromClause.getFromNameSpace();
  }

  getTableName(): string | undefined {
    return this.fromClause.getFromName();
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
    const query = [this.verb, this.spacing[1]];
    query.push(this.columns.toString());
    if (this.fromClause) {
      query.push(this.spacing[2]);
      query.push(this.fromClause.toString());
    }
    if (this.whereClause) {
      query.push(this.spacing[3]);
      query.push(this.whereClause.toString());
    }
    if (this.groupByClause) {
      query.push(this.spacing[4]);
      query.push(this.groupByClause.toString());
    }
    if (this.havingClause) {
      query.push(this.spacing[5]);
      query.push(this.havingClause.toString());
    }
    if (this.orderByClause) {
      query.push(this.spacing[6]);
      query.push(this.orderByClause.toString());
    }
    if (this.limitClause) {
      query.push(this.spacing[7]);
      query.push(this.limitClause.toString());
    }
    if (this.spacing[8]) {
      query.push(this.spacing[8]);
    }

    return query.join('');
  }
}
