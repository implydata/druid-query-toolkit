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
  AdditiveExpression,
  CaseExpression,
  ComparisonExpressionRhs,
  Function,
  Integer,
  RefExpression,
  StringType,
  Sub,
} from '../../../index';
import { Parens, renderCloseParens, renderOpenParens } from '../../helpers';

export interface ComparisonExpressionValue {
  parens?: Parens[];
  rhs?: ComparisonExpressionRhs | null;
  ex: AdditiveExpression | Sub | StringType | RefExpression | Integer | Function | CaseExpression;
  spacing?: string[] | null;
}

export class ComparisonExpression {
  public parens: Parens[];
  public ex:
    | AdditiveExpression
    | Sub
    | StringType
    | RefExpression
    | Integer
    | Function
    | CaseExpression;
  public rhs: ComparisonExpressionRhs | null;
  public spacing: string[] | null;

  constructor(options: ComparisonExpressionValue) {
    this.rhs = options.rhs ? options.rhs : null;
    this.parens = options.parens ? options.parens : [];
    this.ex = options.ex;
    this.spacing = options.spacing ? options.spacing : null;
  }

  toString() {
    const val: string[] = [];
    renderOpenParens(this.parens);
    val.push(this.ex.toString());
    if (this.rhs) {
      val.push((this.spacing ? this.spacing[0] : '') + this.rhs.toString());
    }
    renderCloseParens(this.parens);
    return val.join('');
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new ComparisonExpression({
      parens: this.parens,
      ex: this.ex,
      spacing: this.spacing,
      rhs: this.rhs,
    });
  }
}
