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

import { compact } from '../../utils';
import { SPECIAL_FUNCTIONS } from '../special-functions';
import { SqlBase, SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlColumnDeclaration, SqlExtendClause, SqlWhereClause } from '../sql-clause';
import { SqlExpression } from '../sql-expression';
import { LiteralValue, SqlLiteral } from '../sql-literal/sql-literal';
import { SqlNamespace } from '../sql-namespace/sql-namespace';
import { SqlStar } from '../sql-star/sql-star';
import { SqlType } from '../sql-type/sql-type';
import { SqlWindowSpec } from '../sql-window-spec/sql-window-spec';
import { RefName, SeparatedArray, Separator } from '../utils';

const specialFunctionLookup: Record<string, boolean> = {};
for (const r of SPECIAL_FUNCTIONS) {
  specialFunctionLookup[r] = true;
}

export type SpecialParen = 'square' | 'none';

export interface SqlFunctionValue extends SqlBaseValue {
  namespace?: SqlNamespace;
  functionName: RefName;
  specialParen?: SpecialParen;
  decorator?: string;
  args?: SeparatedArray<SqlExpression>;
  whereClause?: SqlWhereClause;
  extendClause?: SqlExtendClause;
  windowSpec?: SqlWindowSpec;
}

export class SqlFunction extends SqlExpression {
  static type: SqlTypeDesignator = 'function';

  static DEFAULT_FILTER_KEYWORD = 'FILTER';
  static DEFAULT_OVER_KEYWORD = 'OVER';

  static COUNT_STAR: SqlFunction;

  static SPECIAL_FUNCTIONS = SPECIAL_FUNCTIONS;

  static isValidFunctionName(functionName: string) {
    return Boolean(!RefName.isReservedFunctionName(functionName));
  }

  static isNakedFunction(functionName: string) {
    return Boolean(specialFunctionLookup[functionName.toUpperCase()]);
  }

  static simple(
    functionName: RefName | string,
    args: (SqlExpression | LiteralValue)[] | SeparatedArray<SqlExpression>,
    filter?: SqlWhereClause | SqlExpression,
  ) {
    return new SqlFunction({
      functionName: RefName.functionName(functionName),
      args: SeparatedArray.fromArray(
        Array.isArray(args) ? args.map(SqlExpression.wrap) : args,
        Separator.COMMA,
      ),
      whereClause: filter ? SqlWhereClause.createForFunction(filter) : undefined,
    });
  }

  static decorated(
    functionName: RefName | string,
    decorator: string | undefined,
    args: (SqlExpression | LiteralValue)[] | SeparatedArray<SqlExpression>,
    filter?: SqlWhereClause | SqlExpression,
  ) {
    return new SqlFunction({
      functionName: RefName.functionName(functionName),
      decorator: decorator,
      args: SeparatedArray.fromArray(
        Array.isArray(args) ? args.map(SqlExpression.wrap) : args,
        Separator.COMMA,
      ),
      whereClause: filter ? SqlWhereClause.createForFunction(filter) : undefined,
    });
  }

  static count(arg?: SqlExpression) {
    return SqlFunction.simple('COUNT', [arg || SqlStar.PLAIN]);
  }

  static countDistinct(arg: SqlExpression) {
    return SqlFunction.decorated('COUNT', 'DISTINCT', [arg]);
  }

  static sum(arg: SqlExpression) {
    return SqlFunction.simple('SUM', [arg]);
  }

  static min(arg: SqlExpression) {
    return SqlFunction.simple('MIN', [arg]);
  }

  static max(arg: SqlExpression) {
    return SqlFunction.simple('MAX', [arg]);
  }

  static avg(arg: SqlExpression) {
    return SqlFunction.simple('AVG', [arg]);
  }

  static cast(ex: SqlExpression, asType: SqlType | string): SqlExpression {
    return new SqlFunction({
      functionName: RefName.functionName('CAST'),
      args: SeparatedArray.fromTwoValuesWithSeparator(
        ex,
        Separator.symmetricSpace('AS'),
        SqlType.create(asType),
      ),
    });
  }

  static floor(ex: SqlExpression, timeUnit: string | SqlLiteral): SqlExpression {
    return new SqlFunction({
      functionName: RefName.functionName('FLOOR'),
      args: SeparatedArray.fromTwoValuesWithSeparator(
        ex,
        Separator.symmetricSpace('TO'),
        SqlLiteral.direct(timeUnit),
      ),
    });
  }

  static timeFloor(
    timestampExpr: SqlExpression,
    period: string | SqlLiteral,
    origin?: string | SqlLiteral,
    timezone?: string | SqlLiteral,
  ) {
    return SqlFunction.simple('TIME_FLOOR', compact([timestampExpr, period, origin, timezone]));
  }

  static array(ex: SqlExpression[] | SeparatedArray<SqlExpression>) {
    return new SqlFunction({
      functionName: RefName.functionName('ARRAY'),
      specialParen: 'square',
      args: SeparatedArray.fromArray(ex),
    });
  }

  static stringFormat(format: string | SqlLiteral, ...args: (SqlExpression | LiteralValue)[]) {
    return SqlFunction.simple(
      'STRING_FORMAT',
      ([format] as (SqlExpression | LiteralValue)[]).concat(args),
    );
  }

  static regexpLike(ex: SqlExpression, pattern: string | SqlLiteral) {
    return SqlFunction.simple('REGEXP_LIKE', [ex, pattern]);
  }

  public readonly namespace?: SqlNamespace;
  public readonly functionName: RefName;
  public readonly specialParen?: SpecialParen;
  public readonly args?: SeparatedArray<SqlExpression>;
  public readonly decorator?: string;
  public readonly whereClause?: SqlWhereClause;
  public readonly extendClause?: SqlExtendClause;
  public readonly windowSpec?: SqlWindowSpec;

  constructor(options: SqlFunctionValue) {
    super(options, SqlFunction.type);
    this.namespace = options.namespace;
    this.functionName = options.functionName;
    this.specialParen = options.specialParen;
    this.decorator = options.decorator;
    this.args = options.args;
    this.whereClause = options.whereClause;
    this.extendClause = options.extendClause;
    this.windowSpec = options.windowSpec;
  }

  public valueOf(): SqlFunctionValue {
    const value = super.valueOf() as SqlFunctionValue;
    value.namespace = this.namespace;
    value.functionName = this.functionName;
    value.specialParen = this.specialParen;
    value.decorator = this.decorator;
    value.args = this.args;
    value.whereClause = this.whereClause;
    value.extendClause = this.extendClause;
    value.windowSpec = this.windowSpec;
    return value;
  }

  protected _toRawString(): string {
    const { specialParen } = this;
    const rawParts: string[] = [];

    if (this.namespace) {
      rawParts.push(
        this.namespace.toString(),
        this.getSpace('postNamespace', ''),
        '.',
        this.getSpace('postDot', ''),
      );
    }

    rawParts.push(this.functionName.toString());

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
      } else if (this.extendClause) {
        rawParts.push(this.getSpace('preExtend'), this.extendClause.toString());
      }

      if (this.windowSpec) {
        rawParts.push(
          this.getSpace('preOver'),
          this.getKeyword('over', SqlFunction.DEFAULT_OVER_KEYWORD),
          this.getSpace('postOver'),
          this.windowSpec.toString(),
        );
      }
    }

    return rawParts.join('');
  }

  public changeNamespace(namespace: SqlNamespace | undefined): this {
    const value = this.valueOf();
    if (namespace) {
      value.namespace = namespace;
    } else {
      delete value.namespace;
      value.spacing = this.getSpacingWithout('postNamespace', 'postDot');
    }
    return SqlBase.fromValue(value);
  }

  public getNamespaceName(): string | undefined {
    return this.namespace?.getName();
  }

  public changeNamespaceName(namespace: string | undefined): this {
    return this.changeNamespace(
      namespace
        ? this.namespace
          ? this.namespace.changeName(namespace)
          : SqlNamespace.create(namespace)
        : undefined,
    );
  }

  public getEffectiveFunctionName(): string {
    return this.functionName.name.toUpperCase();
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

  public changeWhereExpression(whereExpression: SqlExpression | undefined): this {
    if (!whereExpression) return this.changeWhereClause(undefined);
    return this.changeWhereClause(
      this.whereClause
        ? this.whereClause.changeExpression(whereExpression)
        : SqlWhereClause.createForFunction(whereExpression),
    );
  }

  public addWhereExpression(whereExpression: SqlExpression): this {
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

  public changeExtendClause(extendClause: SqlExtendClause | undefined): this {
    const value = this.valueOf();
    if (extendClause) {
      value.extendClause = extendClause;
    } else {
      delete value.extendClause;
      value.spacing = this.getSpacingWithout('preExtend');
    }
    return SqlBase.fromValue(value);
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

    if (this.extendClause) {
      const extendClause = this.extendClause._walkHelper(nextStack, fn, postorder);
      if (!extendClause) return;
      if (extendClause !== this.extendClause) {
        ret = ret.changeExtendClause(extendClause as SqlExtendClause);
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

  public resetOwnKeywords() {
    const upperCaseName = this.getEffectiveFunctionName();
    if (Object.keys(this.keywords).length === 0 && upperCaseName === this.functionName.name) {
      return this;
    }
    const value = this.valueOf();
    value.functionName = value.functionName.changeNameAsFunctionName(upperCaseName);
    value.keywords = {};
    return SqlBase.fromValue(value);
  }

  public isCountStar(): boolean {
    if (this.getEffectiveFunctionName() !== 'COUNT') return false;
    const args = this.args;
    if (!args || args.length() !== 1) return false;
    return args.first() instanceof SqlStar;
  }

  public getCastType(): SqlType | undefined {
    if (this.getEffectiveFunctionName() !== 'CAST') return;
    const arg1 = this.args?.get(1);
    return arg1 instanceof SqlType ? arg1 : undefined;
  }

  public getColumnDeclarations(): readonly SqlColumnDeclaration[] | undefined {
    return this.extendClause?.columnDeclarations?.values;
  }

  public changeColumnDeclarations(
    columnDeclarations: readonly SqlColumnDeclaration[] | undefined,
  ): this {
    if (!columnDeclarations) return this.changeExtendClause(undefined);
    return this.changeExtendClause(
      this.extendClause
        ? this.extendClause.changeColumnDeclarations(columnDeclarations)
        : SqlExtendClause.create(columnDeclarations),
    );
  }
}

SqlBase.register(SqlFunction);

SqlFunction.COUNT_STAR = SqlFunction.simple('COUNT', [SqlStar.PLAIN]);
