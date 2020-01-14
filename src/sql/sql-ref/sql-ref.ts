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

export interface SqlRefValue extends SqlBaseValue {
  name: string;
  quotes: string;
  namespace: string;
  namespaceQuotes: string;
}

export class SqlRef extends SqlBase {
  static wrapInQuotes(thing: string, quote: string): string {
    return `${quote}${thing}${quote}`;
  }

  public name: string;
  public quotes: string;
  public namespace?: string;
  public namespaceQuotes?: string;

  constructor(options: SqlRefValue) {
    super(options, 'ref');
    this.name = options.name;
    this.quotes = options.quotes;
    this.namespace = options.namespace;
    this.namespaceQuotes = options.namespaceQuotes;
  }

  public toRawString(): string {
    let str = SqlRef.wrapInQuotes(this.name, this.quotes);
    if (this.namespace) {
      str = [
        SqlRef.wrapInQuotes(this.namespace, this.namespaceQuotes || ''),
        this.getInnerSpace('preDot'),
        '.',
        this.getInnerSpace('postDot'),
        str,
      ].join('');
    }
    return str;
  }
}
SqlBase.register('ref', SqlRef);
