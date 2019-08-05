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

import { AndExpression } from '../../../index';

export interface OrPartValue {
  ex: AndExpression;
  keyword: string;
  spacing: string[];
}

export class OrPart {
  public ex: AndExpression;
  public keyword: string;
  public spacing: string[];

  constructor(options: OrPartValue) {
    this.ex = options.ex;
    this.keyword = options.keyword;
    this.spacing = options.spacing;
  }

  toString() {
    return (this.keyword ? this.keyword : '') + this.spacing[0] + this.ex.toString();
  }
}
