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

import { SqlLiteral, SqlRef } from '..';
import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SqlWhereClause } from '../../sql-query';
import { SeparatedArray, Separator } from '../../utils';
import { SqlExpression } from '../sql-expression';

export type SpecialParen = 'square' | 'none';

export interface SqlFunctionValue extends SqlBaseValue {
  functionName: string;
  specialParen?: SpecialParen;
  decorator?: string;
  args?: SeparatedArray<SqlExpression>;
  filterKeyword?: string;
  whereClause?: SqlWhereClause;
}

export class SqlFunction extends SqlExpression {
  static type = 'function';

  static DEFAULT_FILTER_KEYWORD = 'FILTER';

  static COUNT_STAR: SqlFunction;

  static simple(
    functionName: string,
    args: SqlExpression[] | SeparatedArray<SqlExpression>,
    filter?: SqlWhereClause | SqlExpression,
  ) {
    return new SqlFunction({
      functionName: functionName,
      args: SeparatedArray.fromArray(args, Separator.COMMA),
      filterKeyword: filter ? SqlFunction.DEFAULT_FILTER_KEYWORD : undefined,
      whereClause: filter ? SqlWhereClause.create(filter) : undefined,
    });
  }

  static decorated(
    functionName: string,
    decorator: string | undefined,
    args: SqlExpression[] | SeparatedArray<SqlExpression>,
    filter?: SqlWhereClause | SqlExpression,
  ) {
    return new SqlFunction({
      functionName: functionName,
      decorator: decorator,
      args: SeparatedArray.fromArray(args, Separator.COMMA),
      filterKeyword: filter ? SqlFunction.DEFAULT_FILTER_KEYWORD : undefined,
      whereClause: filter ? SqlWhereClause.create(filter) : undefined,
    });
  }

  public readonly functionName: string;
  public readonly specialParen?: SpecialParen;
  public readonly args?: SeparatedArray<SqlExpression>;
  public readonly decorator?: string;
  public readonly filterKeyword?: string;
  public readonly whereClause?: SqlWhereClause;

  constructor(options: SqlFunctionValue) {
    super(options, SqlFunction.type);
    this.functionName = options.functionName;
    this.specialParen = options.specialParen;
    this.decorator = options.decorator;
    this.args = options.args;
    this.filterKeyword = options.filterKeyword;
    this.whereClause = options.whereClause;
  }

  public valueOf(): SqlFunctionValue {
    const value = super.valueOf() as SqlFunctionValue;
    value.functionName = this.functionName;
    value.specialParen = this.specialParen;
    value.decorator = this.decorator;
    value.args = this.args;
    value.filterKeyword = this.filterKeyword;
    value.whereClause = this.whereClause;
    return value;
  }

  protected _toRawString(): string {
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
        rawParts.push(this.args.toString(Separator.COMMA), this.getInnerSpace('postArguments', ''));
      }

      rawParts.push(specialParen === 'square' ? ']' : ')');

      if (this.whereClause) {
        rawParts.push(
          this.getInnerSpace('preFilter'),
          this.filterKeyword || SqlFunction.DEFAULT_FILTER_KEYWORD,
          this.getInnerSpace('postFilter'),
          this.whereClause.toString(),
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

  public changeWhereClause(whereClause: SqlWhereClause | undefined): this {
    const value = this.valueOf();
    if (whereClause) {
      value.whereClause = whereClause;
    } else {
      delete value.whereClause;
      delete value.filterKeyword;
    }
    return SqlBase.fromValue(value);
  }

  public changeWhereExpression(whereExpression: SqlExpression | string | undefined): this {
    if (!whereExpression) return this.changeWhereClause(undefined);
    return this.changeWhereClause(
      this.whereClause
        ? this.whereClause.changeExpression(whereExpression)
        : SqlWhereClause.create(whereExpression),
    );
  }

  public getWhereExpression(): SqlExpression | undefined {
    const { whereClause } = this;
    if (!whereClause) return;
    return whereClause.expression;
  }

  public getEffectiveWhereExpression(): SqlExpression {
    return this.getWhereExpression() || SqlLiteral.TRUE;
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

    if (this.whereClause) {
      const whereClause = this.whereClause._walkHelper(nextStack, fn, postorder);
      if (!whereClause) return;
      if (whereClause !== this.whereClause) {
        ret = ret.changeWhereClause(whereClause as SqlWhereClause);
      }
    }

    return ret;
  }

  public clearStaticKeywords(): this {
    const value = this.valueOf();
    delete value.filterKeyword;
    return SqlBase.fromValue(value);
  }

  public clearSeparators(): this {
    if (!this.args) return this;
    const value = this.valueOf();
    value.args = this.args.clearSeparators();
    return SqlBase.fromValue(value);
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
