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

import { CaseExpression, Function, Integer, RefExpression, StringType } from '../../..';
import { getColumns } from '../../helpers';
import { Columns } from '../columns/columns';

export interface OrderByPartValue {
  direction: string | null;
  orderBy: StringType | RefExpression | Integer | Function | CaseExpression;
  spacing: string[];
}

export class OrderByPart {
  public direction: string | null;
  orderBy: StringType | RefExpression | Integer | Function | CaseExpression;
  public spacing: string[];

  constructor(options: OrderByPartValue) {
    this.direction = options.direction;
    this.spacing = options.spacing;
    this.orderBy = options.orderBy;
  }

  toString(): string {
    return this.orderBy.toString() + this.spacing[0] + this.direction;
  }

  getOrderValue(columns: Columns): string | undefined {
    if (!(this.orderBy instanceof CaseExpression)) {
      if (this.orderBy instanceof Integer) {
        return getColumns(columns)[this.orderBy.value];
      }
      const value: string | number | undefined = this.orderBy.getBasicValue();
      return value;
    }
    return;
  }

  getBasicValue(): string {
    return this.orderBy.toString();
  }
}
