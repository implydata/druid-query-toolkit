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

import {
  CaseExpression,
  ExpressionMaybeFiltered,
  Function,
  Integer,
  RefExpression,
  StringType,
  Sub,
} from '../../..';
import { Parens } from '../../helpers';
import { AdditiveExpression } from '../additiveExpression/additiveExpression';

import { ComparisonExpressionRhs } from './comparisonExpressionRhs';

export interface ComparisonExpressionValue {
  parens?: Parens[];
  rhs?: ComparisonExpressionRhs | null;
  ex?: AdditiveExpression;
  spacing?: string[] | null;
  basicExpression?:
    | Sub
    | StringType
    | RefExpression
    | Integer
    | Function
    | ExpressionMaybeFiltered
    | CaseExpression;
}

export class ComparisonExpression {
  public parens: Parens[];
  public ex: AdditiveExpression;
  public rhs: ComparisonExpressionRhs | null;
  public spacing: string[] | null;

  constructor(options: ComparisonExpressionValue) {
    this.rhs = options.rhs ? options.rhs : null;
    this.parens = options.parens ? options.parens : [];
    this.ex = options.ex
      ? options.ex
      : new AdditiveExpression({ basicExpression: options.basicExpression });
    this.spacing = options.spacing ? options.spacing : null;
  }

  toString() {
    const val: string[] = [];
    this.parens.map(paren => {
      val.push(paren.open[0] + paren.open[1]);
    });
    val.push(this.ex.toString());
    if (this.rhs) {
      val.push((this.spacing ? this.spacing[0] : '') + this.rhs.toString());
    }
    this.parens.map(paren => {
      val.push(paren.close[0] + paren.close[1]);
    });
    return val.join('');
  }

  getBasicValue(): string | undefined {
    return this.ex.getBasicValue();
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
