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

import { cleanFunctionArguments } from '../utils';

describe('utils', () => {
  describe('cleanFunctionArguments', () => {
    it('removes trailing undefined values', () => {
      const input = [1, 'test', undefined, undefined];
      const result = cleanFunctionArguments(input);
      expect(result).toEqual([1, 'test']);
    });

    it('converts undefined values in the middle to null', () => {
      const input = [1, undefined, 'test', undefined];
      const result = cleanFunctionArguments(input);
      expect(result).toEqual([1, null, 'test']);
    });

    it('returns an empty array if all values are undefined', () => {
      const input = [undefined, undefined];
      const result = cleanFunctionArguments(input);
      expect(result).toEqual([]);
    });

    it('preserves null values', () => {
      const input = [null, 'test', null];
      const result = cleanFunctionArguments(input);
      expect(result).toEqual([null, 'test', null]);
    });
  });
});
