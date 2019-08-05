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
import { RefExpression, SqlQuery, StringType } from '../..';
import { Alias } from '../alias';
import { Parens, renderCloseParens, renderOpenParens } from '../helpers';

export interface FromClauseValue {
  parens: Parens[];
  keyword: string;
  fc: RefExpression | SqlQuery;
  spacing: string[];
  alias: Alias;
}

export class FromClause {
  public parens: Parens[];
  public keyword: string;
  public fc: RefExpression | SqlQuery;
  public spacing: string[];
  public alias: Alias;

  constructor(options: FromClauseValue) {
    this.parens = options.parens;
    this.keyword = options.keyword;
    this.fc = options.fc;
    this.spacing = options.spacing;
    this.alias = options.alias;
  }

  toString(): string {
    if (this.alias) {
      return (
        renderOpenParens(this.parens) +
        this.keyword +
        this.spacing[0] +
        this.fc.toString() +
        this.spacing[1] +
        Alias.toString() +
        renderCloseParens(this.parens)
      );
    }
    return (
      renderOpenParens(this.parens) +
      this.keyword +
      this.spacing[0] +
      this.fc.toString() +
      renderCloseParens(this.parens)
    );
  }

  getFromNameSpace(): string | undefined {
    return this.fc instanceof RefExpression
      ? this.fc.namespace instanceof StringType
        ? this.fc.namespace.chars
        : this.fc.namespace
      : undefined;
  }

  getFromName(): string | undefined {
    return this.fc instanceof RefExpression
      ? this.fc.name instanceof StringType
        ? this.fc.name.chars
        : this.fc.name
      : undefined;
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new FromClause({
      parens: this.parens,
      keyword: this.keyword,
      fc: this.fc,
      alias: this.alias,
      spacing: this.spacing,
    });
  }
}
