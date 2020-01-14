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
import { StringType } from '../..';

export interface IntervalValue {
  intervalKeyword: string;
  ex: StringType;
  unitKeyword: string;
  spacing: string[];
}

export class Interval {
  public intervalKeyword: string;
  public ex: StringType;
  public unitKeyword: string;
  public spacing: string[];

  constructor(options: IntervalValue) {
    this.intervalKeyword = options.intervalKeyword;
    this.ex = options.ex;
    this.unitKeyword = options.unitKeyword;
    this.spacing = options.spacing;
  }

  toString(): string {
    return (
      this.intervalKeyword +
      this.spacing[0] +
      this.ex.toString() +
      this.spacing[1] +
      this.unitKeyword
    );
  }
}
