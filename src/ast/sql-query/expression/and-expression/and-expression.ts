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

import {
  AndPart,
  CaseExpression,
  ComparisonExpression,
  Function,
  NumberType,
  RefExpression,
  StringType,
  Sub,
} from '../../../index';
import { Parens } from '../../helpers';

export interface AndExpressionValue {
  parens?: Parens[];
  ex: (
    | ComparisonExpression
    | AndPart
    | Sub
    | StringType
    | RefExpression
    | NumberType
    | Function
    | CaseExpression)[];
  spacing?: string[] | null;
}

export class AndExpression {
  public parens: Parens[];
  public ex: (
    | ComparisonExpression
    | AndPart
    | Sub
    | StringType
    | RefExpression
    | NumberType
    | Function
    | CaseExpression)[];
  public spacing: string[] | null;

  constructor(options: AndExpressionValue) {
    this.parens = options.parens ? options.parens : [];
    this.ex = options.ex;
    this.spacing = options.spacing ? options.spacing : null;
  }

  toString() {
    const val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + paren.open[1]);
    });
    this.ex.map((part, index: number) => {
      if (index !== 0 && this.spacing) {
        val.push(this.spacing[index - 1]);
      }
      val.push(part.toString());
    });
    this.parens.map(paren => {
      val.push(paren.close[0] + paren.close[1]);
    });
    return val.join('');
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new AndExpression({ parens: this.parens, ex: this.ex, spacing: this.spacing });
  }
}
