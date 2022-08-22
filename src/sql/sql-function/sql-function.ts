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

import { ALLOWED_FUNCTIONS } from '../allowed-functions';
import { SPECIAL_FUNCTIONS } from '../special-functions';
import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../sql-base';
import { SqlWhereClause } from '../sql-clause/sql-where-clause/sql-where-clause';
import { SqlExpression } from '../sql-expression';
import { LiteralValue, SqlLiteral } from '../sql-literal/sql-literal';
import { SqlStar } from '../sql-star/sql-star';
import { RefName, SeparatedArray, Separator } from '../utils';

const specialFunctionLookup: Record<string, boolean> = {};
for (const r of SPECIAL_FUNCTIONS) {
  specialFunctionLookup[r] = true;
}

const allowedFunctionLookup: Record<string, boolean> = {};
for (const r of ALLOWED_FUNCTIONS) {
  allowedFunctionLookup[r] = true;
}

export type SpecialParen = 'square' | 'none';

export interface SqlFunctionValue extends SqlBaseValue {
  functionName: string;
  specialParen?: SpecialParen;
  decorator?: string;
  args?: SeparatedArray<SqlExpression>;
  whereClause?: SqlWhereClause;
}

export class SqlFunction extends SqlExpression {
  static type: SqlType = 'function';

  static DEFAULT_FILTER_KEYWORD = 'FILTER';

  static COUNT_STAR: SqlFunction;

  static SPECIAL_FUNCTIONS = SPECIAL_FUNCTIONS;
  static ALLOWED_FUNCTIONS = ALLOWED_FUNCTIONS;

  static isValidFunctionName(functionName: string) {
    return Boolean(
      !RefName.isReservedKeyword(functionName) || allowedFunctionLookup[functionName.toUpperCase()],
    );
  }

  static isNakedFunction(functionName: string) {
    return Boolean(specialFunctionLookup[functionName.toUpperCase()]);
  }

  static simple(
    functionName: string,
    args: SqlExpression[] | SeparatedArray<SqlExpression>,
    filter?: SqlWhereClause | SqlExpression,
  ) {
    return new SqlFunction({
      functionName: functionName,
      args: SeparatedArray.fromArray(args, Separator.COMMA),
      whereClause: filter ? SqlWhereClause.createForFunction(filter) : undefined,
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
      whereClause: filter ? SqlWhereClause.createForFunction(filter) : undefined,
    });
  }

  static cast(ex: SqlExpression, asType: string): SqlExpression {
    return new SqlFunction({
      functionName: 'CAST',
      args: SeparatedArray.fromTwoValuesWithSeparator(
        ex,
        Separator.symmetricSpace('AS'),
        SqlLiteral.direct(asType),
      ),
    });
  }

  static floor(ex: SqlExpression, timeUnit: string | SqlLiteral): SqlExpression {
    return new SqlFunction({
      functionName: 'FLOOR',
      args: SeparatedArray.fromTwoValuesWithSeparator(
        ex,
        Separator.symmetricSpace('TO'),
        SqlLiteral.direct(timeUnit),
      ),
    });
  }

  static array(ex: SqlExpression[] | SeparatedArray<SqlExpression>) {
    return new SqlFunction({
      functionName: 'ARRAY',
      specialParen: 'square',
      args: SeparatedArray.fromArray(ex),
    });
  }

  static arrayOfLiterals(xs: LiteralValue[]) {
    return SqlFunction.array(xs.map(x => SqlLiteral.create(x)));
  }

  public readonly functionName: string;
  public readonly specialParen?: SpecialParen;
  public readonly args?: SeparatedArray<SqlExpression>;
  public readonly decorator?: string;
  public readonly whereClause?: SqlWhereClause;

  constructor(options: SqlFunctionValue) {
    super(options, SqlFunction.type);
    this.functionName = options.functionName;
    this.specialParen = options.specialParen;
    this.decorator = options.decorator;
    this.args = options.args;
    this.whereClause = options.whereClause;
  }

  public valueOf(): SqlFunctionValue {
    const value = super.valueOf() as SqlFunctionValue;
    value.functionName = this.functionName;
    value.specialParen = this.specialParen;
    value.decorator = this.decorator;
    value.args = this.args;
    value.whereClause = this.whereClause;
    return value;
  }

  protected _toRawString(): string {
    const { specialParen } = this;
    const rawParts: string[] = [this.getKeyword('functionName', this.functionName)];

    if (specialParen !== 'none') {
      rawParts.push(
        this.getSpace('preLeftParen', ''),
        specialParen === 'square' ? '[' : '(',
        this.getSpace('postLeftParen', ''),
      );

      if (this.decorator) {
        rawParts.push(this.getKeyword('decorator', this.decorator), this.getSpace('postDecorator'));
      }

      if (this.args) {
        rawParts.push(this.args.toString(Separator.COMMA), this.getSpace('postArguments', ''));
      }

      rawParts.push(specialParen === 'square' ? ']' : ')');

      if (this.whereClause) {
        rawParts.push(
          this.getSpace('preFilter'),
          this.getKeyword('filter', SqlFunction.DEFAULT_FILTER_KEYWORD),
          this.getSpace('postFilter'),
          this.whereClause.toString(),
        );
      }
    }

    return rawParts.join('');
  }

  public getEffectiveFunctionName(): string {
    return this.functionName.toUpperCase();
  }

  public getEffectiveDecorator(): string | undefined {
    return this.decorator?.toUpperCase();
  }

  public changeArgs(args: SeparatedArray<SqlExpression>): this {
    const value = this.valueOf();
    value.args = args;
    return SqlBase.fromValue(value);
  }

  public numArgs(): number {
    return this.args?.length() || 0;
  }

  public getArgArray(): readonly SqlExpression[] {
    return this.args?.values || [];
  }

  public getArg(index: number): SqlExpression | undefined {
    return this.args?.get(index);
  }

  public getArgAsString(index: number): string | undefined {
    const arg = this.getArg(index);
    if (!arg) return;
    if (!(arg instanceof SqlLiteral)) return;
    return arg.getStringValue();
  }

  public changeWhereClause(whereClause: SqlWhereClause | undefined): this {
    const value = this.valueOf();
    if (whereClause) {
      value.whereClause = whereClause;
    } else {
      delete value.whereClause;
      value.keywords = this.getKeywordsWithout('filter');
    }
    return SqlBase.fromValue(value);
  }

  public changeWhereExpression(whereExpression: SqlExpression | string | undefined): this {
    if (!whereExpression) return this.changeWhereClause(undefined);
    return this.changeWhereClause(
      this.whereClause
        ? this.whereClause.changeExpression(whereExpression)
        : SqlWhereClause.createForFunction(whereExpression),
    );
  }

  public addWhereExpression(whereExpression: SqlExpression | string): this {
    const { whereClause } = this;
    return this.changeWhereClause(
      whereClause
        ? whereClause.changeExpression(whereClause.expression.and(whereExpression))
        : SqlWhereClause.createForFunction(whereExpression),
    );
  }

  public getWhereExpression(): SqlExpression | undefined {
    return this.whereClause?.expression;
  }

  public getEffectiveWhereExpression(): SqlExpression {
    return this.getWhereExpression() || SqlLiteral.TRUE;
  }

  public isAggregation(knownAggregations: string[]): boolean {
    return Boolean(this.whereClause || knownAggregations.includes(this.getEffectiveFunctionName()));
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

  public clearOwnSeparators(): this {
    if (!this.args) return this;
    const value = this.valueOf();
    value.args = this.args.clearSeparatorsMatching(',');
    return SqlBase.fromValue(value);
  }

  public isCountStar(): boolean {
    if (this.getEffectiveFunctionName() !== 'COUNT') return false;
    const args = this.args;
    if (!args || args.length() !== 1) return false;
    return args.first() instanceof SqlStar;
  }
}

SqlBase.register(SqlFunction);

SqlFunction.COUNT_STAR = SqlFunction.simple('COUNT', [SqlStar.PLAIN]);
