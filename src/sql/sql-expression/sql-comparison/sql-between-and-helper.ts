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

import { SqlBase, SqlBaseValue, SqlExpression, SqlType, Substitutor } from '../..';

export interface SqlBetweenAndHelperValue extends SqlBaseValue {
  symmetric?: boolean;
  start: SqlExpression;
  end: SqlExpression;
}

export class SqlBetweenAndHelper extends SqlBase {
  static type: SqlType = 'betweenAndHelper';

  static DEFAULT_SYMMETRIC_KEYWORD = 'SYMMETRIC';
  static DEFAULT_AND_KEYWORD = 'AND';

  static create(start: SqlExpression, end: SqlExpression): SqlBetweenAndHelper {
    return new SqlBetweenAndHelper({
      start,
      end,
    });
  }

  static symmetric(start: SqlExpression, end: SqlExpression): SqlBetweenAndHelper {
    return new SqlBetweenAndHelper({
      symmetric: true,
      start,
      end,
    });
  }

  public readonly symmetric?: boolean;
  public readonly start: SqlExpression;
  public readonly end: SqlExpression;

  constructor(options: SqlBetweenAndHelperValue) {
    super(options, SqlBetweenAndHelper.type);
    this.symmetric = options.symmetric;
    this.start = options.start;
    this.end = options.end;
  }

  public valueOf(): SqlBetweenAndHelperValue {
    const value = super.valueOf() as SqlBetweenAndHelperValue;
    if (this.symmetric) value.symmetric = true;
    value.start = this.start;
    value.end = this.end;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [];

    if (this.symmetric) {
      rawParts.push(
        this.getKeyword('symmetric', SqlBetweenAndHelper.DEFAULT_SYMMETRIC_KEYWORD),
        this.getSpace('postSymmetric'),
      );
    }

    rawParts.push(
      this.start.toString(),
      this.getSpace('preAnd'),
      this.getKeyword('and', SqlBetweenAndHelper.DEFAULT_AND_KEYWORD),
      this.getSpace('postAnd'),
      this.end.toString(),
    );

    return rawParts.join('');
  }

  public changeStart(start: SqlExpression): this {
    const value = this.valueOf();
    value.start = start;
    return SqlBase.fromValue(value);
  }

  public changeEnd(end: SqlExpression): this {
    const value = this.valueOf();
    value.end = end;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const start = ret.start._walkHelper(nextStack, fn, postorder);
    if (!start) return;
    if (start !== ret.start) {
      ret = ret.changeStart(start);
    }

    const end = ret.end._walkHelper(nextStack, fn, postorder);
    if (!end) return;
    if (end !== ret.end) {
      ret = ret.changeEnd(end);
    }

    return ret;
  }
}

SqlBase.register(SqlBetweenAndHelper);
