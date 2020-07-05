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

import { parseSql } from '..';
import { dedupe, filterMap } from '../utils';

import { LiteralValue, SeparatedArray, SqlLiteral, SqlPlaceholder, SqlRef } from '.';
import { RESERVED_KEYWORDS } from './reserved-keywords';
import { SPECIAL_FUNCTIONS } from './special-functions';

export interface Parens {
  leftSpacing: string;
  rightSpacing: string;
}

export type Substitutor = (t: SqlBase, stack: SqlBase[]) => SqlBase | undefined;

export interface SqlBaseValue {
  type?: string;
  innerSpacing?: Record<string, string>;
  parens?: Parens[];
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
  static RESERVED_KEYWORDS = RESERVED_KEYWORDS;
  static SPECIAL_FUNCTIONS = SPECIAL_FUNCTIONS;

  static isReservedKeyword(keyword: string) {
    return Boolean(reservedKeywordLookup[keyword.toUpperCase()]);
  }

  static isNakedFunction(functionName: string) {
    return Boolean(specialFunctionLookup[functionName.toUpperCase()]);
  }

  static cleanObject(obj: Record<string, any>): Record<string, string> {
    const cleanObj: Record<string, string> = {};
    for (const k in obj) {
      const v = obj[k];
      if (typeof v === 'string') cleanObj[k] = v;
    }
    return cleanObj;
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
  static register(type: string, ex: typeof SqlBase): void {
    SqlBase.classMap[type] = ex;
  }

  static getConstructorFor(type: string): typeof SqlBase {
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

  public type: string;
  public innerSpacing: Record<string, string>;
  public parens?: Parens[];

  constructor(options: SqlBaseValue, typeOverride: string) {
    const type = typeOverride || options.type;
    if (!type) throw new Error(`could not determine type`);
    this.type = type;
    this.innerSpacing = SqlBase.cleanObject(options.innerSpacing || {});
    const { parens } = options;
    if (parens && parens.length) {
      this.parens = parens;
    }
  }

  public valueOf() {
    const value: SqlBaseValue = { type: this.type, innerSpacing: this.innerSpacing };
    if (this.innerSpacing) value.innerSpacing = this.innerSpacing;
    if (this.parens) value.parens = this.parens;
    return value;
  }

  public equals(other: SqlBase): boolean {
    // ToDo: make this not use toString
    return this.toString() === other.toString();
  }

  public logicalEquals(other: SqlBase): boolean {
    // ToDo: make this not use toString
    return this.toString() === other.toString();
  }

  public addParens(leftSpacing?: string, rightSpacing?: string): this {
    const value = this.valueOf();
    value.parens = (this.parens || []).concat({
      leftSpacing: leftSpacing || '',
      rightSpacing: rightSpacing || '',
    });
    return SqlBase.fromValue(value);
  }

  public ensureParens(leftSpacing?: string, rightSpacing?: string): this {
    if (this.parens) return this;
    return this.addParens(leftSpacing, rightSpacing);
  }

  public removeParenSpaces(): this {
    if (!this.parens) return this;
    const value = this.valueOf();
    value.parens = this.parens.map(() => ({
      leftSpacing: '',
      rightSpacing: '',
    }));
    return SqlBase.fromValue(value);
  }

  public resetInnerSpace(): this {
    if (Object.keys(this.innerSpacing).length === 0) return this;
    const value = this.valueOf();
    value.innerSpacing = {};
    return SqlBase.fromValue(value);
  }

  public clearStaticKeywords(): this {
    return this;
  }

  public clearSeparators(): this {
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

  toString(): string {
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

    ret = ret._walkInner(stack.concat(ret), fn, postorder);
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

  public some(fn: (t: SqlBase) => boolean): boolean {
    let some = false;
    this.walk(b => {
      some = some || fn(b);
      return some ? undefined : b;
    });
    return some;
  }

  public every(fn: (t: SqlBase) => boolean): boolean {
    let every = true;
    this.walk(b => {
      every = every && fn(b);
      return every ? b : undefined;
    });
    return every;
  }

  public getSqlRefs(): SqlRef[] {
    const refs: SqlRef[] = [];
    this.walk(t => {
      if (t instanceof SqlRef) {
        refs.push(t);
      }
      return t;
    });
    return refs;
  }

  public getUsedColumns(): string[] {
    return dedupe(filterMap(this.getSqlRefs(), x => x.column));
  }

  public containsColumn(column: string): boolean {
    return Boolean(this.getSqlRefs().find(x => x.column === column));
  }

  public getFirstColumn(): string | undefined {
    const ref = this.getSqlRefs().find(x => x.column);
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
            filler = parseSql(filler);
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
        .resetInnerSpace()
        .clearStaticKeywords()
        .clearSeparators()
        .removeParenSpaces();
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
