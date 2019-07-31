/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
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
  AndExpression,
  AndPart,
  Column,
  Columns,
  ComparisonExpression,
  ComparisonExpressionRhs,
  FromClause,
  GroupByClause,
  HavingClause,
  Integer,
  LimitClause,
  NotExpression,
  OrderByClause,
  OrExpression,
  OrPart,
  StringType,
  Sub,
  WhereClause,
} from '../index';

import { arrayContains } from './helpers';
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

  orderBy(column: string, direction: string): SqlQuery {
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
      orderByClause: this.orderByClause,
      spacing: this.spacing,
      verb: this.verb,
      whereClause: this.whereClause,
    });
    return query;
  }

  getGroupByClauseWithoutColumn(columnVal: string): GroupByClause | undefined {
    let groupByClause;
    if (this.groupByClause) {
      if (arrayContains(columnVal, this.getAggregateColumns())) {
        const groupByColumns = this.groupByClause.groupBy.map(part => part.getBasicValue());
        const newGroupByColumns: OrExpression[] = [];
        groupByColumns.map((groupByColumn, index) => {
          if (this.getColumnsArray().indexOf(columnVal) + 1 < Number(groupByColumn)) {
            newGroupByColumns.push(
              new OrExpression({ basicExpression: new Integer(Number(groupByColumn) - 1) }),
            );
          } else {
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

  excludeRow(header: string, row: string, operator: string): SqlQuery {
    const spacing = this.spacing;
    let whereClause = this.whereClause;
    const headerBaseString = new StringType({ chars: header, quote: "'", spacing: ['', ''] });
    const rowBaseString = new StringType({ chars: row, quote: "'", spacing: ['', ''] });
    const rhs = new ComparisonExpressionRhs({
      parens: [],
      op: operator,
      is: null,
      not: null,
      rhs: new AdditiveExpression({ basicExpression: rowBaseString }),
      spacing: [''],
    });

    if (!this.whereClause) {
      spacing[3] = '\n';
      const or = new OrExpression({ basicExpression: headerBaseString, spacing: [''] });
      or.ex[0].ex.ex[0].ex.ex.rhs = rhs;
      whereClause = new WhereClause({
        keyword: 'WHERE',
        filter: or,
        spacing: [' '],
      });
    } else {
      if (this.whereClause.filter.ex.length > 1) {
        const head = new OrPart({
          keyword: '',
          spacing: [''],
          ex: new AndExpression({
            ex: [
              new AndPart({
                ex: new NotExpression({
                  basicExpression: new Sub({
                    parens: [{ open: ['(', ''], close: ['', ')'] }],
                    ex: this.whereClause.filter,
                  }),
                }),
                spacing: [''],
                keyword: '',
              }),
            ],
          }),
        });
        const tail = new OrPart({
          keyword: 'OR',
          spacing: [' '],
          ex: new AndExpression({
            ex: [
              new AndPart({
                ex: new NotExpression({
                  ex: new ComparisonExpression({
                    basicExpression: headerBaseString,
                    rhs: rhs,
                  }),
                }),
                keyword: '',
                spacing: [''],
              }),
            ],
          }),
        });
        whereClause = new WhereClause({
          keyword: 'WHERE',
          filter: new OrExpression({ ex: [head, tail], spacing: [' '] }),
          spacing: [' '],
        });
      } else {
        let found = false;
        const WhereAndParts = whereClause ? whereClause.filter.ex[0].ex.ex : [];

        WhereAndParts.map(part => {
          if (part.ex.getBasicValue() === header) {
            found = true;
            part.ex.ex.rhs = rhs;
          }
        });

        if (!found) {
          WhereAndParts.push(
            new AndPart({
              keyword: 'AND',
              spacing: [' '],
              ex: new NotExpression({
                ex: new ComparisonExpression({
                  basicExpression: headerBaseString,
                  rhs: rhs,
                }),
              }),
            }),
          );
        }
        if (whereClause) {
          if (whereClause.filter.ex[0].ex.spacing) {
            whereClause.filter.ex[0].ex.spacing.push(' ');
          } else {
            whereClause.filter.ex[0].ex.spacing = [' '];
          }
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
      spacing: spacing,
      verb: this.verb,
      whereClause: whereClause,
    });
  }

  getDirection(column: string): string | null {
    if (this.orderByClause) {
      return this.orderByClause.getDirection(column);
    }
    return '';
  }

  getSorted(): { id: string; desc: boolean }[] {
    if (this.orderByClause) {
      return this.orderByClause.getSorted();
    }
    return [];
  }

  getFromNameSpace(): string | undefined {
    return this.fromClause.getFromNameSpace();
  }

  getFromName(): string | undefined {
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
    const columnsArray: string[] = [];
    this.columns.columns.map(column => {
      if (column.getAlias()) {
        const alias = column.getAlias();
        if (alias) {
          columnsArray.push(
            alias.value instanceof StringType ? alias.value.getBasicValue() : alias.value,
          );
        }
      } else if (column.getBasicValue()) {
        columnsArray.push(column.getBasicValue());
      }
    });
    return columnsArray;
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
