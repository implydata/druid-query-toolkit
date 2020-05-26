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

import { SqlBase, SqlBaseValue, SqlCaseSearched, SqlExpression, WhenThenUnit } from '..';

export interface SqlCaseSimpleValue extends SqlBaseValue {
  caseKeyword?: string;
  caseExpression?: SqlExpression;
  elseKeyword?: string;
  elseExpression?: string;
  endKeyword?: string;
  whenThenUnits?: WhenThenUnit[];
  postWhenThenUnits?: string[];
}

export class SqlCaseSimple extends SqlExpression {
  static type = 'caseSimple';

  public readonly caseKeyword?: string;
  public readonly caseExpression?: SqlExpression;
  public readonly elseKeyword?: string;
  public readonly elseExpression?: string;
  public readonly endKeyword?: string;
  public readonly whenThenUnits: WhenThenUnit[];
  public readonly postWhenThenUnits?: string[];

  constructor(options: SqlCaseSimpleValue) {
    super(options, SqlCaseSimple.type);
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

SqlBase.register(SqlCaseSimple.type, SqlCaseSimple);
