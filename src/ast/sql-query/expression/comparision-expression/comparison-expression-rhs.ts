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

import { Parens } from '../../helpers';

export interface ComparisonExpressionRhsValue {
  parens: Parens[];
  op: string | null;
  is: string | null;
  not: string | null;
  rhs: any;
  spacing: string[];
}

export class ComparisonExpressionRhs {
  public parens: Parens[];
  public op: string | null;
  public is: string | null;
  public not: string | null;
  public rhs: any;
  public spacing: string[];

  constructor(options: ComparisonExpressionRhsValue) {
    this.rhs = options.rhs;
    this.parens = options.parens;
    this.op = options.op;
    this.is = options.is;
    this.not = options.not;
    this.spacing = options.spacing;
  }

  toString() {
    const val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + paren.open[1]);
    });
    if (this.is) {
      if (this.not) {
        val.push(this.is + this.spacing[0] + this.not + this.spacing[1] + this.rhs.toString());
      } else {
        val.push(this.is + (this.spacing[0] ? this.spacing[0] : '') + this.rhs.toString());
      }
    } else if (this.op) {
      if (this.not) {
        val.push(this.op + this.spacing[0] + this.not + this.spacing[1] + this.rhs.toString());
      } else {
        val.push(this.op + (this.spacing[0] ? this.spacing[0] : '') + this.rhs.toString());
      }
    } else if (this.op) {
      val.push(this.not + (this.spacing[0] ? this.spacing[0] : '') + this.rhs.toString());
    } else {
      val.push((this.spacing[0] ? this.spacing[0] : '') + this.rhs.toString());
    }
    if (this.is) {
      val.push(this.is + (this.spacing[0] ? this.spacing[0] : '') + this.rhs.toString());
    }
    this.parens.map(paren => {
      val.push(paren.close[0] + paren.close[1]);
    });
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new ComparisonExpressionRhs({
      parens: this.parens,
      op: this.op,
      is: this.is,
      not: this.not,
      rhs: this.rhs,
      spacing: this.spacing,
    });
  }
}
