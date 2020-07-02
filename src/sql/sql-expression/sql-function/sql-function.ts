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

import { SqlRef } from '..';
import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SeparatedArray, Separator } from '../../utils';
import { SqlExpression } from '../sql-expression';

export type SpecialParen = 'square' | 'none';

export interface SqlFunctionValue extends SqlBaseValue {
  functionName: string;
  specialParen?: SpecialParen;
  decorator?: string;
  args?: SeparatedArray<SqlExpression>;
  filterKeyword?: string;
  whereKeyword?: string;
  whereExpression?: SqlExpression;
}

export class SqlFunction extends SqlExpression {
  static type = 'function';
  static DEFAULT_FILTER_KEYWORD = 'FILTER';
  static DEFAULT_WHERE_KEYWORD = 'WHERE';

  static COUNT_STAR: SqlFunction;

  static simple(
    functionName: string,
    args: SqlExpression[] | SeparatedArray<SqlExpression>,
    filter?: SqlExpression,
  ) {
    return new SqlFunction({
      functionName: functionName,
      args: SeparatedArray.fromArray(args, Separator.COMMA),
      filterKeyword: filter ? SqlFunction.DEFAULT_FILTER_KEYWORD : undefined,
      whereKeyword: filter ? SqlFunction.DEFAULT_WHERE_KEYWORD : undefined,
      whereExpression: filter,
    });
  }

  static decorated(
    functionName: string,
    decorator: string | undefined,
    args: SqlExpression[] | SeparatedArray<SqlExpression>,
    filter?: SqlExpression,
  ) {
    return new SqlFunction({
      functionName: functionName,
      decorator: decorator,
      args: SeparatedArray.fromArray(args, Separator.COMMA),
      filterKeyword: filter ? SqlFunction.DEFAULT_FILTER_KEYWORD : undefined,
      whereKeyword: filter ? SqlFunction.DEFAULT_WHERE_KEYWORD : undefined,
      whereExpression: filter,
    });
  }

  public readonly functionName: string;
  public readonly specialParen?: SpecialParen;
  public readonly args?: SeparatedArray<SqlExpression>;
  public readonly decorator?: string;
  public readonly filterKeyword?: string;
  public readonly whereKeyword?: string;
  public readonly whereExpression?: SqlExpression;

  constructor(options: SqlFunctionValue) {
    super(options, SqlFunction.type);
    this.functionName = options.functionName;
    this.specialParen = options.specialParen;
    this.decorator = options.decorator;
    this.args = options.args;
    this.filterKeyword = options.filterKeyword;
    this.whereKeyword = options.whereKeyword;
    this.whereExpression = options.whereExpression;
  }

  public valueOf(): SqlFunctionValue {
    const value = super.valueOf() as SqlFunctionValue;
    value.functionName = this.functionName;
    value.specialParen = this.specialParen;
    value.decorator = this.decorator;
    value.args = this.args;
    value.filterKeyword = this.filterKeyword;
    value.whereKeyword = this.whereKeyword;
    value.whereExpression = this.whereExpression;
    return value;
  }

  protected toRawString(): string {
    const { specialParen } = this;
    const rawParts: string[] = [this.functionName];

    if (specialParen !== 'none') {
      rawParts.push(
        this.getInnerSpace('preLeftParen', ''),
        specialParen === 'square' ? '[' : '(',
        this.getInnerSpace('postLeftParen', ''),
      );

      if (this.decorator) {
        rawParts.push(this.decorator, this.getInnerSpace('postDecorator'));
      }

      if (this.args) {
        rawParts.push(this.args.toString(), this.getInnerSpace('postArguments', ''));
      }

      rawParts.push(specialParen === 'square' ? ']' : ')');

      if (this.filterKeyword && this.whereKeyword && this.whereExpression) {
        rawParts.push(
          this.getInnerSpace('preFilter'),
          this.filterKeyword,
          this.getInnerSpace('postFilterKeyword'),
          '(',
          this.getInnerSpace('postFilterLeftParen', ''),
          this.whereKeyword,
          this.getInnerSpace('postWhere'),
          this.whereExpression.toString(),
          this.getInnerSpace('preFilterRightParen', ''),
          ')',
        );
      }
    }

    return rawParts.join('');
  }

  public getEffectiveFunctionName(): string {
    return this.functionName.toUpperCase();
  }

  public changeArgs(args: SeparatedArray<SqlExpression>): this {
    const value = this.valueOf();
    value.args = args;
    return SqlBase.fromValue(value);
  }

  public changeWhereExpression(whereExpression: SqlExpression): this {
    const value = this.valueOf();
    value.whereExpression = whereExpression;
    if (whereExpression) {
      value.filterKeyword = value.filterKeyword || SqlFunction.DEFAULT_FILTER_KEYWORD;
      value.whereKeyword = value.whereKeyword || SqlFunction.DEFAULT_WHERE_KEYWORD;
    } else {
      delete value.filterKeyword;
      delete value.whereKeyword;
    }
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    if (this.args) {
      const args = SqlBase.walkSeparatedArray(this.args, nextStack, fn, postorder);
      if (!args) return;
      if (args !== this.args) {
        ret = ret.changeArgs(args);
      }
    }

    if (this.whereExpression) {
      const whereExpression = this.whereExpression._walkHelper(nextStack, fn, postorder);
      if (!whereExpression) return;
      if (whereExpression !== this.whereExpression) {
        ret = ret.changeWhereExpression(whereExpression);
      }
    }

    return ret;
  }

  public isCountStar(): boolean {
    if (this.getEffectiveFunctionName() !== 'COUNT') return false;
    const args = this.args;
    if (!args || args.length() !== 1) return false;
    const firstArg = args.first();
    return firstArg instanceof SqlRef && firstArg.isStar();
  }
}

SqlBase.register(SqlFunction.type, SqlFunction);

SqlFunction.COUNT_STAR = SqlFunction.simple('COUNT', [SqlRef.STAR]);
