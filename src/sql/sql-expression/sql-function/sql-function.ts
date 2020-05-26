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

import { SqlBase, SqlBaseValue } from '../../sql-base';
import { SeparatedArray, Separator } from '../../utils';
import { SqlExpression } from '../sql-expression';

// innerSpacing:
// Fn          (           A , B             ) FILTER ( WHERE X )
//    preParen   leftParen       rightParen

export interface SqlFunctionValue extends SqlBaseValue {
  functionName: string;
  arguments?: SeparatedArray<SqlExpression>;
  decorator?: string;
  filterKeyword?: string;
  whereKeyword?: string;
  whereExpression?: SqlExpression;
}

export class SqlFunction extends SqlExpression {
  static type = 'function';

  static sqlFunctionFactory(
    functionName: string,
    argumentArray: SqlExpression[] | SeparatedArray<SqlExpression>,
    filter?: SqlExpression,
    decorator?: string,
  ) {
    return new SqlFunction({
      functionName: functionName,
      decorator: decorator,
      arguments: SeparatedArray.fromArray(argumentArray, Separator.rightSeparator(',')),
      filterKeyword: filter ? 'FILTER' : undefined,
      whereKeyword: filter ? 'WHERE' : undefined,
      whereExpression: filter,
    });
  }

  public readonly functionName: string;
  public readonly arguments?: SeparatedArray<SqlExpression>;
  public readonly decorator?: string;
  public readonly filterKeyword?: string;
  public readonly whereKeyword?: string;
  public readonly whereExpression?: SqlExpression;

  constructor(options: SqlFunctionValue) {
    super(options, SqlFunction.type);
    this.functionName = options.functionName;
    this.decorator = options.decorator;
    this.arguments = options.arguments;
    this.filterKeyword = options.filterKeyword;
    this.whereKeyword = options.whereKeyword;
    this.whereExpression = options.whereExpression;
  }

  public valueOf(): SqlFunctionValue {
    const value = super.valueOf() as SqlFunctionValue;
    value.functionName = this.functionName;
    value.decorator = this.decorator;
    value.arguments = this.arguments;
    value.filterKeyword = this.filterKeyword;
    value.whereKeyword = this.whereKeyword;
    value.whereExpression = this.whereExpression;
    return value;
  }

  public toRawString(): string {
    const rawParts: string[] = [
      this.functionName,
      this.getInnerSpace('postName', ''),
      '(',
      this.getInnerSpace('postLeftParen', ''),
    ];

    if (this.decorator) {
      rawParts.push(this.decorator, this.getInnerSpace('postDecorator'));
    }
    if (this.arguments) {
      rawParts.push(this.arguments.toString(), this.getInnerSpace('postArguments', ''));
    }
    rawParts.push(')');

    if (this.filterKeyword && this.whereKeyword && this.whereExpression) {
      rawParts.push(
        this.getInnerSpace('preFilter'),
        this.filterKeyword,
        this.getInnerSpace('postFilterKeyword'),
        '(',
        this.getInnerSpace('postFilterLeftParen', ''),
        this.whereKeyword,
        this.getInnerSpace('postWhereKeyword'),
        this.whereExpression.toString(),
        this.getInnerSpace('preFilterRightParen', ''),
        ')',
      );
    }

    return rawParts.join('');
  }

  public walk(fn: (t: SqlBase) => void) {
    super.walk(fn);
    SqlBase.walkSeparatedArray(this.arguments, fn);
  }
}

SqlBase.register(SqlFunction.type, SqlFunction);
