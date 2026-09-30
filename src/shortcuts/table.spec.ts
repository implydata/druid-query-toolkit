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

import { SqlTable } from '../sql';

import { T } from './table';

describe('T', () => {
  it('makes a quoted SqlTable from a name', () => {
    const x = T('wikipedia');
    expect(x).toBeInstanceOf(SqlTable);
    expect(String(x)).toEqual('"wikipedia"');
  });

  it('quotes names that need it', () => {
    expect(String(T('my thing'))).toEqual('"my thing"');
  });

  it('passes through an existing SqlTable', () => {
    const x = SqlTable.optionalQuotes('wikipedia');
    expect(T(x)).toBe(x);
  });

  describe('.optionalQuotes', () => {
    it('only quotes when needed', () => {
      expect(String(T.optionalQuotes('wikipedia'))).toEqual('wikipedia');
      expect(String(T.optionalQuotes('my thing'))).toEqual('"my thing"');
      expect(String(T.optionalQuotes('select'))).toEqual('"select"');
    });

    it('passes through an existing SqlTable', () => {
      const x = SqlTable.create('wikipedia');
      expect(T.optionalQuotes(x)).toBe(x);
    });
  });
});
