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

import { SqlBase, SqlBaseValue } from '../sql-base';

export interface WhenThen {
  whenKeyword: string;
  postWhen: string;
  whenExpression: SqlBase;
  postWhenExpression: string;
  thenKeyword: string;
  postThen: string;
  thenExpression: SqlBase;
}

export interface SqlCaseSearchedValue extends SqlBaseValue {
  caseKeyword?: string;
  whenThenUnits?: WhenThen[];
  elseKeyword?: string;
  elseExpression?: string;
  endKeyword?: string;
  postWhenThenUnits?: string[];
}

export class SqlCaseSearched extends SqlBase {
  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  public caseKeyword?: string;
  public whenThenUnits: WhenThen[];
  public elseKeyword?: string;
  public elseExpression?: string;
  public endKeyword?: string;
  public postWhenThenUnits?: string[];

  constructor(options: SqlCaseSearchedValue) {
    super(options, 'caseSearched');
    this.caseKeyword = options.caseKeyword;
    this.whenThenUnits = options.whenThenUnits || [];
    this.elseKeyword = options.elseKeyword;
    this.elseExpression = options.elseExpression;
    this.endKeyword = options.endKeyword;
    this.postWhenThenUnits = options.postWhenThenUnits;
  }

  public valueOf() {
    const value: SqlCaseSearchedValue = super.valueOf();
    value.caseKeyword = this.caseKeyword;
    value.whenThenUnits = this.whenThenUnits;
    value.elseKeyword = this.elseKeyword;
    value.elseExpression = this.elseExpression;
    value.endKeyword = this.endKeyword;
    value.postWhenThenUnits = this.postWhenThenUnits;
    return value;
  }

  public toRawString(): string {
    let rawString = this.caseKeyword + this.innerSpacing.postCase;

    if (this.whenThenUnits) {
      if (this.postWhenThenUnits) {
        rawString +=
          this.postWhenThenUnits
            .flatMap((space, i) => {
              return [this.whenThenToString(this.whenThenUnits[i]), space];
            })
            .join('') + this.whenThenToString(this.whenThenUnits[this.whenThenUnits.length - 1]);
      } else {
        rawString += this.whenThenToString(this.whenThenUnits[0]);
      }
    }

    rawString += this.innerSpacing.postWhenThen;
    if (this.elseKeyword && this.elseExpression) {
      rawString = rawString + this.elseKeyword + this.innerSpacing.postElse + this.elseExpression;
    }
    return rawString + this.innerSpacing.preEnd + this.endKeyword;
  }

  public whenThenToString(unit?: WhenThen): string {
    if (!unit) {
      return '';
    }
    return [
      unit.whenKeyword,
      unit.postWhen,
      unit.whenExpression.toString(),
      unit.postWhenExpression,
      unit.thenKeyword,
      unit.postThen,
      unit.thenExpression,
    ].join('');
  }
}

SqlBase.register('caseSearched', SqlCaseSearched);
