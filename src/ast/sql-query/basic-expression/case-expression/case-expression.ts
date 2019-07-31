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
import { CasePart } from '../../../index';
import { Parens, renderCloseParens, renderOpenParens } from '../../helpers';

export interface CaseExpressionValue {
  parens: Parens[];
  keyword: string;
  expr: any;
  cases: CasePart[];
  else: any[];
  end: any[];
}

export class CaseExpression {
  public parens: Parens[];
  public keyword: string;
  public expr: any;
  public cases: CasePart[];
  public else: any[];
  public end: any[];

  constructor(options: CaseExpressionValue) {
    this.parens = options.parens;
    this.keyword = options.keyword;
    this.expr = options.expr;
    this.cases = options.cases;
    this.else = options.else;
    this.end = options.end;
  }

  toString() {
    const val: string[] = [];
    val.push(renderOpenParens(this.parens));
    val.push(this.keyword + (this.expr ? this.expr[0] + this.expr[2].toString() : ''));
    this.cases.map((caseValue: any) => {
      val.push(caseValue[0] + caseValue[1].toString());
    });
    val.push(this.else[0] + this.else[1] + this.else[2] + this.else[3].toString());
    val.push(this.end[0] + this.end[1]);
    val.push(renderCloseParens(this.parens));
    return val.join('');
  }

  addParen(open: any[], close: any[]) {
    this.parens.push({ open, close });
    return new CaseExpression({
      parens: this.parens,
      keyword: this.keyword,
      expr: this.expr,
      cases: this.cases,
      else: this.else,
      end: this.end,
    });
  }
}
