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
import { StringType } from '../index';

export interface Alias {
  spacing: string[];
  value: StringType | string;
  keyword: string;
}

export class Alias {
  public spacing: string[];
  public value: StringType | string;
  public keyword: string;

  constructor(options: Alias) {
    this.keyword = options.keyword;
    this.value = options.value;
    this.spacing = options.spacing;
  }

  toString() {
    return this.keyword + this.spacing[0] + this.value;
  }
}
