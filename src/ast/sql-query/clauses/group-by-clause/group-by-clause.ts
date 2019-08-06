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

import { Function, NumberType, OrExpression, RefExpression, StringType, Sub } from '../../../index';

export interface GroupByClauseValue {
  groupKeyword: string;
  byKeyword: string;
  groupBy: OrExpression[];
  spacing: string[];
}

export class GroupByClause {
  public groupKeyword: string;
  public byKeyword: string;
  public groupBy: (Sub | StringType | RefExpression | NumberType | Function)[];
  public spacing: string[];

  constructor(options: GroupByClauseValue) {
    this.groupKeyword = options.groupKeyword;
    this.byKeyword = options.byKeyword;
    this.groupBy = options.groupBy;
    this.spacing = options.spacing;
  }

  toString(): string {
    const val = [this.groupKeyword + this.spacing[0] + this.byKeyword + this.spacing[1]];
    this.groupBy.map((groupBy, index: number) => {
      val.push(groupBy.toString());
      if (index < this.groupBy.length - 1) {
        val.push(',' + (this.spacing[2][index] ? this.spacing[2][index] : ''));
      }
    });
    return val.join('');
  }
}
