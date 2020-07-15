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
