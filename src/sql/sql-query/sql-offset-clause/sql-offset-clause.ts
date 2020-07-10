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

import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SqlLiteral } from '../../sql-expression';

export interface SqlOffsetClauseValue extends SqlBaseValue {
  keyword?: string;
  offset: SqlLiteral;
}

export class SqlOffsetClause extends SqlBase {
  static type = 'offsetClause';

  static DEFAULT_KEYWORD = 'OFFSET';

  static create(offset: SqlLiteral | number): SqlOffsetClause {
    return new SqlOffsetClause({
      offset: SqlLiteral.create(offset),
    });
  }

  public readonly keyword?: string;
  public readonly offset: SqlLiteral;

  constructor(options: SqlOffsetClauseValue) {
    super(options, SqlOffsetClause.type);
    this.keyword = options.keyword;
    this.offset = options.offset;
  }

  public valueOf(): SqlOffsetClauseValue {
    const value = super.valueOf() as SqlOffsetClauseValue;
    value.keyword = this.keyword;
    value.offset = this.offset;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.keyword || SqlOffsetClause.DEFAULT_KEYWORD,
      this.getInnerSpace('postKeyword'),
    ];

    rawParts.push(this.offset.toString());

    return rawParts.join('');
  }

  public changeKeyword(keyword: string | undefined): this {
    const value = this.valueOf();
    value.keyword = keyword;
    return SqlBase.fromValue(value);
  }

  public changeOffset(offset: SqlLiteral | number): this {
    const value = this.valueOf();
    value.offset = SqlLiteral.create(offset);
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const offset = this.offset._walkHelper(nextStack, fn, postorder);
    if (!offset) return;
    if (offset !== this.offset) {
      ret = ret.changeOffset(offset as SqlLiteral);
    }

    return ret;
  }

  public clearStaticKeywords(): this {
    const value = this.valueOf();
    delete value.keyword;
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlOffsetClause.type, SqlOffsetClause);
