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

import { SqlBase, SqlBaseValue, SqlMulti, SqlRef } from '../index';

export interface UnaryExpressionValue extends SqlBaseValue {
  expressionType: string;
  keyword: string;
  argument: SqlBase;
}

export class SqlUnary extends SqlBase {
  static type = 'unaryExpression';

  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  public expressionType: string;
  public keyword: string;
  public argument: SqlBase;

  constructor(options: UnaryExpressionValue) {
    super(options, SqlUnary.type);
    this.expressionType = options.expressionType;
    this.keyword = options.keyword;
    this.argument = options.argument;
  }

  public valueOf(): UnaryExpressionValue {
    const value = super.valueOf() as UnaryExpressionValue;
    value.expressionType = this.expressionType;
    value.keyword = this.keyword;
    value.argument = this.argument;
    return value;
  }

  public toRawString(): string {
    if (!this.argument) {
      throw new Error('Could not make raw string');
    }
    return this.keyword + (this.innerSpacing.postKeyword || '') + this.argument.toString();
  }

  public isType(type: string) {
    return type === this.type && this instanceof SqlUnary;
  }

  public removeColumn(_column: string) {
    const value = this.valueOf();
    // if (value.argument instanceof SqlRef && value.argument.name === column) {
    //   // do nothing
    // }
    // if (value.argument instanceof SqlMulti || value.argument instanceof SqlUnary) {
    //   // value.argument = value.argument.removeColumn(column);
    // }
    return new SqlUnary(value);
  }

  public getSqlRefs(): SqlRef[] {
    if (this.argument instanceof SqlRef) return [this.argument];
    if (this.argument instanceof SqlMulti || this.argument instanceof SqlUnary) {
      return this.argument.getSqlRefs();
    }
    return [];
  }

  public containsColumn(column: string): boolean {
    const value = this.valueOf();
    if (!value.argument) throw Error('expression has no arguments');
    return (
      SqlRef.equalsString(value.argument, column) ||
      (value.argument instanceof SqlMulti && value.argument.containsColumn(column))
    );
  }

  addOrReplaceColumn(column: string, filter: SqlUnary | SqlMulti): SqlUnary | SqlMulti {
    if (this.containsColumn(column)) return filter;
    return this;
  }
}

SqlBase.register(SqlUnary.type, SqlUnary);
