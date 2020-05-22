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

const RESERVED: string[] = [
  'ALL',
  'ALTER',
  'APPLY',
  'AS',
  'ASC',
  'ATTRIBUTES',
  'BY',
  'CATALOG',
  'CROSS',
  'CUBE',
  'DATABASE',
  'DELETE',
  'DESC',
  'DESCRIBE',
  'DISTINCT',
  'EXCEPT',
  'EXCLUDING',
  'EXPLAIN',
  'EXTEND',
  'FETCH',
  'FIRST',
  'FOLLOWING',
  'FOR',
  'FROM',
  'FULL',
  'GROUP',
  'GROUPING',
  'HAVING',
  'IMPLEMENTATION',
  'INCLUDING',
  'INNER',
  'INSERT',
  'INTERSECT',
  'INTO',
  'JOIN',
  'JSON',
  'LAST',
  'LATERAL',
  'LEFT',
  'LIMIT',
  'MATCHED',
  'MERGE',
  'MINUS',
  'NATURAL',
  'NEXT',
  'NOT',
  'NULL',
  'NULLS',
  'OF',
  'OFFSET',
  'ON',
  'ONLY',
  'ORDER',
  'ORDINALITY',
  'OUTER',
  'PARTITION',
  'PLAN',
  'PRECEDING',
  'RANGE',
  'RESET',
  'RIGHT',
  'ROLLUP',
  'ROW',
  'ROWS',
  'SCHEMA',
  'SELECT',
  'SESSION',
  'SET',
  'SETS',
  'SPECIFIC',
  'STATEMENT',
  'STREAM',
  'SYSTEM',
  'TABLE',
  'THEN',
  'TYPE',
  'UNION',
  'UNNEST',
  'UPDATE',
  'UPSERT',
  'USING',
  'VALUES',
  'WHEN',
  'WHERE',
  'WINDOW',
  'WITH',
  'WITHOUT',
  'XML',
];

const reservedLookup: Record<string, boolean> = {};
for (const r of RESERVED) {
  reservedLookup[r] = true;
}

export abstract class SqlBase {
  static RESERVED = RESERVED;

  static isReserved(keyword: string) {
    return Boolean(reservedLookup[keyword.toUpperCase()]);
  }

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
