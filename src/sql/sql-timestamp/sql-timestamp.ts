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
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlTimestampValue extends SqlBaseValue {
  timestampKeyword?: string;
  timestampValue?: SqlLiteral;
}

export class SqlTimestamp extends SqlBase {
  public timestampKeyword?: string;
  public timestampValue?: SqlLiteral;

  static type = 'timestamp';

  static sqlTimestampFactory(timestamp: string) {
    return new SqlTimestamp({
      type: 'timestamp',
      timestampValue: SqlLiteral.fromInput(timestamp),
      timestampKeyword: 'TIMESTAMP',
      innerSpacing: { postTimestampKeyword: ' ' },
    } as SqlTimestampValue);
  }

  constructor(options: SqlTimestampValue) {
    super(options, SqlTimestamp.type);
    this.timestampKeyword = options.timestampKeyword;
    this.timestampValue = options.timestampValue;
  }

  public valueOf() {
    const value: SqlTimestampValue = super.valueOf();
    value.timestampKeyword = this.timestampKeyword;
    value.timestampValue = this.timestampValue;
    return value;
  }

  public toRawString(): string {
    const rawString =
      this.timestampKeyword + this.innerSpacing.postTimestampKeyword + this.timestampValue;
    return rawString;
  }
}

SqlBase.register(SqlTimestamp.type, SqlTimestamp);
