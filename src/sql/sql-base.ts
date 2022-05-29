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

import { cleanObject, dedupe } from '../utils';

import { SeparatedArray, SqlLiteral, SqlRef } from '.';
import { parseSql } from './parser';

export interface Parens {
  leftSpacing: string;
  rightSpacing: string;
}

function pseudoRandomCapitalization(str: string): string {
  const upper = str.toUpperCase();
  const lower = str.toLowerCase();
  let seed = 0;
  return upper
    .split('')
    .map((u, i) => {
      seed += u.charCodeAt(0);
      seed = (457 * seed + 1279) % 3631;
      return seed % 5 > 1 ? u : lower[i];
    })
    .join('');
}

export type Substitutor = (t: SqlBase, stack: SqlBase[]) => SqlBase | undefined;
export type Matcher = (t: SqlBase, stack: SqlBase[]) => boolean;

export interface PrettifyOptions {
  keywordCasing?: 'preserve';
}

export type SqlType =
  | 'base'
  | 'columnList'
  | 'record'
  | 'query'
  | 'withQuery'
  | 'values'
  | 'withClause'
  | 'whereClause'
  | 'orderByExpression'
  | 'fromClause'
  | 'offsetClause'
  | 'orderByClause'
  | 'havingClause'
  | 'limitClause'
  | 'groupByClause'
  | 'insertClause'
  | 'replaceClause'
  | 'explainClause'
  | 'partitionedByClause'
  | 'clusteredByClause'
  | 'withPart'
  | 'joinPart'
  | 'alias'
  | 'betweenPart'
  | 'likePart'
  | 'comparison'
  | 'literal'
  | 'placeholder'
  | 'interval'
  | 'multi'
  | 'function'
  | 'case'
  | 'whenThenPart'
  | 'ref'
  | 'star'
  | 'tableRef'
  | 'unary';

export type KeywordName =
  | 'all'
  | 'and'
  | 'as'
  | 'by'
  | 'case'
  | 'clustered'
  | 'decorator'
  | 'direction'
  | 'else'
  | 'end'
  | 'escape'
  | 'explain'
  | 'filter'
  | 'for'
  | 'from'
  | 'functionName'
  | 'group'
  | 'having'
  | 'insert'
  | 'interval'
  | 'into'
  | 'join'
  | 'joinType'
  | 'limit'
  | 'not'
  | 'offset'
  | 'on'
  | 'op'
  | 'order'
  | 'overwrite'
  | 'partitioned'
  | 'plan'
  | 'replace'
  | 'row'
  | 'select'
  | 'symmetric'
  | 'then'
  | 'time'
  | 'timestamp'
  | 'union'
  | 'values'
  | 'when'
  | 'where'
  | 'with';

export type SpaceName =
  | 'final'
  | 'initial'
  | 'not'
  | 'postAnd'
  | 'postArguments'
  | 'postAs'
  | 'postBy'
  | 'postCase'
  | 'postCaseExpression'
  | 'postClustered'
  | 'postColumns'
  | 'postDecorator'
  | 'postElse'
  | 'postEscape'
  | 'postExplain'
  | 'postExplainClause'
  | 'postExpressions'
  | 'postFilter'
  | 'postFrom'
  | 'postGroup'
  | 'postHaving'
  | 'postInsert'
  | 'postInsertClause'
  | 'postInterval'
  | 'postIntervalValue'
  | 'postInto'
  | 'postJoin'
  | 'postJoinType'
  | 'postLeftParen'
  | 'postLimit'
  | 'postNamespaceDot'
  | 'postOffset'
  | 'postOn'
  | 'postOp'
  | 'postOrder'
  | 'postOverwrite'
  | 'postPartitioned'
  | 'postPlan'
  | 'postReplace'
  | 'postReplaceClause'
  | 'postRow'
  | 'postSelect'
  | 'postSymmetric'
  | 'postTable'
  | 'postTableDot'
  | 'postThen'
  | 'postTimestamp'
  | 'postUnion'
  | 'postValues'
  | 'postWhen'
  | 'postWhenExpressions'
  | 'postWhere'
  | 'postWith'
  | 'postWithClause'
  | 'preAlias'
  | 'preAnd'
  | 'preAs'
  | 'preClusteredByClause'
  | 'preColumns'
  | 'preDirection'
  | 'preElse'
  | 'preEnd'
  | 'preEscape'
  | 'preFilter'
  | 'preFromClause'
  | 'preGroupByClause'
  | 'preHavingClause'
  | 'preJoin'
  | 'preLeftParen'
  | 'preLimitClause'
  | 'preNamespaceDot'
  | 'preOffsetClause'
  | 'preOn'
  | 'preOp'
  | 'preOrderByClause'
  | 'preOverwrite'
  | 'prePartitionedByClause'
  | 'preTableDot'
  | 'preTime'
  | 'preUnion'
  | 'preWhereClause';

export interface SqlBaseValue {
  type?: SqlType;
  spacing?: Partial<Record<SpaceName, string>>;
  keywords?: Partial<Record<KeywordName, string>>;
  parens?: readonly Parens[];
}

export abstract class SqlBase {
  static type: SqlType = 'base';

  static parseSql(input: string | SqlBase): SqlBase {
    if (typeof input === 'string') {
      return parseSql(input);
    } else if (input instanceof SqlBase) {
      return input;
    } else {
      throw new Error('unknown input');
    }
  }

  static capitalize: (keyword: string) => string = keyword => {
    return keyword;
  };

  static setCapitalization(capitalization: 'upper' | 'lower' | 'title' | 'random'): void {
    switch (capitalization) {
      case 'upper':
        SqlBase.capitalize = k => k;
        break;

      case 'lower':
        SqlBase.capitalize = k => k.toLowerCase();
        break;

      case 'title':
        SqlBase.capitalize = k => k.slice(0, 1) + k.slice(1).toLowerCase();
        break;

      case 'random':
        SqlBase.capitalize = pseudoRandomCapitalization;
        break;

      default:
        throw new Error(`unknown capitalization '${capitalization}'`);
    }
  }

  static walkSeparatedArray<T extends SqlBase>(
    a: SeparatedArray<T>,
    stack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SeparatedArray<T> | undefined {
    let stop = false;
    let changed = false;
    const newA = a.map(v => {
      if (stop) return v;
      const ret = v._walkHelper(stack, fn, postorder) as T;
      if (!ret) {
        stop = true;
        return v;
      }
      if (ret !== v) {
        changed = true;
        // if (ret.type !== v.type) {
        //   throw new Error(`can not change type of array (from ${v.type} to ${ret.type})`);
        // }
      }
      return ret;
    });
    if (stop) return undefined;
    return changed ? newA : a;
  }

  static classMap: Record<string, typeof SqlBase> = {};
  static register(ex: typeof SqlBase): void {
    SqlBase.classMap[ex.type] = ex;
  }

  static getConstructorFor(type: SqlType): typeof SqlBase {
    const ClassFn = SqlBase.classMap[type];
    if (!ClassFn) throw new Error(`unsupported expression type '${type}'`);
    return ClassFn;
  }

  static fromValue(parameters: SqlBaseValue): any {
    const { type } = parameters;
    if (!type) throw new Error(`must set 'type' to use fromValue`);
    const ClassFn = SqlBase.getConstructorFor(type) as any;
    return new ClassFn(parameters);
  }

  public type: SqlType;
  public spacing: Record<string, string>;
  public keywords: Record<string, string>;
  public parens?: readonly Parens[];

  constructor(options: SqlBaseValue, typeOverride: SqlType) {
    const type = typeOverride || options.type;
    if (!type) throw new Error(`could not determine type`);
    this.type = type;
    this.spacing = cleanObject(options.spacing || {});
    this.keywords = cleanObject(options.keywords || {});
    const { parens } = options;
    if (parens && parens.length) {
      this.parens = parens;
    }
  }

  public valueOf() {
    const value: SqlBaseValue = {
      type: this.type,
      spacing: this.spacing,
      keywords: this.keywords,
    };
    if (this.parens) value.parens = this.parens;
    return value;
  }

  public equals(other: SqlBase | undefined): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (this.type !== other.type) return false;
    return this.toString() === other.toString(); // ToDo: make this not use toString
  }

  public logicalEquals(other: SqlBase | undefined): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (this.type !== other.type) return false;
    return this.prettify().toString() === other.prettify().toString(); // ToDo: make this not use toString
  }

  public getParens(): readonly Parens[] {
    return this.parens || [];
  }

  public changeParens(parens: readonly Parens[]) {
    const value = this.valueOf();
    value.parens = parens;
    return SqlBase.fromValue(value);
  }

  public addParens(leftSpacing?: string, rightSpacing?: string): this {
    return this.changeParens(
      this.getParens().concat({
        leftSpacing: leftSpacing || '',
        rightSpacing: rightSpacing || '',
      }),
    );
  }

  public ensureParens(leftSpacing?: string, rightSpacing?: string): this {
    if (this.parens) return this;
    return this.addParens(leftSpacing, rightSpacing);
  }

  public removeOwnParenSpaces(): this {
    if (!this.parens) return this;
    return this.changeParens(
      this.parens.map(() => ({
        leftSpacing: '',
        rightSpacing: '',
      })),
    );
  }

  public resetOwnSpacing(): this {
    if (Object.keys(this.spacing).length === 0) return this;
    const value = this.valueOf();
    value.spacing = {};
    return SqlBase.fromValue(value);
  }

  public resetOwnKeywords(): this {
    if (Object.keys(this.keywords).length === 0) return this;
    const value = this.valueOf();
    value.keywords = {};
    return SqlBase.fromValue(value);
  }

  public clearOwnSeparators(): this {
    return this;
  }

  public getSpace(name: SpaceName, defaultSpace = ' ') {
    const s = this.spacing[name];
    return typeof s === 'string' ? s : defaultSpace;
  }

  public changeSpace(name: SpaceName, space: string): this {
    return this.changeSpaces({ [name]: space });
  }

  public changeSpaces(newSpacing: Partial<Record<SpaceName, string>>): this {
    const value = this.valueOf();
    value.spacing = { ...value.spacing, ...newSpacing };
    return SqlBase.fromValue(value);
  }

  protected getSpacingWithout(...toRemove: SpaceName[]) {
    const ret = { ...this.spacing };
    for (const thing of toRemove) {
      delete ret[thing];
    }
    return ret;
  }

  public getKeyword(name: KeywordName, defaultKeyword: string): string {
    return this.keywords[name] || SqlBase.capitalize(defaultKeyword);
  }

  protected getKeywordsWithout(...toRemove: KeywordName[]) {
    const ret = { ...this.keywords };
    for (const thing of toRemove) {
      delete ret[thing];
    }
    return ret;
  }

  protected abstract _toRawString(): string;

  public toString(): string {
    const { parens } = this;
    let str = this._toRawString();
    if (parens) {
      for (const paren of parens) {
        str = `(${paren.leftSpacing}${str}${paren.rightSpacing})`;
      }
    }
    return this.getSpace('initial', '') + str + this.getSpace('final', '');
  }

  public walk(fn: Substitutor): SqlBase {
    const ret = this._walkHelper([], fn, false);
    if (!ret) return this;
    return ret;
  }

  public walkPostorder(fn: Substitutor): SqlBase {
    const ret = this._walkHelper([], fn, true);
    if (!ret) return this;
    return ret;
  }

  public _walkHelper(stack: SqlBase[], fn: Substitutor, postorder: boolean): SqlBase | undefined {
    let ret: SqlBase | undefined = this;

    if (!postorder) {
      ret = fn(ret, stack);
      if (!ret) return;
      if (ret !== this) return ret; // In a preorder scan we do not want to scan replacement inner object if it has changed
    }

    ret = ret._walkInner([ret].concat(stack), fn, postorder);
    if (!ret) return;

    if (postorder) {
      ret = fn(ret, stack);
      if (!ret) return;
    }

    return ret;
  }

  public _walkInner(
    _nextStack: SqlBase[],
    _fn: Substitutor,
    _postorder: boolean,
  ): SqlBase | undefined {
    return this;
  }

  public isPart(): boolean {
    return this.type.endsWith('Part');
  }

  public some(fn: Matcher): boolean {
    let some = false;
    this.walk((b, s) => {
      some = some || fn(b, s);
      return some ? undefined : b;
    });
    return some;
  }

  public every(fn: Matcher): boolean {
    let every = true;
    this.walk((b, s) => {
      every = every && fn(b, s);
      return every ? b : undefined;
    });
    return every;
  }

  public collect(fn: Matcher): SqlBase[] {
    const collected: SqlBase[] = [];
    this.walk((b, s) => {
      if (fn(b, s)) {
        collected.push(b);
      }
      return b;
    });
    return collected;
  }

  public getRefs(): SqlRef[] {
    return this.collect(b => b instanceof SqlRef) as SqlRef[];
  }

  public getUsedColumns(): string[] {
    return dedupe(this.getRefs().map(x => x.getColumn())).sort();
  }

  public contains(thing: SqlBase): boolean {
    return this.some(b => b.equals(thing));
  }

  public containsColumn(column: string): boolean {
    return this.some(b => b instanceof SqlRef && b.getColumn() === column);
  }

  public getFirstColumn(): string | undefined {
    const ref = this.getRefs()[0];
    if (!ref) return;
    return ref.getColumn();
  }

  public prettify(options: PrettifyOptions = {}): SqlBase {
    const { keywordCasing } = options;
    return this.walkPostorder(ex => {
      const resetSpaceEx = ex.resetOwnSpacing().clearOwnSeparators().removeOwnParenSpaces();
      return keywordCasing === 'preserve' ? resetSpaceEx : resetSpaceEx.resetOwnKeywords();
    });
  }

  public prettyTrim(maxLength: number): this {
    return this.walk(ex => {
      if (ex instanceof SqlLiteral || ex instanceof SqlRef) {
        return ex.prettyTrim(maxLength);
      }
      return ex;
    }) as any;
  }

  public apply<T>(fn: (self: this) => T): T {
    return fn(this);
  }

  public applyIf(condition: unknown, fn: (self: this) => this): this {
    if (!condition) return this;
    return fn(this);
  }

  public applyForEach<T>(
    things: readonly T[],
    fn: (self: this, thing: T, index: number) => this,
  ): this {
    return things.reduce(fn, this);
  }
}
