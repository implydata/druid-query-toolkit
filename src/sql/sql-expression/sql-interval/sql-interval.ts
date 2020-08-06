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

import { SqlLiteral } from '..';
import { SqlBase, SqlBaseValue, SqlType } from '../../sql-base';
import { SqlExpression } from '../sql-expression';

export interface SqlIntervalValue extends SqlBaseValue {
  keyword?: string;
  intervalValue?: SqlLiteral;
  unitKeyword?: string;
}

export class SqlInterval extends SqlExpression {
  static type: SqlType = 'interval';

  static DEFAULT_INTERVAL_KEYWORD = 'INTERVAL';

  static create(unit: string, intervalValue: number) {
    return new SqlInterval({
      intervalValue: SqlLiteral.create(String(intervalValue)),
      unitKeyword: unit,
    });
  }

  public readonly keyword?: string;
  public readonly intervalValue?: SqlLiteral;
  public readonly unitKeyword?: string;

  constructor(options: SqlIntervalValue) {
    super(options, SqlInterval.type);
    this.keyword = options.keyword;
    this.intervalValue = options.intervalValue;
    this.unitKeyword = options.unitKeyword;
  }

  public valueOf(): SqlIntervalValue {
    const value = super.valueOf() as SqlIntervalValue;
    value.keyword = this.keyword;
    value.intervalValue = this.intervalValue;
    value.unitKeyword = this.unitKeyword;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.keyword || SqlInterval.DEFAULT_INTERVAL_KEYWORD,
      this.getInnerSpace('postIntervalKeyword'),
      this.intervalValue,
      this.getInnerSpace('postIntervalValue'),
      this.unitKeyword,
    ].join('');
  }

  public changeKeyword(keyword: string | undefined): this {
    const value = this.valueOf();
    value.keyword = keyword;
    return SqlBase.fromValue(value);
  }

  public clearStaticKeywords(): this {
    const value = this.valueOf();
    delete value.keyword;
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlInterval.type, SqlInterval);
