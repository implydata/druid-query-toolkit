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
import { OrExpression, WhereClause } from '../..';
import { Parens } from '../helpers';

export interface ExpressionMaybeFilteredValue {
  parens: Parens[];
  ex: OrExpression | string;
  filter: WhereClause | null;
  spacing: string[];
}

export class ExpressionMaybeFiltered {
  public parens: Parens[];
  public ex: OrExpression | string;
  public filter: WhereClause | null;
  public spacing: string[];

  constructor(options: ExpressionMaybeFilteredValue) {
    this.parens = options.parens;
    this.ex = options.ex;
    this.filter = options.filter;
    this.spacing = options.spacing;
  }

  toString() {
    const val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + (paren.open[1] ? paren.open[1] : ''));
    });
    val.push(this.ex === '*' ? '*' : this.ex.toString());
    this.parens.map(paren => {
      val.push((paren.close[0] ? paren.close[0] : '') + paren.close[1]);
    });
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new ExpressionMaybeFiltered({
      parens: this.parens,
      ex: this.ex,
      filter: this.filter,
      spacing: this.spacing,
    });
  }
}
