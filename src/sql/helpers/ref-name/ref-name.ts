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

import { ALLOWED_FUNCTIONS } from '../../allowed-functions';
import { RESERVED_ALIASES, RESERVED_KEYWORDS } from '../../reserved-keywords';
import { needsUnicodeEscape, sqlEscapeUnicode, trimString } from '../general/general';

const VALID_NAKED_NAME_REGEXP = /^[a-z_]\w*$/i;

const reservedKeywordLookup: Record<string, boolean> = {};
for (const r of RESERVED_KEYWORDS) {
  reservedKeywordLookup[r] = true;
}

const reservedAliasLookup: Record<string, boolean> = {};
for (const r of RESERVED_ALIASES) {
  reservedAliasLookup[r] = true;
}

const allowedFunctionLookup: Record<string, boolean> = {};
for (const r of ALLOWED_FUNCTIONS) {
  allowedFunctionLookup[r] = true;
}

export interface RefNameValue {
  name: string;
  quotes: boolean;
}

export class RefName {
  static RESERVED_KEYWORDS = RESERVED_KEYWORDS;
  static RESERVED_ALIASES = RESERVED_ALIASES;
  static ALLOWED_FUNCTIONS = ALLOWED_FUNCTIONS;

  static isReservedKeyword(k: string) {
    return Boolean(reservedKeywordLookup[k.toUpperCase()]);
  }

  static isReservedAlias(k: string) {
    return RefName.isReservedKeyword(k) || Boolean(reservedAliasLookup[k.toUpperCase()]);
  }

  static isReservedFunctionName(k: string) {
    return RefName.isReservedKeyword(k) && !allowedFunctionLookup[k.toUpperCase()];
  }

  static needsQuotes(name: string): boolean {
    return !VALID_NAKED_NAME_REGEXP.test(name) || RefName.isReservedKeyword(name);
  }

  static needsQuotesAlias(name: string): boolean {
    return !VALID_NAKED_NAME_REGEXP.test(name) || RefName.isReservedAlias(name);
  }

  static needsQuotesFunctionName(name: string): boolean {
    return !VALID_NAKED_NAME_REGEXP.test(name) || RefName.isReservedFunctionName(name);
  }

  static maybe(name: string | undefined, forceQuotes = true): RefName | undefined {
    if (!name) return;
    return RefName.create(name, forceQuotes);
  }

  static create(name: string | RefName, forceQuotes = true): RefName {
    if (name instanceof RefName) return name;
    return new RefName({ name, quotes: forceQuotes || RefName.needsQuotes(name) });
  }

  static alias(name: string | RefName, forceQuotes = true): RefName {
    if (name instanceof RefName) return name;
    return new RefName({ name, quotes: forceQuotes || RefName.needsQuotesAlias(name) });
  }

  static functionName(name: string | RefName, forceQuotes = false): RefName {
    if (name instanceof RefName) return name;
    return new RefName({ name, quotes: forceQuotes || RefName.needsQuotesFunctionName(name) });
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

    const quoteEscapedName = name.replace(/"/g, '""');
    if (needsUnicodeEscape(quoteEscapedName)) {
      return `U&"${sqlEscapeUnicode(quoteEscapedName)}"`;
    } else {
      return `"${quoteEscapedName}"`;
    }
  }

  public changeName(name: string): RefName {
    return RefName.create(name, this.quotes);
  }

  public changeNameAsAlias(name: string): RefName {
    return RefName.alias(name, this.quotes);
  }

  public changeNameAsFunctionName(name: string): RefName {
    return RefName.functionName(name, this.quotes);
  }

  public prettyTrim(maxLength: number): RefName {
    return this.changeName(trimString(this.name, maxLength));
  }
}
