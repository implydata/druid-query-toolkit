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

import { NumberType, RefExpression, StringType } from '../../index';

export interface TimestampValue {
  value: NumberType | StringType | RefExpression;
  spacing: string[];
  keyword: string;
}

export class Timestamp {
  public value: NumberType | StringType | RefExpression;
  public spacing: string[];
  public keyword: string;

  constructor(options: TimestampValue) {
    this.value = options.value;
    this.spacing = options.spacing;
    this.keyword = options.keyword;
  }

  toString(): string {
    return this.keyword + this.spacing + this.value.toString();
  }

  getBasicValue() {
    return this.value;
  }
}
