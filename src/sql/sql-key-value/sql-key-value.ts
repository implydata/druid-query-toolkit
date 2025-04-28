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

import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import type { LiteralValue } from '../sql-literal/sql-literal';

export interface SqlKeyValueValue extends SqlBaseValue {
  key: SqlExpression;
  value: SqlExpression;
  short?: boolean;
}

export class SqlKeyValue extends SqlExpression {
  static type: SqlTypeDesignator = 'keyValue';

  static DEFAULT_KEY_KEYWORD = 'KEY';
  static DEFAULT_VALUE_KEYWORD = 'VALUE';

  static create(
    key: SqlExpression | LiteralValue,
    value: SqlExpression | LiteralValue,
  ): SqlKeyValue {
    return new SqlKeyValue({
      key: SqlExpression.wrap(key),
      value: SqlExpression.wrap(value),
    });
  }

  static short(
    key: SqlExpression | LiteralValue,
    value: SqlExpression | LiteralValue,
  ): SqlKeyValue {
    return new SqlKeyValue({
      key: SqlExpression.wrap(key),
      value: SqlExpression.wrap(value),
      short: true,
    });
  }

  public readonly key: SqlExpression;
  public readonly value: SqlExpression;
  public readonly short?: boolean;

  constructor(options: SqlKeyValueValue) {
    super(options, SqlKeyValue.type);
    this.key = options.key;
    this.value = options.value;
    this.short = options.short;
  }

  public valueOf() {
    const value = super.valueOf() as SqlKeyValueValue;
    value.key = this.key;
    value.value = this.value;
    value.short = this.short;
    return value;
  }

  protected _toRawString(): string {
    if (this.short) {
      return [
        this.key.toString(),
        this.getSpace('postKeyExpression', ''),
        ':',
        this.getSpace('preValueExpression', ''),
        this.value.toString(),
      ].join('');
    } else {
      return [
        this.getKeyword('key', SqlKeyValue.DEFAULT_KEY_KEYWORD),
        this.getSpace('postKey'),
        this.key.toString(),
        this.getSpace('postKeyExpression'),
        this.getKeyword('value', SqlKeyValue.DEFAULT_VALUE_KEYWORD),
        this.getSpace('preValueExpression'),
        this.value.toString(),
      ].join('');
    }
  }

  public changeKey(key: SqlExpression): this {
    const value = this.valueOf();
    value.key = key;
    return SqlBase.fromValue(value);
  }

  public changeValue(value: SqlExpression): this {
    const val = this.valueOf();
    val.value = value;
    return SqlBase.fromValue(val);
  }

  public changeShort(short: boolean): this {
    if (Boolean(this.short) === short) return this;
    const value = this.valueOf();
    value.spacing = {}; // Reset all spacing
    if (short) {
      value.short = true;
    } else {
      delete value.short;
    }

    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlExpression | undefined {
    let ret = this;

    const key = this.key._walkHelper(nextStack, fn, postorder);
    if (!key) return;
    if (key !== this.key) {
      ret = ret.changeKey(key);
    }

    const value = this.value._walkHelper(nextStack, fn, postorder);
    if (!value) return;
    if (value !== this.value) {
      ret = ret.changeValue(value);
    }

    return ret;
  }
}

SqlBase.register(SqlKeyValue);
