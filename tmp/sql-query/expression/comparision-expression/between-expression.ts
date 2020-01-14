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

import { AdditiveExpression } from '../../..';

export interface BetweenExpressionValue {
  keyword: string;
  start: AdditiveExpression;
  end: AdditiveExpression;
  andKeyword: string;
  spacing: string[];
}

export class BetweenExpression {
  public keyword: string;
  public start: AdditiveExpression;
  public end: AdditiveExpression;
  public andKeyword: string;
  public spacing: string[];

  constructor(options: BetweenExpression) {
    this.keyword = options.keyword;
    this.start = options.start;
    this.spacing = options.spacing;
    this.end = options.end;
    this.andKeyword = options.andKeyword;
  }

  toString() {
    return (
      this.keyword +
      this.spacing[0] +
      this.start.toString() +
      this.spacing[1] +
      this.andKeyword +
      this.spacing[2] +
      this.end.toString()
    );
  }
}
