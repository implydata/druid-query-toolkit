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

import { C } from '.';
import { sql } from './template';

describe('sql', () => {
  it('works in basic case', () => {
    expect(String(sql`SELECT * FROM tbl`)).toEqual(`SELECT * FROM tbl`);
  });

  it('works in complex case', () => {
    const column = 'some_column';
    const tbl = 'this is a "table" and I like it';
    const v1 = 'foo';
    const v2 = 'bar';
    expect(
      String(sql`SELECT * FROM "${tbl}" WHERE ${C(column)} = ${5} AND "x" IN (${v1}, '${v2}')`),
    ).toEqual(
      `SELECT * FROM "this is a ""table"" and I like it" WHERE "some_column" = 5 AND "x" IN ('foo', 'bar')`,
    );
  });

  it('wrapping in single quotes forces a literal string', () => {
    const c = C('blah');
    expect(String(sql`SELECT * FROM tbl WHERE x = '${c}'`)).toEqual(
      `SELECT * FROM tbl WHERE x = '"blah"'`,
    );
  });

  it('throws on uneven double quote wrapping (start)', () => {
    const c = C('blah');
    expect(() => sql`SELECT * FROM tbl WHERE "${c} = 5`).toThrow(
      'the expression `"blah"` is not evenly wrapped in double quotes',
    );
  });

  it('throws on uneven double quote wrapping (end)', () => {
    const c = C('blah');
    expect(() => sql`SELECT * FROM tbl WHERE ${c}" = 5`).toThrow(
      'the expression `"blah"` is not evenly wrapped in double quotes',
    );
  });

  it('throws on uneven single quote wrapping (start)', () => {
    const v = 'blah';
    expect(() => sql`SELECT * FROM tbl WHERE col = '${v}`).toThrow(
      'the literal `blah` is not evenly wrapped in single quotes',
    );
  });

  it('throws on uneven single quote wrapping (end)', () => {
    const v = 'blah';
    expect(() => sql`SELECT * FROM tbl WHERE col = ${v}'`).toThrow(
      'the literal `blah` is not evenly wrapped in single quotes',
    );
  });
});
