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
import { RefExpression, SqlQuery, StringType } from '../../index';
import { Alias } from '../alias';
import { Parens, renderCloseParens, renderOpenParens } from '../helpers';

export interface FromClauseValue {
  parens: Parens[];
  keyword: string;
  fc: RefExpression | SqlQuery;
  spacing: string[];
  alias?: Alias;
}

export class FromClause {
  public parens: Parens[];
  public keyword: string;
  public fc: RefExpression | SqlQuery;
  public spacing: string[];
  public alias?: Alias;

  constructor(options: FromClauseValue) {
    this.parens = options.parens;
    this.keyword = options.keyword;
    this.fc = options.fc;
    this.spacing = options.spacing;
    this.alias = options.alias;
  }

  toString(): string {
    const stringVal = [];
    stringVal.push(renderOpenParens(this.parens));
    stringVal.push(this.keyword + this.spacing[0]);
    if (this.fc instanceof SqlQuery) {
      stringVal.push('(' + this.fc.toString() + ')');
    } else {
      stringVal.push(this.fc.toString());
    }
    if (this.alias) {
      stringVal.push(this.alias.toString());
    }
    stringVal.push(renderCloseParens(this.parens));
    return stringVal.join('');
  }

  getFromNameSpace(): string | undefined {
    if (this.fc instanceof RefExpression) {
      if (this.fc.namespace instanceof StringType) {
        return this.fc.namespace.chars;
      }
      return this.fc.namespace;
    }
    if (this.fc instanceof SqlQuery) {
      return this.fc.getSchema();
    }
    return;
  }

  getFromName(): string | undefined {
    if (this.fc instanceof RefExpression) {
      if (this.fc.name instanceof StringType) {
        return this.fc.name.chars;
      }
      return this.fc.name;
    }
    if (this.fc instanceof SqlQuery) {
      return this.fc.getTableName();
    }
    return;
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
