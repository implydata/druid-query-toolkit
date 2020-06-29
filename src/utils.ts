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

export function shallowCopy(v: any): any {
  return Array.isArray(v) ? v.slice() : Object.assign({}, v);
}

export function isEmpty(v: any): boolean {
  return !(Array.isArray(v) ? v.length : Object.keys(v).length);
}

export function parsePath(path: string): string[] {
  const parts: string[] = [];
  let rest = path;
  while (rest) {
    const escapedMatch = rest.match(/^\{([^{}]*)\}(?:\.(.*))?$/);
    if (escapedMatch) {
      parts.push(escapedMatch[1]);
      rest = escapedMatch[2];
      continue;
    }

    const normalMatch = rest.match(/^([^.]*)(?:\.(.*))?$/);
    if (normalMatch) {
      parts.push(normalMatch[1]);
      rest = normalMatch[2];
      continue;
    }

    throw new Error(`Could not parse path ${path}`);
  }

  return parts;
}

export function deepGet<T extends Record<string, any>>(value: T, path: string): any {
  const parts = parsePath(path);
  for (const part of parts) {
    value = (value || {})[part];
  }
  return value;
}

export function filterMap<T, Q>(xs: readonly T[], f: (x: T, i: number) => Q | undefined): Q[] {
  return xs.map(f).filter((x: Q | undefined) => typeof x !== 'undefined') as Q[];
}

export function dedupe<T>(array: T[], keyFn: (x: T) => string = String): T[] {
  const seen: Record<any, boolean> = {};
  const deduped: T[] = [];
  array.forEach(d => {
    const key = keyFn(d);
    if (seen[key]) return;
    seen[key] = true;
    deduped.push(d);
  });
  return deduped;
}
