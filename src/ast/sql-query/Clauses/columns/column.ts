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
import { Alias } from '../../alias';
import { CaseExpression } from '../../BasicExpression/caseExpression/caseExpression';
import { Parens, renderCloseParens, renderOpenParens } from '../../helpers';

export interface ColumnValue {
  parens: Parens[];
  ex: CaseExpression | any;
  alias: Alias | null;
  spacing: string[];
}

export class Column {
  public parens: Parens[];
  public ex: CaseExpression | any;
  public alias: Alias | null;
  public spacing: string[];

  constructor(options: ColumnValue) {
    this.parens = options.parens;
    this.ex = options.ex;
    this.alias = options.alias;
    this.spacing = options.spacing;
  }

  getAlias(): Alias | undefined {
    if (this.alias) {
      return this.alias;
    }
    return;
  }

  toString() {
    if (this.alias) {
      return (
        renderOpenParens(this.parens) +
        this.ex +
        this.spacing[0] +
        this.alias.toString() +
        renderCloseParens(this.parens)
      );
    }
    return renderOpenParens(this.parens) + this.ex + renderCloseParens(this.parens);
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new Column({
      parens: this.parens,
      ex: this.ex,
      alias: this.alias,
      spacing: this.spacing,
    });
  }

  getBasicValue() {
    return this.ex.getBasicValue();
  }
}
