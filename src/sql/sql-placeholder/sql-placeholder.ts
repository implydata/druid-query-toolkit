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

import { SqlBase, SqlBaseValue, SqlType } from '../sql-base';
import { SqlExpression } from '../sql-expression';

export interface SqlPlaceholderValue extends SqlBaseValue {
  customPlaceholder?: string;
}

export class SqlPlaceholder extends SqlExpression {
  static type: SqlType = 'placeholder';

  static PLACEHOLDER: SqlPlaceholder;

  public readonly customPlaceholder?: string;

  constructor(options: SqlPlaceholderValue = {}) {
    super(options, SqlPlaceholder.type);
    this.customPlaceholder = options.customPlaceholder;
  }

  public valueOf(): SqlPlaceholderValue {
    const value = super.valueOf() as SqlPlaceholderValue;
    value.customPlaceholder = this.customPlaceholder;
    return value;
  }

  protected _toRawString(): string {
    return this.customPlaceholder || '?';
  }

  public changeCustomPlaceholder(customPlaceholder: string | undefined): SqlPlaceholder {
    const value = this.valueOf();
    value.customPlaceholder = customPlaceholder;
    return new SqlPlaceholder(value);
  }
}

SqlBase.register(SqlPlaceholder);

SqlPlaceholder.PLACEHOLDER = new SqlPlaceholder();
