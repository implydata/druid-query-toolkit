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
import { Parens, renderCloseParens, renderOpenParens } from '../../helpers';

export interface MultiplicativeExpressionValue {
  parens?: Parens[];
  op?: string[] | null;
  ex?: (
    | Sub
    | StringType
    | RefExpression
    | Integer
    | Function
    | ExpressionMaybeFiltered
    | CaseExpression
    | null)[];
  spacing?: string[];
}

export class MultiplicativeExpression {
  public parens: Parens[];
  public ex: (
    | Sub
    | StringType
    | RefExpression
    | Integer
    | Function
    | ExpressionMaybeFiltered
    | CaseExpression
    | null)[];
  public op: string[] | null;
  public spacing: string[];

  constructor(options: MultiplicativeExpressionValue) {
    this.parens = options.parens ? options.parens : [];
    this.op = options.op ? options.op : null;
    this.ex = options.ex ? options.ex : [null];
    this.spacing = options.spacing ? options.spacing : [''];
  }

  toString() {
    const val: string[] = [];
    val.push(renderOpenParens(this.parens));
    this.ex.map((ex, index) => {
      val.push(ex ? ex.toString() : '');
      if (index < this.ex.length - 1) {
        val.push(
          (this.spacing[index][0] ? this.spacing[index][0] : '') +
            this.op +
            (this.spacing[index][2] ? this.spacing[index][2] : ''),
        );
      }
    });
    val.push(renderCloseParens(this.parens));
    return val.join('');
  }

  getBasicValue(): string | undefined {
    if (!(this.ex instanceof Function)) {
      // @ts-ignore
      return this.ex[0].getBasicValue();
    } else {
      return undefined;
    }
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new MultiplicativeExpression({
      parens: this.parens,
      ex: this.ex,
      spacing: this.spacing,
      op: this.op,
    });
  }
}
