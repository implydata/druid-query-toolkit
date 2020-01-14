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

import { OrderByPart, StringType } from '../../../index';
import { Columns } from '../columns/columns';

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
      if (index < this.orderBy.length - 1 && this.spacing[2 + index]) {
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

  getSorted(columns: Columns) {
    const sorted: { id: string; desc: boolean }[] = [];
    this.orderBy.map(part => {
      const basicValue = part.getOrderValue(columns);
      sorted.push({
        id: basicValue ? basicValue : '',
        desc: part.direction === 'DESC' ? true : false,
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
        orderBy: baseString,
      }),
    ];
  }
}
