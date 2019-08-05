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
import { Column } from '../../../index';
import { Parens, renderCloseParens, renderOpenParens } from '../../helpers';

export interface ConcatValue {
  parens: Parens[];
  parts: Column[];
  spacing: string[];
}

export class Concat {
  public parens: Parens[];
  public parts: Column[];
  public spacing: string[];

  constructor(options: ConcatValue) {
    this.parens = options.parens;
    this.parts = options.parts;
    this.spacing = options.spacing;
  }

  toString(): string {
    const val: string[] = [];
    val.push(renderOpenParens(this.parens));
    this.parts.map((part, index) => {
      val.push(part.toString());
      if (index < this.parts.length - 1) {
        val.push(
          (this.spacing[index][0] ? this.spacing[index][0] : '') +
            '||' +
            (this.spacing[index][2] ? this.spacing[index][2] : ''),
        );
      }
    });
    val.push(renderCloseParens(this.parens));
    return val.join('');
  }

  getBasicValue(): string {
    return this.parts
      .map(part => {
        return part.toString();
      })
      .join('');
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new Concat({
      parens: this.parens,
      parts: this.parts,
      spacing: this.spacing,
    });
  }
}
