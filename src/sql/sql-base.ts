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

import { cleanObject, dedupe, filterMap } from '../utils';

import { LiteralValue, SeparatedArray, SqlLiteral, SqlPlaceholder, SqlRef } from '.';
import { parseSql } from './parser';
import { RESERVED_KEYWORDS } from './reserved-keywords';
import { SPECIAL_FUNCTIONS } from './special-functions';

export interface Parens {
  leftSpacing: string;
  rightSpacing: string;
}

export type Substitutor = (t: SqlBase, stack: SqlBase[]) => SqlBase | undefined;
export type Matcher = (t: SqlBase, stack: SqlBase[]) => boolean;

export type SqlType =
  | 'base'
  | 'query'
  | 'whereClause'
  | 'orderByExpression'
  | 'fromClause'
  | 'offsetClause'
  | 'orderByClause'
  | 'havingClause'
  | 'limitClause'
  | 'groupByClause'
  | 'withPart'
  | 'joinPart'
  | 'alias'
  | 'betweenAndHelper'
  | 'likeEscapeHelper'
  | 'comparison'
  | 'literal'
  | 'placeholder'
  | 'interval'
  | 'multi'
  | 'function'
  | 'case'
  | 'whenThenPart'
  | 'ref'
  | 'unary';

export interface SqlBaseValue {
  type?: SqlType;
  innerSpacing?: Record<string, string>;
  parens?: readonly Parens[];
}

const reservedKeywordLookup: Record<string, boolean> = {};
for (const r of RESERVED_KEYWORDS) {
  reservedKeywordLookup[r] = true;
}

const specialFunctionLookup: Record<string, boolean> = {};
for (const r of SPECIAL_FUNCTIONS) {
  specialFunctionLookup[r] = true;
}

export abstract class SqlBase {
  static type: SqlType = 'base';
  static RESERVED_KEYWORDS = RESERVED_KEYWORDS;
  static SPECIAL_FUNCTIONS = SPECIAL_FUNCTIONS;

  static isReservedKeyword(keyword: string) {
    return Boolean(reservedKeywordLookup[keyword.toUpperCase()]);
  }

  static isNakedRefAppropriate(word: string) {
    if (word === 'user') return true;
    return !SqlBase.isReservedKeyword(word);
  }

  static isNakedFunction(functionName: string) {
    return Boolean(specialFunctionLookup[functionName.toUpperCase()]);
  }

  static parseSql(input: string | SqlBase): SqlBase {
    if (typeof input === 'string') {
      return parseSql(input);
    } else if (input instanceof SqlBase) {
      return input;
    } else {
      throw new Error('unknown input');
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
  public innerSpacing: Record<string, string>;
  public parens?: readonly Parens[];

  constructor(options: SqlBaseValue, typeOverride: SqlType) {
    const type = typeOverride || options.type;
    if (!type) throw new Error(`could not determine type`);
    this.type = type;
    this.innerSpacing = cleanObject(options.innerSpacing || {});
    const { parens } = options;
    if (parens && parens.length) {
      this.parens = parens;
    }
  }

  public valueOf() {
    const value: SqlBaseValue = {
      type: this.type,
      innerSpacing: this.innerSpacing,
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

  public resetOwnInnerSpace(): this {
    if (Object.keys(this.innerSpacing).length === 0) return this;
    const value = this.valueOf();
    value.innerSpacing = {};
    return SqlBase.fromValue(value);
  }

  public clearOwnStaticKeywords(): this {
    return this;
  }

  public clearOwnSeparators(): this {
    return this;
  }

  public getInnerSpace(name: string, defaultSpace = ' ') {
    const { innerSpacing } = this;
    if (!innerSpacing) return defaultSpace;
    const space = innerSpacing[name];
    if (typeof space !== 'string') return defaultSpace;
    return space;
  }

  protected getInnerSpacingWithout(...toRemove: string[]) {
    const ret = Object.assign({}, this.innerSpacing);
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
    return str;
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

  public isHelper(): boolean {
    return this.type.endsWith('Helper');
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
    return dedupe(filterMap(this.getRefs(), x => (x.isStar() ? undefined : x.column))).sort();
  }

  public contains(thing: SqlBase): boolean {
    return this.some(b => b.equals(thing));
  }

  public containsColumn(column: string): boolean {
    return this.some(b => b instanceof SqlRef && !b.isStar() && b.column === column);
  }

  public getFirstColumn(): string | undefined {
    const ref = this.getRefs().find(x => !x.isStar() && x.column);
    if (!ref) return;
    return ref.column;
  }

  public fillPlaceholders(fillWith: (SqlBase | LiteralValue)[]): SqlBase {
    let i = 0;
    return this.walk(ex => {
      if (ex instanceof SqlPlaceholder) {
        if (i === fillWith.length) {
          return ex;
        }

        let filler = fillWith[i++];
        if (!(filler instanceof SqlBase)) {
          if (typeof filler === 'string') {
            filler = SqlBase.parseSql(filler);
          } else {
            filler = SqlLiteral.create(filler);
          }
        }

        return filler;
      }
      return ex;
    });
  }

  public prettify(): SqlBase {
    return this.walkPostorder(ex => {
      return ex
        .resetOwnInnerSpace()
        .clearOwnStaticKeywords()
        .clearOwnSeparators()
        .removeOwnParenSpaces();
    });
  }

  public prettyTrim(maxLength: number): SqlBase {
    return this.walk(ex => {
      if (ex instanceof SqlLiteral || ex instanceof SqlRef) {
        return ex.prettyTrim(maxLength);
      }
      return ex;
    });
  }
}
