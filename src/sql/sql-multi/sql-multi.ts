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

import { Separator } from '../index';
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlMultiValue extends SqlBaseValue {
  expressionType?: string;
  separators?: Separator[];
  arguments?: SqlBase[];
}

export class SqlMulti extends SqlBase {
  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  public expressionType?: string;
  public separators?: Separator[];
  public arguments?: SqlBase[];

  constructor(options: SqlMultiValue) {
    super(options, 'multi');
    this.arguments = options.arguments;
    this.separators = options.separators;
    this.expressionType = options.expressionType;
  }

  public valueOf() {
    const value: SqlMultiValue = super.valueOf();
    value.expressionType = this.expressionType;
    value.separators = this.separators;
    value.arguments = this.arguments;
    return value;
  }

  public toRawString(): string {
    if (!this.separators || !this.arguments) {
      throw new Error('Invalid options');
    }
    return Separator.spacilator(this.arguments, this.separators);
  }
}

SqlBase.register('multi', SqlMulti);
