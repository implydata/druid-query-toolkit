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

export function trimString(str: string, maxLength: number): string {
  if (str.length < maxLength) return str;
  return str.substr(0, Math.max(maxLength - 3, 1)) + '...';
}

export function clampIndex(index: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(index)));
}

export function normalizeIndex(index: number, n: number): number {
  return index < 0 ? index + n : index;
}

export function insert<T>(array: readonly T[], index: number, value: T): T[] {
  const n = array.length;
  if (index < 0 || n < index) throw new Error(`insert index out of bounds (${index})`);
  return array.slice(0, index).concat([value], array.slice(index, n));
}

const ESCAPED =
  // eslint-disable-next-line no-control-regex,no-misleading-character-class
  /[\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

export function getEscapedRegExp() {
  ESCAPED.lastIndex = 0; // Reset the search index before every use.
  return ESCAPED;
}

export function needsUnicodeEscape(str: string): boolean {
  return getEscapedRegExp().test(str);
}

export function sqlEscapeUnicode(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(getEscapedRegExp(), a => `\\${('0000' + a.charCodeAt(0).toString(16)).slice(-4)}`);
}
