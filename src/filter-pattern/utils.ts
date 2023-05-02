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

export function xor(a: unknown, b: unknown): boolean {
  return Boolean(a ? !b : b);
}

export function toggle<T>(xs: readonly T[], x: T, eq?: (a: T, b: T) => boolean): T[] {
  const e = eq || ((a, b) => a === b);
  return xs.find(_ => e(_, x)) ? xs.filter(d => !e(d, x)) : xs.concat([x]);
}
