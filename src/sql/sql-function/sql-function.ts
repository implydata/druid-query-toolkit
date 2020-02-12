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

import { Separator } from '..';
import { SqlBase, SqlBaseValue } from '../sql-base';

// innerSpacing:
// Fn          (           A , B             )
//    preParen   leftParen       rightParen

export interface SqlFunctionValue extends SqlBaseValue {
  functionName?: string;
  arguments?: SqlBase[];
  separators?: Separator[];
  filterKeyword?: string;
  whereKeyword?: string;
  whereExpression?: SqlBase;
}

export class SqlFunction extends SqlBase {
  public functionName?: string;
  public arguments?: SqlBase[];
  public separators?: Separator[];
  public filterKeyword?: string;
  public whereKeyword?: string;
  public whereExpression?: SqlBase;

  constructor(options: SqlFunctionValue) {
    super(options, 'function');
    this.functionName = options.functionName;
    this.arguments = options.arguments;
    this.separators = options.separators;
    this.filterKeyword = options.filterKeyword;
    this.whereKeyword = options.whereKeyword;
    this.whereExpression = options.whereExpression;
  }

  public valueOf() {
    const value: SqlFunctionValue = super.valueOf();
    value.functionName = this.functionName;
    value.arguments = this.arguments;
    value.separators = this.separators;
    value.filterKeyword = this.filterKeyword;
    value.whereKeyword = this.whereKeyword;
    value.whereExpression = this.whereExpression;
    return value;
  }

  public toRawString(): string {
    let rawString =
      this.functionName + this.innerSpacing.postName + '(' + this.innerSpacing.postLeftParen;
    if (this.arguments && this.arguments.length > 1 && this.separators) {
      rawString = rawString + Separator.spacilator(this.arguments, this.separators);
    } else if (this.arguments) {
      rawString = rawString + this.arguments[0].toString();
    }
    rawString += this.innerSpacing.preRightParen + ')';

    if (this.filterKeyword && this.whereExpression) {
      rawString +=
        this.innerSpacing.preFilter +
        this.filterKeyword +
        this.innerSpacing.postFilterKeyword +
        '(' +
        this.innerSpacing.postFilterLeftParen +
        this.whereKeyword +
        this.innerSpacing.postWhereKeyword +
        this.whereExpression.toRawString() +
        this.innerSpacing.preFilterRightParen +
        ')';
    }

    return rawString;
  }
}

SqlBase.register('function', SqlFunction);
