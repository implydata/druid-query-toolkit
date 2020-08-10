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
import { SqlExpression } from '..';
import { SqlBase, SqlBaseValue, SqlType, Substitutor } from '../../sql-base';

export interface SqlBetweenAndUnitValue extends SqlBaseValue {
  symmetricKeyword?: string;
  start: SqlExpression;
  andKeyword?: string;
  end: SqlExpression;
}

export class SqlBetweenAndUnit extends SqlBase {
  static type: SqlType = 'betweenAndUnit';

  static DEFAULT_SYMMETRIC_KEYWORD = 'SYMMETRIC';
  static DEFAULT_AND_KEYWORD = 'AND';

  static create(start: SqlExpression, end: SqlExpression): SqlBetweenAndUnit {
    return new SqlBetweenAndUnit({
      start,
      end,
    });
  }

  static symmetric(start: SqlExpression, end: SqlExpression): SqlBetweenAndUnit {
    return new SqlBetweenAndUnit({
      symmetricKeyword: SqlBetweenAndUnit.DEFAULT_SYMMETRIC_KEYWORD,
      start,
      end,
    });
  }

  public readonly symmetricKeyword?: string;
  public readonly start: SqlExpression;
  public readonly andKeyword?: string;
  public readonly end: SqlExpression;

  constructor(options: SqlBetweenAndUnitValue) {
    super(options, SqlBetweenAndUnit.type);
    this.symmetricKeyword = options.symmetricKeyword;
    this.start = options.start;
    this.andKeyword = options.andKeyword;
    this.end = options.end;
  }

  public valueOf(): SqlBetweenAndUnitValue {
    const value = super.valueOf() as SqlBetweenAndUnitValue;
    value.symmetricKeyword = this.symmetricKeyword;
    value.start = this.start;
    value.andKeyword = this.andKeyword;
    value.end = this.end;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [];

    if (this.symmetricKeyword) {
      rawParts.push(this.symmetricKeyword, this.getInnerSpace('postSymmetric'));
    }

    rawParts.push(
      this.start.toString(),
      this.getInnerSpace('preAnd'),
      this.andKeyword || SqlBetweenAndUnit.DEFAULT_AND_KEYWORD,
      this.getInnerSpace('postAnd'),
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

  public clearStaticKeywords(): this {
    const value = this.valueOf();
    delete value.andKeyword;
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlBetweenAndUnit);
