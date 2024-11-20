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

import type { SqlBaseValue, SqlTypeDesignator } from '../sql-base';
import { SqlBase } from '../sql-base';
import { SqlExpression } from '../sql-expression';
import { SqlLiteral } from '../sql-literal/sql-literal';

export interface SqlIntervalValue extends SqlBaseValue {
  intervalValue?: SqlLiteral;
  unit?: string;
}

export class SqlInterval extends SqlExpression {
  static type: SqlTypeDesignator = 'interval';

  static DEFAULT_INTERVAL_KEYWORD = 'INTERVAL';

  static create(unit: string, intervalValue: number) {
    return new SqlInterval({
      intervalValue: SqlLiteral.create(String(intervalValue)),
      unit,
    });
  }

  public readonly intervalValue?: SqlLiteral;
  public readonly unit?: string;

  constructor(options: SqlIntervalValue) {
    super(options, SqlInterval.type);
    this.intervalValue = options.intervalValue;
    this.unit = options.unit;
  }

  public valueOf(): SqlIntervalValue {
    const value = super.valueOf() as SqlIntervalValue;
    value.intervalValue = this.intervalValue;
    value.unit = this.unit;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('interval', SqlInterval.DEFAULT_INTERVAL_KEYWORD),
      this.getSpace('postInterval'),
      this.intervalValue,
      this.getSpace('postIntervalValue'),
      this.unit,
    ].join('');
  }
}

SqlBase.register(SqlInterval);
