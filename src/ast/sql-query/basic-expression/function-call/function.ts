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
import { FilterClause, OrExpression, SpecialFunctionInnerArguments } from '../../../index';
import { Parens } from '../../helpers';

export interface FunctionValue {
  parens: Parens[];
  fn: string;
  value: any;
  spacing: string[];
  argumentSpacing: string[];
  distinct?: string;
  filterClause?: FilterClause;
}

export interface SpecialFunctionValue {
  parens: Parens[];
  fn: string;
  value: SpecialFunctionInnerArguments;
  spacing: string[];
  distinct?: string;
  filterClause?: FilterClause;
  argumentSpacing: string[];
}

export class Function {
  public parens: Parens[];
  public fn: any;
  public value: any[];
  public spacing: string[];
  public distinct?: string;
  public filterClause?: FilterClause;
  public argumentSpacing: string[];

  constructor(options: FunctionValue | SpecialFunctionValue) {
    this.parens = options.parens;
    this.fn = options.fn;
    this.value = options.value;
    this.spacing = options.spacing;
    this.distinct = options.distinct;
    this.filterClause = options.filterClause;
    this.argumentSpacing = options.argumentSpacing;
  }

  toString() {
    const val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + (paren.open[1] ? paren.open[1] : ''));
    });
    val.push(this.fn + '(' + (this.spacing[0] ? this.spacing[0] : ''));
    if (this.value instanceof SpecialFunctionInnerArguments) {
      val.push(this.value.toString());
    } else {
      if (this.distinct) {
        val.push(this.distinct + this.spacing[1]);
      }
      this.value.map((value, index: number) => {
        val.push(value instanceof OrExpression ? value.toString() : value);
        if (index < this.value.length - 1 && this.argumentSpacing[index]) {
          val.push(',' + this.argumentSpacing[index]);
        }
      });
    }
    val.push((this.spacing[2] ? this.spacing[2] : '') + ')');
    if (this.filterClause) {
      val.push(this.spacing[3] + this.filterClause.toString());
      return val.join('');
    }
    this.parens.map(paren => {
      val.push((paren.close[0] ? paren.close[0] : '') + paren.close[1]);
    });
    return val.join('');
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new Function({
      parens: this.parens,
      fn: this.fn,
      value: this.value,
      spacing: this.spacing,
      distinct: this.distinct,
      filterClause: this.filterClause,
      argumentSpacing: this.argumentSpacing,
    });
  }

  getBasicValue() {
    return undefined;
  }
}
