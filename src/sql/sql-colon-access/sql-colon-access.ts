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

import { RefName } from '../helpers';
import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import { SqlLiteral } from '../sql-literal/sql-literal';

const SIMPLE_JSON_PATH_NAME = /^[a-z_]\w*$/i;

// The types that parse as a term (the grammar's BaseType) without needing parens
const TERM_TYPES: readonly SqlTypeDesignator[] = [
  'placeholder',
  'interval',
  'case',
  'function',
  'values',
  'tableQuery',
  'literal',
  'column',
  'record',
];

/**
 * A name segment: `a` or `"a b"`. `preDot` and `postDot` are the spaces around the `.` that
 * precedes it, and are not used on the first segment (which follows the colon).
 */
export interface SqlColonAccessNameSegment {
  readonly name: RefName;
  readonly preDot?: string;
  readonly postDot?: string;
}

/**
 * A bracket segment: `['a b']` or `[0]`. `preBracket` is the space before the `[`, and is not
 * used on the first segment (which follows the colon).
 */
export interface SqlColonAccessBracketSegment {
  readonly value: SqlLiteral;
  readonly preBracket?: string;
  readonly postLeftBracket?: string;
  readonly preRightBracket?: string;
}

export type SqlColonAccessSegment = SqlColonAccessNameSegment | SqlColonAccessBracketSegment;

export type SqlColonAccessPathElement = string | number;

function isNameSegment(segment: SqlColonAccessSegment): segment is SqlColonAccessNameSegment {
  return 'name' in segment;
}

function pathElementToSegment(element: SqlColonAccessPathElement): SqlColonAccessSegment {
  if (typeof element === 'number') {
    if (!Number.isInteger(element) || element < 0) {
      throw new Error(`invalid index in colon access path: ${element}`);
    }
    return { value: SqlLiteral.create(element) };
  }

  if (RefName.needsQuotes(element)) {
    return { value: SqlLiteral.create(element) };
  } else {
    return { name: RefName.create(element, false) };
  }
}

function segmentToString(segment: SqlColonAccessSegment, first: boolean): string {
  if (isNameSegment(segment)) {
    const name = segment.name.toString();
    return first ? name : `${segment.preDot ?? ''}.${segment.postDot ?? ''}${name}`;
  } else {
    return [
      first ? '' : (segment.preBracket ?? ''),
      '[',
      segment.postLeftBracket ?? '',
      segment.value.toString(),
      segment.preRightBracket ?? '',
      ']',
    ].join('');
  }
}

export interface SqlColonAccessValue extends SqlBaseValue {
  base: SqlExpression;
  segments: readonly SqlColonAccessSegment[];
}

/**
 * Colon access, reading a nested field out of a value: `v:a.b['c d'][0]`
 */
export class SqlColonAccess extends SqlExpression {
  static type: SqlTypeDesignator = 'colonAccess';

  static create(base: SqlExpression, path: readonly SqlColonAccessPathElement[]): SqlColonAccess {
    return new SqlColonAccess({
      base: SqlColonAccess.ensureTerm(base),
      segments: SqlColonAccess.pathToSegments(path),
    });
  }

  /**
   * Adds parens to the expression unless it can stand bare before a colon (or around a `||` in a
   * short key-value key)
   */
  static ensureTerm(ex: SqlExpression): SqlExpression {
    return ex.hasParens() || TERM_TYPES.includes(ex.type) ? ex : ex.ensureParens();
  }

  static pathToSegments(path: readonly SqlColonAccessPathElement[]): SqlColonAccessSegment[] {
    if (!path.length) throw new Error('colon access path must have at least one element');
    return path.map(pathElementToSegment);
  }

  public readonly base: SqlExpression;
  public readonly segments: readonly SqlColonAccessSegment[];

  constructor(options: SqlColonAccessValue) {
    super(options, SqlColonAccess.type);
    this.base = options.base;
    this.segments = options.segments;
  }

  public valueOf() {
    const value = super.valueOf() as SqlColonAccessValue;
    value.base = this.base;
    value.segments = this.segments;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.base.toString(),
      this.getSpace('preColon', ''),
      ':',
      this.getSpace('postColon', ''),
      this.segments.map((segment, i) => segmentToString(segment, i === 0)).join(''),
    ].join('');
  }

  public changeBase(base: SqlExpression): this {
    const value = this.valueOf();
    value.base = base;
    return SqlBase.fromValue(value);
  }

  public changeSegments(segments: readonly SqlColonAccessSegment[]): this {
    if (!segments.length) throw new Error('colon access must have at least one segment');
    const value = this.valueOf();
    value.segments = segments;
    return SqlBase.fromValue(value);
  }

  public changePath(path: readonly SqlColonAccessPathElement[]): this {
    return this.changeSegments(SqlColonAccess.pathToSegments(path));
  }

  /**
   * The path as plain values: names and bracketed strings become strings, indexes become numbers
   */
  public getPath(): SqlColonAccessPathElement[] {
    return this.segments.map(segment => {
      if (isNameSegment(segment)) return segment.name.name;
      const { value } = segment.value;
      return typeof value === 'number' || typeof value === 'bigint' ? Number(value) : String(value);
    });
  }

  /**
   * The JSON path (as taken by JSON_VALUE) that matches this path, like `$.a['b c'][0]`
   */
  public getJsonPath(): string {
    return (
      '$' +
      this.getPath()
        .map(element => {
          if (typeof element === 'number') return `[${element}]`;
          if (SIMPLE_JSON_PATH_NAME.test(element)) return `.${element}`;
          if (element.includes("'")) {
            throw new Error(`can not make a JSON path for a name containing a quote: ${element}`);
          }
          return `['${element}']`;
        })
        .join('')
    );
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const base = this.base._walkHelper(nextStack, fn, postorder);
    if (!base) return;
    if (base !== this.base) {
      ret = ret.changeBase(base);
    }

    return ret;
  }
}

SqlBase.register(SqlColonAccess);
