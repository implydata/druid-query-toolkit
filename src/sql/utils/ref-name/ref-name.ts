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

import { RESERVED_KEYWORDS } from '../../reserved-keywords';
import { trimString } from '../general/general';

const reservedKeywordLookup: Record<string, boolean> = {};
for (const r of RESERVED_KEYWORDS) {
  reservedKeywordLookup[r] = true;
}

export interface RefNameValue {
  name: string;
  quotes: boolean;
}

export class RefName {
  static RESERVED_KEYWORDS = RESERVED_KEYWORDS;

  static isReservedKeyword(keyword: string) {
    return Boolean(reservedKeywordLookup[keyword.toUpperCase()]);
  }

  static needsQuotes(name: string | undefined): boolean {
    if (typeof name === 'undefined') return false;
    return !/^\w+$/.test(name) || RefName.isReservedKeyword(name);
  }

  static maybe(name: string | undefined, forceQuotes?: boolean): RefName | undefined {
    if (!name) return;
    return RefName.create(name, forceQuotes);
  }

  static create(name: string, forceQuotes?: boolean): RefName {
    return new RefName({ name, quotes: forceQuotes || RefName.needsQuotes(name) });
  }

  public readonly name: string;
  public readonly quotes: boolean;

  constructor(options: RefNameValue) {
    this.name = options.name;
    this.quotes = options.quotes;
  }

  public valueOf(): RefNameValue {
    return {
      name: this.name,
      quotes: this.quotes,
    };
  }

  public toString(): string {
    const { name, quotes } = this;
    if (!quotes) return name;
    return `"${name.replace(/"/g, '""')}"`;
  }

  public changeName(name: string): RefName {
    return RefName.create(name, this.quotes);
  }

  public prettyTrim(maxLength: number): RefName {
    return this.changeName(trimString(this.name, maxLength));
  }
}
