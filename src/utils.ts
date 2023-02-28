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

export function cleanObject(obj: Record<string, any>): Record<string, string> {
  const cleanObj: Record<string, string> = {};
  for (const k in obj) {
    const v = obj[k];
    if (typeof v === 'string') cleanObj[k] = v;
  }
  return cleanObj;
}

export function filterMap<T, Q>(xs: readonly T[], f: (x: T, i: number) => Q | undefined): Q[] {
  return xs.map(f).filter((x: Q | undefined) => typeof x !== 'undefined') as Q[];
}

export function dedupe<T>(array: readonly T[], keyFn: (x: T) => string = String): T[] {
  const seen: Map<any, boolean> = new Map();
  const deduped: T[] = [];
  array.forEach(d => {
    const key = keyFn(d);
    if (seen.has(key)) return;
    seen.set(key, true);
    deduped.push(d);
  });
  return deduped;
}

export function isEmptyArray(x: unknown): x is Array<unknown> {
  return Array.isArray(x) && !x.length;
}

export function compact<T>(xs: (T | undefined | false | null | '')[]): T[] {
  return xs.filter(Boolean) as T[];
}

// To be used as a tag
export function sane(_x: TemplateStringsArray) {
  // eslint-disable-next-line prefer-rest-params,prefer-spread
  const str = String.raw.apply(String, arguments as any);

  const match = /^\n( *)/m.exec(str);
  if (!match) throw new Error('sane string must start with a \\n is:' + str);
  const spaces = match[1]!.length;

  let lines = str.split('\n');
  lines.shift(); // Remove the first empty lines
  lines = lines.map(line => line.substr(spaces)); // Remove indentation
  if (lines[lines.length - 1] === '') lines.pop(); // Remove last line if empty

  return lines
    .join('\n')
    .replace(/\\`/g, '`') // Fix \` that should be `
    .replace(/\\\{/g, '{') // Fix \{ that should be {
    .replace(/\\\\/g, '\\'); // Fix \\ that should be \
}
