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

import { OrExpression, StringType } from '../../../index';

import { OrderByPart } from './orderByPart';

export interface OrderByClauseValue {
  orderKeyword: string;
  byKeyword: string;
  orderBy: OrderByPart[];
  spacing: string[];
}

export class OrderByClause {
  public orderKeyword: string;
  public byKeyword: string;
  public orderBy: OrderByPart[];
  public spacing: string[];

  constructor(options: OrderByClauseValue) {
    this.orderBy = options.orderBy;
    this.orderKeyword = options.orderKeyword;
    this.byKeyword = options.byKeyword;
    this.spacing = options.spacing;
  }

  toString(): string {
    const val = [this.orderKeyword + this.spacing[0] + this.byKeyword + this.spacing[1]];
    this.orderBy.map((orderBy, index) => {
      val.push(orderBy.toString());
      if (index < this.spacing.length - 2 && this.spacing[2 + index]) {
        val.push(',' + this.spacing[2 + index]);
      }
    });
    return val.join('');
  }

  getDirection(column: string): string | null {
    let direction: string | null = '';
    this.orderBy.map(part => {
      if (part.getBasicValue() === column) {
        direction = part.direction;
      }
    });
    return direction;
  }

  getSorted() {
    const sorted: { id: string; desc: string | null }[] = [];
    this.orderBy.map(part => {
      sorted.push({
        id: part.getBasicValue(),
        desc: part.direction,
      });
    });
    return sorted;
  }

  orderByColumn(column: string, direction: string | null) {
    const baseString = new StringType({ chars: column, quote: '"', spacing: ['', ''] });
    this.orderBy = [
      new OrderByPart({
        direction: direction,
        spacing: [' '],
        orderBy: new OrExpression({ basicExpression: baseString }),
      }),
    ];
  }
}
