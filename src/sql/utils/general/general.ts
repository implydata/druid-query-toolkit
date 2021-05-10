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
