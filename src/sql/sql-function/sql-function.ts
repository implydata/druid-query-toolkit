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
  functionName: string;
  arguments?: SqlBase[];
  decorator?: string;
  separators?: Separator[];
  filterKeyword?: string;
  whereKeyword?: string;
  whereExpression?: SqlBase;
}

export class SqlFunction extends SqlBase {
  static type = 'function';

  static sqlFunctionFactory(
    functionName: string,
    argumentArray: SqlBase[],
    separators?: Separator[],
    filter?: SqlBase,
    decorator?: string,
  ) {
    const innerSpacing = {
      postName: '',
      preRightParen: '',
      postLeftParen: '',
      postDecorator: decorator ? ' ' : '',
      preFilter: filter ? ' ' : '',
      postFilterKeyword: filter ? ' ' : '',
      postFilterLeftParen: filter ? ' ' : '',
      postWhereKeyword: filter ? ' ' : '',
      preFilterRightParen: filter ? ' ' : '',
    };
    return new SqlFunction({
      type: SqlFunction.type,
      decorator: decorator,
      functionName: functionName,
      arguments: argumentArray,
      separators: Separator.fillBetween(
        separators || [],
        argumentArray.length,
        Separator.rightSeparator(','),
      ),
      innerSpacing: innerSpacing,
      filterKeyword: filter ? 'FILTER' : undefined,
      whereKeyword: filter ? 'where' : undefined,
      whereExpression: filter,
    } as SqlFunctionValue);
  }

  public readonly functionName: string;
  public readonly arguments?: SqlBase[];
  public readonly decorator?: string;
  public readonly separators?: Separator[];
  public readonly filterKeyword?: string;
  public readonly whereKeyword?: string;
  public readonly whereExpression?: SqlBase;

  constructor(options: SqlFunctionValue) {
    super(options, SqlFunction.type);
    this.functionName = options.functionName;
    this.decorator = options.decorator;
    this.arguments = options.arguments;
    this.separators = options.separators;
    this.filterKeyword = options.filterKeyword;
    this.whereKeyword = options.whereKeyword;
    this.whereExpression = options.whereExpression;
  }

  public valueOf(): SqlFunctionValue {
    const value = super.valueOf() as SqlFunctionValue;
    value.functionName = this.functionName;
    value.decorator = this.decorator;
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
    if (this.decorator) {
      rawString += this.decorator + this.innerSpacing.postDecorator;
    }
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

SqlBase.register(SqlFunction.type, SqlFunction);
