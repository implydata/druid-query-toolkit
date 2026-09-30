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

import { SqlColumn } from '../sql';

import { C } from './column';

describe('C', () => {
  it('makes a quoted SqlColumn from a name', () => {
    const x = C('channel');
    expect(x).toBeInstanceOf(SqlColumn);
    expect(String(x)).toEqual('"channel"');
  });

  it('quotes names that need it', () => {
    expect(String(C('my thing'))).toEqual('"my thing"');
  });

  it('passes through an existing SqlColumn', () => {
    const x = SqlColumn.optionalQuotes('channel');
    expect(C(x)).toBe(x);
  });

  describe('.optionalQuotes', () => {
    it('only quotes when needed', () => {
      expect(String(C.optionalQuotes('channel'))).toEqual('channel');
      expect(String(C.optionalQuotes('my thing'))).toEqual('"my thing"');
      expect(String(C.optionalQuotes('select'))).toEqual('"select"');
    });

    it('passes through an existing SqlColumn', () => {
      const x = SqlColumn.create('channel');
      expect(C.optionalQuotes(x)).toBe(x);
    });
  });
});
