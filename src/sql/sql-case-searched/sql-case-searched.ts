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

export interface WhenThenUnit {
  whenKeyword: string;
  postWhenSpace: string;
  whenExpression: SqlBase;
  postWhenExpressionSpace: string;
  thenKeyword: string;
  postThenSpace: string;
  thenExpression: SqlBase;
}

export interface SqlCaseSearchedValue extends SqlBaseValue {
  caseKeyword?: string;
  whenThenUnits?: WhenThenUnit[];
  elseKeyword?: string;
  elseExpression?: string;
  endKeyword?: string;
  postWhenThenUnitSpaces?: string[];
}

export class SqlCaseSearched extends SqlBase {
  static type = 'caseSearched';

  static whenThenToString(unit?: WhenThenUnit): string {
    if (!unit) {
      return '';
    }
    return [
      unit.whenKeyword,
      unit.postWhenSpace,
      unit.whenExpression.toString(),
      unit.postWhenExpressionSpace,
      unit.thenKeyword,
      unit.postThenSpace,
      unit.thenExpression,
    ].join('');
  }

  public caseKeyword?: string;
  public whenThenUnits: WhenThenUnit[];
  public elseKeyword?: string;
  public elseExpression?: string;
  public endKeyword?: string;
  public postWhenThenUnitSpaces?: string[];

  constructor(options: SqlCaseSearchedValue) {
    super(options, SqlCaseSearched.type);
    this.caseKeyword = options.caseKeyword;
    this.whenThenUnits = options.whenThenUnits || [];
    this.elseKeyword = options.elseKeyword;
    this.elseExpression = options.elseExpression;
    this.endKeyword = options.endKeyword;
    this.postWhenThenUnitSpaces = options.postWhenThenUnitSpaces;
  }

  public valueOf() {
    const value: SqlCaseSearchedValue = super.valueOf();
    value.caseKeyword = this.caseKeyword;
    value.whenThenUnits = this.whenThenUnits;
    value.elseKeyword = this.elseKeyword;
    value.elseExpression = this.elseExpression;
    value.endKeyword = this.endKeyword;
    value.postWhenThenUnitSpaces = this.postWhenThenUnitSpaces;
    return value;
  }

  public toRawString(): string {
    let rawString = this.caseKeyword + this.innerSpacing.postCase;

    if (this.whenThenUnits) {
      if (this.postWhenThenUnitSpaces) {
        rawString +=
          this.postWhenThenUnitSpaces
            .flatMap((space, i) => {
              return [SqlCaseSearched.whenThenToString(this.whenThenUnits[i]), space];
            })
            .join('') +
          SqlCaseSearched.whenThenToString(this.whenThenUnits[this.whenThenUnits.length - 1]);
      } else {
        rawString += SqlCaseSearched.whenThenToString(this.whenThenUnits[0]);
      }
    }

    rawString += this.innerSpacing.postWhenThen;
    if (this.elseKeyword && this.elseExpression) {
      rawString = rawString + this.elseKeyword + this.innerSpacing.postElse + this.elseExpression;
    }
    return rawString + this.innerSpacing.preEnd + this.endKeyword;
  }
}

SqlBase.register(SqlCaseSearched.type, SqlCaseSearched);
