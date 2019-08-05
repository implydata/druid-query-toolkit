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
import { OrExpression } from '../..';
import { Parens, renderCloseParens, renderOpenParens } from '../helpers';

export interface SubValue {
  parens: Parens[];
  ex: OrExpression | any;
}

export class Sub {
  public parens: Parens[];
  public ex: OrExpression | any;

  constructor(options: SubValue) {
    this.parens = options.parens;
    this.ex = options.ex;
  }

  toString(): string {
    return renderOpenParens(this.parens) + this.ex.toString() + renderCloseParens(this.parens);
  }

  getBasicValue() {
    return this.ex.getBasicValue();
  }

  addParen(open: string[], close: string[]) {
    this.parens.push({ open, close });
    return new Sub({
      parens: this.parens,
      ex: this.ex,
    });
  }
}
