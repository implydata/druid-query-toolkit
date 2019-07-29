/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { OrExpression } from '../../..';
import { Parens } from '../../helpers';
import { ExpressionMaybeFiltered } from '../expressionMaybeFiltered';

import { FilterClause } from './filterClause';

export interface FunctionValue {
  parens: Parens[];
  fn: string;
  value: ExpressionMaybeFiltered[];
  spacing: string[];
  distinct: string;
  filterClause: FilterClause;
}

export class Function {
  public parens: Parens[];
  public fn: any;
  public value: any[];
  public spacing: string[];
  public distinct: any;
  public filterClause: FilterClause;

  constructor(options: FunctionValue) {
    this.parens = options.parens;
    this.fn = options.fn;
    this.value = options.value;
    this.spacing = options.spacing;
    this.distinct = options.distinct;
    this.filterClause = options.filterClause;
  }

  toString() {
    const val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + (paren.open[1] ? paren.open[1] : ''));
    });
    val.push(this.fn + '(' + (this.spacing[0] ? this.spacing[0] : ''));
    if (this.distinct) {
      val.push(this.distinct[0] + this.spacing[1]);
    }
    this.value.map((value, index: number) => {
      val.push(value instanceof OrExpression ? value.toString() : value);
      if (index < this.value.length - 1 && this.spacing[2 + index]) {
        val.push(',' + this.spacing[2 + index]);
      }
    });
    val.push((this.spacing[3] ? this.spacing[3] : '') + ')');
    if (this.filterClause) {
      val.push(this.spacing[4] + this.filterClause.toString());
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
    });
  }
}