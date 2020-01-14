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

import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlLiteralValue extends SqlBaseValue {
  value: string | number;
  stringValue?: string;
}

export class SqlLiteral extends SqlBase {
  public value: string | number;
  public stringValue?: string;

  constructor(options: SqlLiteralValue) {
    super(options, 'literal');
    this.value = options.value;
    this.stringValue = options.stringValue;
  }

  public toRawString(): string {
    return this.stringValue || String(this.value);
  }
}
SqlBase.register('literal', SqlLiteral);
