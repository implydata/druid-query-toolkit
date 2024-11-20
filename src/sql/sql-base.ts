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

import { cleanObject, dedupe, objectMap } from '../utils';

import type { SeparatedArray } from '.';
import { SqlColumn, SqlFunction, SqlLiteral, SqlMulti, SqlTable } from '.';
import { parse as parseSql } from './parser';
import { INDENT, NEWLINE, SPACE } from './utils';

export interface Parens {
  leftSpacing?: string;
  rightSpacing?: string;
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
export type Predicate = (t: SqlBase, stack: SqlBase[]) => boolean;
export type Matcher<T extends SqlBase> = (t: SqlBase, stack: SqlBase[]) => t is T;

export interface PrettifyOptions {
  keywordCasing?: 'preserve';
  clarifyingParens?: 'disable';
}

export type SqlTypeDesignator =
  | 'base'
  | 'type'
  | 'columnList'
  | 'extendClause'
  | 'columnDeclaration'
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
  | 'partitionedByClause'
  | 'partitionByClause'
  | 'clusteredByClause'
  | 'withPart'
  | 'joinPart'
  | 'alias'
  | 'labeledExpression'
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
  | 'column'
  | 'star'
  | 'namespace'
  | 'table'
  | 'unary'
  | 'windowSpec'
  | 'frameBound';

export type KeywordName =
  | 'all'
  | 'and'
  | 'as'
  | 'between'
  | 'case'
  | 'clusteredBy'
  | 'currentRow'
  | 'decorator'
  | 'direction'
  | 'else'
  | 'end'
  | 'escape'
  | 'explainPlanFor'
  | 'extend'
  | 'filter'
  | 'following'
  | 'from'
  | 'groupBy'
  | 'having'
  | 'insert'
  | 'interval'
  | 'into'
  | 'join'
  | 'joinType'
  | 'limit'
  | 'natural'
  | 'offset'
  | 'on'
  | 'op'
  | 'orderBy'
  | 'over'
  | 'overwrite'
  | 'partitionBy'
  | 'partitionedBy'
  | 'plan'
  | 'preceding'
  | 'range'
  | 'replace'
  | 'row'
  | 'rows'
  | 'select'
  | 'symmetric'
  | 'then'
  | 'timestamp'
  | 'type'
  | 'unbounded'
  | 'union'
  | 'using'
  | 'values'
  | 'when'
  | 'where'
  | 'with';

export type SpaceName =
  | 'final'
  | 'initial'
  | 'postAnd'
  | 'postArguments'
  | 'postArrow'
  | 'postAs'
  | 'postBetween'
  | 'postBoundValue'
  | 'postCase'
  | 'postCaseExpression'
  | 'postClusteredBy'
  | 'postColumn'
  | 'postColumnDeclarations'
  | 'postColumns'
  | 'postDecorator'
  | 'postDot'
  | 'postElse'
  | 'postEscape'
  | 'postExplainPlanFor'
  | 'postExpressions'
  | 'postExtend'
  | 'postFilter'
  | 'postFrame'
  | 'postFrameType'
  | 'postFrom'
  | 'postGroupBy'
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
  | 'postNamespace'
  | 'postNatural'
  | 'postOffset'
  | 'postOn'
  | 'postOp'
  | 'postOrderBy'
  | 'postOver'
  | 'postOverwrite'
  | 'postPartitionBy'
  | 'postPartitionedBy'
  | 'postReplace'
  | 'postReplaceClause'
  | 'postRow'
  | 'postSelect'
  | 'postSymmetric'
  | 'postTable'
  | 'postThen'
  | 'postTimestamp'
  | 'postUnion'
  | 'postUsing'
  | 'postValues'
  | 'postWhen'
  | 'postWhenExpressions'
  | 'postWhere'
  | 'postWindowName'
  | 'postWith'
  | 'postWithClause'
  | 'preAlias'
  | 'preAnd'
  | 'preArrow'
  | 'preAs'
  | 'preClusteredByClause'
  | 'preColumns'
  | 'preDirection'
  | 'preElse'
  | 'preEnd'
  | 'preEscape'
  | 'preExtend'
  | 'preFilter'
  | 'preFormat'
  | 'preFromClause'
  | 'preGroupByClause'
  | 'preHavingClause'
  | 'preJoin'
  | 'preLeftParen'
  | 'preLimitClause'
  | 'preOffsetClause'
  | 'preOn'
  | 'preOp'
  | 'preOrderByClause'
  | 'preOver'
  | 'preOverwrite'
  | 'prePartitionedByClause'
  | 'preUnion'
  | 'preUsing'
  | 'preWhereClause';

export interface SqlBaseValue {
  type?: SqlTypeDesignator;
  spacing?: Readonly<Partial<Record<SpaceName, string>>>;
  keywords?: Readonly<Partial<Record<KeywordName, string>>>;
  parens?: readonly Parens[];
}

export abstract class SqlBase {
  static type: SqlTypeDesignator = 'base';

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

  static normalizeKeywordSpace(keyword: string): string {
    return keyword
      .replace(/\/\*.*\*\//g, ' ')
      .replace(/--[^\n]*\n/gm, ' ')
      .replace(/\s+/gm, ' ');
  }

  static classMap: Record<string, typeof SqlBase> = {};
  static register(ex: typeof SqlBase): void {
    SqlBase.classMap[ex.type] = ex;
  }

  static getConstructorFor(type: SqlTypeDesignator): typeof SqlBase {
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

  public type: SqlTypeDesignator;
  public spacing: Readonly<Record<string, string>>;
  public keywords: Readonly<Record<string, string>>;
  public parens?: readonly Parens[];

  constructor(options: SqlBaseValue, typeOverride: SqlTypeDesignator) {
    const type = typeOverride || options.type;
    if (!type) throw new Error(`could not determine type`);
    this.type = type;
    this.spacing = cleanObject(options.spacing || {});
    this.keywords = cleanObject(options.keywords || {});
    this.parens = options.parens;
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

  public toJSON() {
    return this.toString();
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

  public hasParens(): boolean {
    return Boolean(this.getParens().length);
  }

  public changeParens(parens: readonly Parens[]): this {
    const newParens = parens.length ? parens : undefined;
    if (this.parens === newParens) return this;
    const value = this.valueOf();
    value.parens = newParens;
    return SqlBase.fromValue(value);
  }

  public addParens(leftSpacing?: string, rightSpacing?: string): this {
    return this.changeParens(
      this.getParens().concat({
        leftSpacing,
        rightSpacing,
      }),
    );
  }

  public ensureParens(leftSpacing?: string, rightSpacing?: string): this {
    if (this.parens) return this;
    return this.addParens(leftSpacing, rightSpacing);
  }

  public removeOwnParenSpaces(): this {
    if (!this.parens) return this;
    return this.changeParens(this.parens.map(() => ({})));
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

  public normalizeOwnKeywordSpaces(): this {
    if (Object.keys(this.keywords).length === 0) return this;
    const value = this.valueOf();
    value.keywords = objectMap(value.keywords || {}, SqlBase.normalizeKeywordSpace);
    return SqlBase.fromValue(value);
  }

  public clearOwnSeparators(): this {
    return this;
  }

  public getSpace(name: SpaceName, defaultSpace = SPACE) {
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

  public getKeyword(
    name: KeywordName,
    defaultKeyword: string,
    followSpace?: SpaceName,
    defaultFollowSpace?: string,
  ): string {
    let keyword = this.keywords[name];
    if (typeof keyword === 'undefined') keyword = SqlBase.capitalize(defaultKeyword);
    if (keyword && followSpace) keyword += this.getSpace(followSpace, defaultFollowSpace);
    return keyword;
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
        let { leftSpacing, rightSpacing } = paren;
        if (typeof leftSpacing === 'undefined' && typeof rightSpacing === 'undefined') {
          const lines = str.split('\n');
          if (lines.length > 1) {
            leftSpacing = rightSpacing = '\n';
            str = lines.map(l => INDENT + l).join(NEWLINE);
          }
        }
        str = `(${leftSpacing || ''}${str}${rightSpacing || ''})`;
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

  public some(fn: Predicate): boolean {
    let some = false;
    this.walk((b, s) => {
      some = some || fn(b, s);
      return some ? undefined : b;
    });
    return some;
  }

  public every(fn: Predicate): boolean {
    let every = true;
    this.walk((b, s) => {
      every = every && fn(b, s);
      return every ? b : undefined;
    });
    return every;
  }

  public collect<T extends SqlBase>(fn: Matcher<T>): T[] {
    const collected: T[] = [];
    this.walk((b, s) => {
      if (fn(b, s)) {
        collected.push(b);
      }
      return b;
    });
    return collected;
  }

  public find<T extends SqlBase>(fn: Matcher<T>): T | undefined {
    let found: T | undefined;
    this.walk((b, s) => {
      if (fn(b, s)) {
        found = b;
        return;
      }
      return b;
    });
    return found;
  }

  public getColumns(): SqlColumn[] {
    return this.collect((b): b is SqlColumn => b instanceof SqlColumn);
  }

  public getUsedColumnNames(): string[] {
    return dedupe(this.getColumns().map(x => x.getName())).sort();
  }

  public getTables(): SqlTable[] {
    return this.collect((b): b is SqlTable => b instanceof SqlTable);
  }

  public getUsedTableNames(): string[] {
    return dedupe(this.getTables().map(x => x.getName())).sort();
  }

  public getFirstTableName(): string | undefined {
    return this.find((b): b is SqlTable => b instanceof SqlTable)?.getName();
  }

  public getFirstSchema(): string | undefined {
    return this.find(
      (b): b is SqlTable => b instanceof SqlTable && Boolean(b.namespace),
    )?.getNamespaceName();
  }

  public contains(thing: SqlBase): boolean {
    return this.some(b => b.equals(thing));
  }

  public containsColumnName(columnName: string): boolean {
    return this.some(b => b instanceof SqlColumn && b.getName() === columnName);
  }

  public containsFunction(functionName: string): boolean {
    functionName = functionName.toUpperCase();
    return this.some(
      ex => ex instanceof SqlFunction && ex.getEffectiveFunctionName() === functionName,
    );
  }

  public getFirstColumnName(): string | undefined {
    const column = this.getColumns()[0];
    if (!column) return;
    return column.getName();
  }

  public addClarifyingParens(): this {
    return this.walk((ex, stack) => {
      if (ex instanceof SqlMulti && (ex.op === 'AND' || ex.op === 'OR') && !ex.hasParens()) {
        const parent = stack[0];
        if (parent instanceof SqlMulti && (parent.op === 'AND' || parent.op === 'OR')) {
          return ex.addParens();
        }
      }
      return ex;
    }) as any;
  }

  public prettify(options: PrettifyOptions = {}): this {
    const { keywordCasing, clarifyingParens } = options;
    return this.applyIf(clarifyingParens !== 'disable', ex =>
      ex.addClarifyingParens(),
    ).walkPostorder(ex => {
      const resetSpaceEx = ex.resetOwnSpacing().clearOwnSeparators().removeOwnParenSpaces();
      return keywordCasing === 'preserve'
        ? resetSpaceEx.normalizeOwnKeywordSpaces()
        : resetSpaceEx.resetOwnKeywords();
    }) as any;
  }

  public prettyTrim(maxLength: number): this {
    return this.walk(ex => {
      if (ex instanceof SqlLiteral || ex instanceof SqlColumn) {
        return ex.prettyTrim(maxLength);
      }
      return ex;
    }) as any;
  }

  public apply<T>(fn: (self: this) => T): T {
    return fn(this);
  }

  public applyIf<T>(
    condition: unknown,
    thenFn: (self: this) => T,
    elseFn?: (self: this) => T,
  ): T | this {
    if (condition) {
      return thenFn(this);
    } else if (elseFn) {
      return elseFn(this);
    } else {
      return this;
    }
  }

  public applyForEach<T>(
    things: readonly T[],
    fn: (self: this, thing: T, index: number) => this,
  ): this {
    return things.reduce(fn, this);
  }
}
