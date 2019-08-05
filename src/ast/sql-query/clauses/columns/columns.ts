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

import { Column } from './column';

export interface ColumnsValue {
  parens: Parens[];
  columns: Column[];
  spacing: string[];
}

export class Columns {
  public parens: Parens[];
  public columns: Column[];
  public spacing: string[];

  constructor(options: ColumnsValue) {
    this.parens = options.parens;
    this.columns = options.columns;
    this.spacing = options.spacing;
  }

  toString(): string {
    const val: string[] = [];
    renderOpenParens(this.parens);
    this.columns.map((column: Column, index: number) => {
      val.push(column.toString());
      if (index < this.columns.length - 1) {
        val.push(',' + this.spacing[index]);
      }
    });
    renderCloseParens(this.parens);
    return val.join('');
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new Columns({ parens: this.parens, columns: this.columns, spacing: this.spacing });
  }
}
