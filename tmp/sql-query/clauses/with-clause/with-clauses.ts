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

import { Parens, renderCloseParens, renderOpenParens } from '../../helpers';

import { WithClause } from './with-clause';

export interface WithClausesValue {
  parens: Parens[];
  withClauses: WithClause[];
  spacing: string[];
}

export class WithClauses {
  public parens: Parens[];
  public withClauses: WithClause[];
  public spacing: string[];

  constructor(options: WithClausesValue) {
    this.parens = options.parens;
    this.withClauses = options.withClauses;
    this.spacing = options.spacing;
  }

  toString(): string {
    const val: string[] = [];
    renderOpenParens(this.parens);
    this.withClauses.map((withClause: WithClause, index: number) => {
      val.push(withClause.toString());
      if (index < this.withClauses.length - 1) {
        val.push(',' + this.spacing[index]);
      }
    });
    renderCloseParens(this.parens);
    return val.join('');
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new WithClauses({
      parens: this.parens,
      withClauses: this.withClauses,
      spacing: this.spacing,
    });
  }
}
