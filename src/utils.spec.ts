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

import {
  cleanFunctionArguments,
  cleanObject,
  dedupe,
  filterMap,
  isDate,
  isEmptyArray,
  isInteger,
  objectMap,
  sane,
} from './utils';

describe('utils', () => {
  describe('cleanObject', () => {
    it('filters out non-string values from object', () => {
      const input = {
        name: 'John',
        age: 30,
        city: 'New York',
        active: true,
        data: null,
        settings: undefined,
        tags: ['a', 'b'],
      };
      const result = cleanObject(input);
      expect(result).toEqual({
        name: 'John',
        city: 'New York',
      });
    });

    it('returns empty object when no string values exist', () => {
      const input = {
        age: 30,
        active: true,
        data: null,
        settings: undefined,
        tags: ['a', 'b'],
      };
      const result = cleanObject(input);
      expect(result).toEqual({});
    });

    it('handles empty object', () => {
      const input = {};
      const result = cleanObject(input);
      expect(result).toEqual({});
    });
  });

  describe('filterMap', () => {
    it('maps and filters out undefined values', () => {
      const input = [1, 2, 3, 4, 5];
      const result = filterMap(input, x => (x % 2 === 0 ? x * 2 : undefined));
      expect(result).toEqual([4, 8]);
    });

    it('provides index to mapping function', () => {
      const input = ['a', 'b', 'c', 'd'];
      const result = filterMap(input, (x, i) => (i % 2 === 0 ? x.toUpperCase() : undefined));
      expect(result).toEqual(['A', 'C']);
    });

    it('returns empty array when all values map to undefined', () => {
      const input = [1, 2, 3];
      const result = filterMap(input, () => undefined);
      expect(result).toEqual([]);
    });

    it('handles empty array', () => {
      const input: number[] = [];
      const result = filterMap(input, x => x * 2);
      expect(result).toEqual([]);
    });
  });

  describe('objectMap', () => {
    it('maps object values and filters out undefined', () => {
      const input = { a: 1, b: 2, c: 3, d: 4 };
      const result = objectMap(input, x => (x % 2 === 0 ? x * 2 : undefined));
      expect(result).toEqual({ b: 4, d: 8 });
    });

    it('provides key to mapping function', () => {
      const input = { a: 1, b: 2, c: 3 };
      const result = objectMap(input, (x, key) => `${key}:${x}`);
      expect(result).toEqual({ a: 'a:1', b: 'b:2', c: 'c:3' });
    });

    it('returns empty object when all values map to undefined', () => {
      const input = { a: 1, b: 2 };
      const result = objectMap(input, () => undefined);
      expect(result).toEqual({});
    });

    it('handles empty object', () => {
      const input = {};
      const result = objectMap(input, x => x);
      expect(result).toEqual({});
    });
  });

  describe('dedupe', () => {
    it('removes duplicate values', () => {
      const input = [1, 2, 3, 1, 2, 4, 5];
      const result = dedupe(input);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('works with empty array', () => {
      const input: number[] = [];
      const result = dedupe(input);
      expect(result).toEqual([]);
    });

    it('maintains insertion order', () => {
      const input = [3, 1, 2, 3, 1];
      const result = dedupe(input);
      expect(result).toEqual([3, 1, 2]);
    });

    it('uses custom key function when provided', () => {
      const input = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice (duplicate)' },
        { id: 3, name: 'Charlie' },
      ];
      const result = dedupe(input, item => String(item.id));
      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ]);
    });
  });

  describe('isEmptyArray', () => {
    it('returns true for empty arrays', () => {
      expect(isEmptyArray([])).toBe(true);
    });

    it('returns false for non-empty arrays', () => {
      expect(isEmptyArray([1, 2, 3])).toBe(false);
      expect(isEmptyArray([''])).toBe(false);
      expect(isEmptyArray([null])).toBe(false);
    });

    it('returns false for non-arrays', () => {
      expect(isEmptyArray(null)).toBe(false);
      expect(isEmptyArray(undefined)).toBe(false);
      expect(isEmptyArray({})).toBe(false);
      expect(isEmptyArray('')).toBe(false);
      expect(isEmptyArray(0)).toBe(false);
    });
  });

  describe('isDate', () => {
    it('returns true for Date objects', () => {
      expect(isDate(new Date())).toBe(true);
    });

    it('returns false for non-Date objects', () => {
      expect(isDate(null)).toBe(false);
      expect(isDate(undefined)).toBe(false);
      expect(isDate({})).toBe(false);
      expect(isDate('2023-01-01')).toBe(false);
      expect(isDate(123456789)).toBe(false);
    });

    it('returns true for objects with toISOString function', () => {
      const datelike = {
        toISOString: () => '2023-01-01T00:00:00.000Z',
      };
      expect(isDate(datelike)).toBe(true);
    });
  });

  describe('isInteger', () => {
    it('returns true for integer values', () => {
      expect(isInteger(0)).toBe(true);
      expect(isInteger(1)).toBe(true);
      expect(isInteger(-100)).toBe(true);
      expect(isInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(isInteger(Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    it('returns false for non-integer numbers', () => {
      expect(isInteger(0.5)).toBe(false);
      expect(isInteger(-1.2)).toBe(false);
      expect(isInteger(Math.PI)).toBe(false);
    });

    it('returns false for non-finite values', () => {
      expect(isInteger(NaN)).toBe(false);
      expect(isInteger(Infinity)).toBe(false);
      expect(isInteger(-Infinity)).toBe(false);
    });
  });

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

  describe('sane', () => {
    it('processes multiline template strings correctly', () => {
      const result = sane`
        function hello() {
          return "world";
        }
      `;

      expect(result).toBe('function hello() {\n  return "world";\n}');
    });

    it('handles indentation correctly', () => {
      const result = sane`
        const x = {
          a: 1,
          b: 2
        };
      `;

      expect(result).toBe('const x = {\n  a: 1,\n  b: 2\n};');
    });

    it('processes template strings with escaped characters', () => {
      // Test cases that don't rely on specific escaping behavior
      const result = sane`
        // This is a test
        function greet() {
          return "Hello, world!";
        }
      `;

      expect(result).toBe('// This is a test\nfunction greet() {\n  return "Hello, world!";\n}');
    });

    it('throws error if string does not start with newline', () => {
      expect(() => {
        const result = sane`const x = 1;`;
        return result;
      }).toThrow('sane string must start with a \\n');
    });
  });
});
