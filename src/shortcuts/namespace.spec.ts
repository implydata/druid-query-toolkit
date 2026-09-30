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

import { SqlNamespace } from '../sql';

import { N } from './namespace';

describe('N', () => {
  it('makes a quoted SqlNamespace from a name', () => {
    const x = N('druid');
    expect(x).toBeInstanceOf(SqlNamespace);
    expect(String(x)).toEqual('"druid"');
  });

  it('quotes names that need it', () => {
    expect(String(N('my thing'))).toEqual('"my thing"');
  });

  it('passes through an existing SqlNamespace', () => {
    const x = SqlNamespace.optionalQuotes('druid');
    expect(N(x)).toBe(x);
  });

  describe('.optionalQuotes', () => {
    it('only quotes when needed', () => {
      expect(String(N.optionalQuotes('druid'))).toEqual('druid');
      expect(String(N.optionalQuotes('my thing'))).toEqual('"my thing"');
      expect(String(N.optionalQuotes('select'))).toEqual('"select"');
    });

    it('passes through an existing SqlNamespace', () => {
      const x = SqlNamespace.create('druid');
      expect(N.optionalQuotes(x)).toBe(x);
    });
  });
});
