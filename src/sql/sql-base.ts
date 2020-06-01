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

import { SeparatedArray, SqlAlias, SqlRef } from '../index';
import { dedupe, filterMap } from '../utils';

import { RESERVED_KEYWORDS } from './reserved-keywords';
import { SPECIAL_FUNCTIONS } from './special-functions';

export interface Parens {
  leftSpacing: string;
  rightSpacing: string;
}

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

  static isSpecialFunction(functionName: string) {
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

  static walkSeparatedArray(
    a: SeparatedArray<SqlBase> | undefined,
    fn: (t: SqlBase) => void,
  ): void {
    if (a) {
      a.values.forEach(v => {
        v.walk(fn);
      });
    }
  }

  static getColumnName(column: string | SqlBase): string {
    if (typeof column === 'string') return column;
    if (column instanceof SqlRef && column.column) return column.column;
    if (column instanceof SqlAlias) {
      // @ts-ignore
      return column.alias.name;
    }
    return '';
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
    if (options.parens) {
      this.parens = options.parens;
    }
  }

  public valueOf() {
    const value: SqlBaseValue = { type: this.type, innerSpacing: this.innerSpacing };
    if (this.innerSpacing) value.innerSpacing = this.innerSpacing;
    if (this.parens) value.parens = this.parens;
    return value;
  }

  public addParens(leftSpacing: string | null, rightSpacing: string | null): this {
    const value = this.valueOf();
    value.parens = (value.parens || []).concat({
      leftSpacing: leftSpacing || '',
      rightSpacing: rightSpacing || '',
    });
    return SqlBase.fromValue(value);
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

  public abstract toRawString(): string;

  toString(): string {
    const { parens } = this;
    let str = this.toRawString();
    if (parens) {
      for (const paren of parens) {
        str = `(${paren.leftSpacing}${str}${paren.rightSpacing})`;
      }
    }
    return str;
  }

  public walk(fn: (t: SqlBase) => void) {
    fn(this);
  }

  public some(fn: (t: SqlBase) => boolean) {
    let some = false;
    this.walk(b => {
      some = some || fn(b);
    });
    return some;
  }

  public every(fn: (t: SqlBase) => boolean) {
    let every = false;
    this.walk(b => {
      every = every && fn(b);
    });
    return every;
  }

  public getSqlRefs(): SqlRef[] {
    const refs: SqlRef[] = [];
    this.walk(t => {
      if (t instanceof SqlRef) {
        refs.push(t);
      }
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
}
