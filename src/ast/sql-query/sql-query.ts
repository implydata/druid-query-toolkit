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

import { StringType } from './BasicExpression/stringType';
import { Sub } from './BasicExpression/sub';
import { Column } from './Clauses/columns/column';
import { Columns } from './Clauses/columns/columns';
import { FromClause } from './Clauses/fromClause';
import { GroupByClause } from './Clauses/groupByClause';
import { HavingClause } from './Clauses/havingClause';
import { LimitClause } from './Clauses/limitClause';
import { OrderByClause } from './Clauses/orderByClause/orderByClause';
import { WhereClause } from './Clauses/whereClause';
import { AdditiveExpression } from './Expression/additiveExpression/additiveExpression';
import { AndExpression } from './Expression/andExpression/andExpression';
import { AndPart } from './Expression/andExpression/andPart';
import { ComparisonExpression } from './Expression/comparisionExpression/comparisonExpression';
import { ComparisonExpressionRhs } from './Expression/comparisionExpression/comparisonExpressionRhs';
import { NotExpression } from './Expression/notExpression/notExpression';
import { OrExpression } from './Expression/orExpression/orExpression';
import { OrPart } from './Expression/orExpression/orPart';

export interface SqlQueryValue {
  verb: string;
  distinct: string;
  columns: Columns;
  fromClause: FromClause;
  whereClause: WhereClause;
  groupByClause: GroupByClause;
  havingClause: HavingClause;
  orderByClause: OrderByClause;
  limitClause: LimitClause;
  spacing: string[];
}

export class SqlQuery extends BaseAst {
  public verb: string;
  public distinct: string;
  public columns: Columns;
  public fromClause: FromClause;
  public whereClause: WhereClause;
  public groupByClause: GroupByClause;
  public havingClause: HavingClause;
  public orderByClause: OrderByClause;
  public limitClause: LimitClause;
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

  orderBy(column: string, direction: string): SqlQueryValue {
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

  excludeColumn(columnVal: string): SqlQueryValue {
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

    return new SqlQuery({
      columns: columnsArray,
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

  excludeRow(header: string, row: string, operator: string): SqlQueryValue {
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
                    spacing: ['', ''],
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
        const WhereAndParts = whereClause.filter.ex[0].ex.ex;

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

        if (whereClause.filter.ex[0].ex.spacing) {
          whereClause.filter.ex[0].ex.spacing.push(' ');
        } else {
          whereClause.filter.ex[0].ex.spacing = [' '];
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

  getSorted() {
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
