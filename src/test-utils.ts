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

import { parse as parseSql } from './sql/parser';

export function backAndForth(sql: string, expectedConstructor?: any): void {
  const parsed = parseSql(sql);

  if (expectedConstructor && !(parsed instanceof expectedConstructor)) {
    throw new Error(`${sql} did not parse to the right class`);
  }

  expect(parsed.toString()).toEqual(sql);
}

export function backAndForthPrettify(sql: string, expectedConstructor?: any): void {
  const parsed = parseSql(sql);

  if (expectedConstructor && !(parsed instanceof expectedConstructor)) {
    throw new Error(`${sql} did not parse to the right class`);
  }

  expect(parsed.prettify().toString()).toEqual(sql);
}

export function mapString(xs: any[]): string[] {
  return xs.map(String);
}
