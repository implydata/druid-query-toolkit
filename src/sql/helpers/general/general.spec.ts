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

import { clampIndex, insert, normalizeIndex, trimString } from './general';

describe('general', () => {
  describe('trimString', () => {
    it('works in basic case', () => {
      expect(trimString(`abcd`, 10)).toEqual(`abcd`);
      expect(trimString(`abcd_efgh_ijkl_mnop_qrst_uvwx_yz`, 10)).toEqual(`abcd_ef...`);
      expect(trimString(`abcd_efgh_ijkl_mnop_qrst_uvwx_yz`, 1)).toEqual(`a...`);
    });
  });

  describe('clampIndex', () => {
    it('works', () => {
      expect(clampIndex(-10, 0, 5)).toEqual(0);
      expect(clampIndex(2, 0, 5)).toEqual(2);
      expect(clampIndex(2.5, 0, 5)).toEqual(2);
      expect(clampIndex(7, 0, 5)).toEqual(5);
    });
  });

  describe('normalizeIndex', () => {
    it('works', () => {
      expect(normalizeIndex(1, 10)).toEqual(1);
      expect(normalizeIndex(-1, 10)).toEqual(9);
      expect(normalizeIndex(-100, 10)).toEqual(-90);
    });
  });

  describe('insert', () => {
    it('works', () => {
      expect(insert(['a', 'b', 'c'], 0, 'x')).toEqual(['x', 'a', 'b', 'c']);
      expect(insert(['a', 'b', 'c'], 1, 'x')).toEqual(['a', 'x', 'b', 'c']);
      expect(insert(['a', 'b', 'c'], 2, 'x')).toEqual(['a', 'b', 'x', 'c']);
      expect(insert(['a', 'b', 'c'], 3, 'x')).toEqual(['a', 'b', 'c', 'x']);
      expect(insert([], 0, 'x')).toEqual(['x']);

      expect(() => insert(['a', 'b', 'c'], -1, 'x')).toThrow('insert index out of bounds (-1)');
      expect(() => insert(['a', 'b', 'c'], 4, 'x')).toThrow('insert index out of bounds (4)');
    });
  });
});
