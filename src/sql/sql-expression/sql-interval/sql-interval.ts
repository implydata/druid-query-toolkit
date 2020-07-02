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
import { SqlBase, SqlBaseValue } from '../../sql-base';
import { SqlExpression } from '../sql-expression';

export interface SqlIntervalValue extends SqlBaseValue {
  intervalKeyword: string;
  intervalValue?: SqlLiteral;
  unitKeyword?: string;
}

export class SqlInterval extends SqlExpression {
  static type = 'interval';

  static factory(unit: string, intervalValue: number) {
    return new SqlInterval({
      intervalKeyword: 'INTERVAL',
      intervalValue: SqlLiteral.factory(String(intervalValue)),
      unitKeyword: unit,
    });
  }

  public readonly intervalKeyword: string;
  public readonly intervalValue?: SqlLiteral;
  public readonly unitKeyword?: string;

  constructor(options: SqlIntervalValue) {
    super(options, SqlInterval.type);
    this.intervalKeyword = options.intervalKeyword;
    this.intervalValue = options.intervalValue;
    this.unitKeyword = options.unitKeyword;
  }

  public valueOf(): SqlIntervalValue {
    const value = super.valueOf() as SqlIntervalValue;
    value.intervalKeyword = this.intervalKeyword;
    value.intervalValue = this.intervalValue;
    value.unitKeyword = this.unitKeyword;
    return value;
  }

  protected toRawString(): string {
    return (
      this.intervalKeyword +
      this.getInnerSpace('postIntervalKeyword') +
      this.intervalValue +
      this.getInnerSpace('postIntervalValue') +
      this.unitKeyword
    );
  }
}

SqlBase.register(SqlInterval.type, SqlInterval);
