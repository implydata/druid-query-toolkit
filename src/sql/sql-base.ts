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

import { SqlAliasRef, SqlRef } from '../index';

export interface Parens {
  leftSpacing: string;
  rightSpacing: string;
}

export interface SqlBaseValue {
  type: string;
  innerSpacing: Record<string, string>;
  parens?: Parens[];
}

export abstract class SqlBase {
  static cleanObject(obj: Record<string, any> | undefined): Record<string, string> | undefined {
    if (!obj) return obj;
    const cleanObj: Record<string, string> = {};
    for (const k in obj) {
      const v = obj[k];
      if (typeof v === 'string') cleanObj[k] = v;
    }
    return cleanObj;
  }

  static getColumnName(column: string | SqlBase): string {
    if (typeof column === 'string') return column;
    if (column instanceof SqlRef && column.column) return column.column;
    if (column instanceof SqlAliasRef) {
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
    const ClassFn = SqlBase.getConstructorFor(type) as any;
    return new ClassFn(parameters);
  }

  public type: string;
  public innerSpacing: Record<string, string>;
  public parens?: Parens[];

  constructor(options: SqlBaseValue, typeOverride: string) {
    this.type = typeOverride || options.type;
    this.innerSpacing = SqlBase.cleanObject(options.innerSpacing) || {};
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
}
