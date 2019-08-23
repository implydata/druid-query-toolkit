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
import { RefExpression, StringType, WhereClause } from '../../..';

export interface SpecialFunctionInnerArgumentsValue {
  keyWord: string;
  fromKeyWord: string;
  spacing: string[];
  chars: StringType | RefExpression;
  ex: WhereClause;
}

export class SpecialFunctionInnerArguments {
  public keyWord: string;
  public fromKeyWord: string;
  public spacing: string[];
  public chars: StringType | RefExpression;
  public ex: WhereClause;

  constructor(options: SpecialFunctionInnerArgumentsValue) {
    this.keyWord = options.keyWord;
    this.spacing = options.spacing;
    this.ex = options.ex;
    this.chars = options.chars;
    this.fromKeyWord = options.fromKeyWord;
  }

  toString() {
    return (
      this.keyWord +
      this.spacing[0] +
      this.chars.toString() +
      this.spacing[1] +
      this.fromKeyWord +
      this.spacing[2] +
      this.ex.toString()
    );
  }
}
