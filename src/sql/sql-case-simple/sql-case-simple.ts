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

import { WhenThenUnit } from '..';
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlCaseSimpleValue extends SqlBaseValue {
  caseKeyword?: string;
  caseExpression?: SqlBase;
  elseKeyword?: string;
  elseExpression?: string;
  endKeyword?: string;
  whenThenUnits?: WhenThenUnit[];
  postWhenThenUnits?: string[];
}

export class SqlCaseSimple extends SqlBase {
  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  public caseKeyword?: string;
  public caseExpression?: SqlBase;
  public elseKeyword?: string;
  public elseExpression?: string;
  public endKeyword?: string;
  public whenThenUnits: WhenThenUnit[];
  public postWhenThenUnits?: string[];

  constructor(options: SqlCaseSimpleValue) {
    super(options, 'caseSimple');
    this.caseKeyword = options.caseKeyword;
    this.caseExpression = options.caseExpression;
    this.elseKeyword = options.elseKeyword;
    this.elseExpression = options.elseExpression;
    this.endKeyword = options.endKeyword;
    this.whenThenUnits = options.whenThenUnits || [];
    this.postWhenThenUnits = options.postWhenThenUnits;
  }

  public valueOf() {
    const value: SqlCaseSimpleValue = super.valueOf();
    value.caseKeyword = this.caseKeyword;
    value.caseExpression = this.caseExpression;
    value.elseKeyword = this.elseKeyword;
    value.elseExpression = this.elseExpression;
    value.endKeyword = this.endKeyword;
    value.whenThenUnits = this.whenThenUnits;
    value.postWhenThenUnits = this.postWhenThenUnits;

    return value;
  }

  public toRawString(): string {
    let rawString =
      this.caseKeyword +
      this.innerSpacing.postCase +
      this.caseExpression +
      this.innerSpacing.postCaseExpression;

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

  public whenThenToString(unit?: WhenThenUnit): string {
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

SqlBase.register('caseSimple', SqlCaseSimple);
