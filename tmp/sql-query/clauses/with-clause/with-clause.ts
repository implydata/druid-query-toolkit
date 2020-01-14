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
import { Columns, RefExpression, Sub } from '../../../index';

export interface WithClauseValue {
  keyword: string;
  columns: Columns;
  asKeyword: string;
  tableName: RefExpression;
  sub: Sub;
  spacing: string[];
}

export class WithClause {
  public keyword: string;
  public columns: Columns;
  public asKeyword: string;
  public tableName: RefExpression;
  public sub: Sub;
  public spacing: string[];

  constructor(options: WithClauseValue) {
    this.keyword = options.keyword;
    this.columns = options.columns;
    this.asKeyword = options.asKeyword;
    this.tableName = options.tableName;
    this.sub = options.sub;
    this.spacing = options.spacing;
  }

  toString(): string {
    const stringValue = [];
    if (this.keyword) {
      stringValue.push(this.keyword + this.spacing[0]);
    }
    stringValue.push(this.tableName.toString());
    if (this.spacing[1]) {
      stringValue.push(this.spacing[1]);
    }
    stringValue.push('(');
    if (this.spacing[2]) {
      stringValue.push(this.spacing[2]);
    }
    stringValue.push(this.columns.toString());
    if (this.spacing[3]) {
      stringValue.push(this.spacing[3]);
    }
    stringValue.push(
      ')' + this.spacing[4] + this.asKeyword + this.spacing[5] + this.sub.toString(),
    );
    return stringValue.join('');
  }
}
