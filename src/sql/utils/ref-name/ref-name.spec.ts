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

import { RefName } from '../../..';

describe('RefName', () => {
  describe('static methods for detecting reserved words', () => {
    it('identifies reserved keywords', () => {
      expect(RefName.isReservedKeyword('SELECT')).toBe(true);
      expect(RefName.isReservedKeyword('select')).toBe(true); // Case insensitive
      expect(RefName.isReservedKeyword('FROM')).toBe(true);
      expect(RefName.isReservedKeyword('normalword')).toBe(false);
    });

    it('identifies reserved aliases', () => {
      expect(RefName.isReservedAlias('SELECT')).toBe(true); // Keywords are also reserved aliases
      expect(RefName.isReservedAlias('VALUE')).toBe(true); // Reserved alias
      expect(RefName.isReservedAlias('normalword')).toBe(false);
    });

    it('identifies reserved function names', () => {
      // Depends on which functions are allowed, checking pattern rather than specific values
      const someForbiddenKeyword = RefName.RESERVED_KEYWORDS.find(
        k => !RefName.ALLOWED_FUNCTIONS.includes(k),
      );

      if (someForbiddenKeyword) {
        expect(RefName.isReservedFunctionName(someForbiddenKeyword)).toBe(true);
      }

      // COUNT should be an allowed function
      expect(RefName.isReservedFunctionName('COUNT')).toBe(false);
      expect(RefName.isReservedFunctionName('normalword')).toBe(false);
    });
  });

  describe('static methods for detecting need for quotes', () => {
    it('determines when names need quotes', () => {
      expect(RefName.needsQuotes('SELECT')).toBe(true); // Reserved keyword needs quotes
      expect(RefName.needsQuotes('normal_column')).toBe(false); // Valid identifier
      expect(RefName.needsQuotes('123column')).toBe(true); // Invalid identifier (starts with number)
      expect(RefName.needsQuotes('column-name')).toBe(true); // Invalid identifier (has hyphen)
      expect(RefName.needsQuotes('column name')).toBe(true); // Invalid identifier (has space)
    });

    it('determines when aliases need quotes', () => {
      expect(RefName.needsQuotesAlias('VALUE')).toBe(true); // Reserved alias needs quotes
      expect(RefName.needsQuotesAlias('normal_alias')).toBe(false); // Valid identifier
    });

    it('determines when function names need quotes', () => {
      // Testing with allowed function names vs reserved keywords
      expect(RefName.needsQuotesFunctionName('COUNT')).toBe(false); // Allowed function

      const someForbiddenKeyword = RefName.RESERVED_KEYWORDS.find(
        k => !RefName.ALLOWED_FUNCTIONS.includes(k),
      );

      if (someForbiddenKeyword) {
        expect(RefName.needsQuotesFunctionName(someForbiddenKeyword)).toBe(true);
      }
    });
  });

  describe('.maybe', () => {
    it('returns undefined for undefined input', () => {
      expect(RefName.maybe(undefined)).toBeUndefined();
    });

    it('creates a RefName for valid input', () => {
      const result = RefName.maybe('column');

      expect(result).toBeInstanceOf(RefName);
      expect(result?.name).toBe('column');
      expect(result?.quotes).toBe(true); // Default is true if forceQuotes=true
    });
  });

  describe('.create', () => {
    it('creates a new RefName with default options', () => {
      const refName = RefName.create('column');

      expect(refName).toBeInstanceOf(RefName);
      expect(refName.name).toBe('column');
      expect(refName.quotes).toBe(true); // Default is true if forceQuotes=true
    });

    it('respects the forceQuotes parameter when false for valid identifiers', () => {
      // column is a valid identifier and not a reserved keyword
      const refName = RefName.create('column', false);

      // The quotes will be false because forceQuotes=false and needsQuotes(column)=false
      expect(refName.quotes).toBe(RefName.needsQuotes('column'));
    });

    it('always adds quotes for reserved keywords regardless of forceQuotes', () => {
      const refName = RefName.create('SELECT', false);

      expect(refName.quotes).toBe(true);
    });

    it('returns the same instance if input is already a RefName', () => {
      const original = RefName.create('column');
      const result = RefName.create(original);

      expect(result).toBe(original);
    });
  });

  describe('.alias', () => {
    it('creates a new RefName for an alias with default options', () => {
      const refName = RefName.alias('alias_column');

      expect(refName).toBeInstanceOf(RefName);
      expect(refName.name).toBe('alias_column');
      expect(refName.quotes).toBe(true); // Default is true if forceQuotes=true
    });

    it('respects the forceQuotes parameter when false', () => {
      const refName = RefName.alias('alias_column', false);

      expect(refName.quotes).toBe(false);
    });

    it('always adds quotes for reserved aliases regardless of forceQuotes', () => {
      const refName = RefName.alias('VALUE', false);

      expect(refName.quotes).toBe(true);
    });

    it('returns the same instance if input is already a RefName', () => {
      const original = RefName.alias('alias_column');
      const result = RefName.alias(original);

      expect(result).toBe(original);
    });
  });

  describe('.functionName', () => {
    it('creates a new RefName for a function name with default options', () => {
      const refName = RefName.functionName('my_func');

      expect(refName).toBeInstanceOf(RefName);
      expect(refName.name).toBe('my_func');
      expect(refName.quotes).toBe(false); // Default is false for function names
    });

    it('respects the forceQuotes parameter when true', () => {
      const refName = RefName.functionName('my_func', true);

      expect(refName.quotes).toBe(true);
    });

    it('adds quotes for reserved function names regardless of forceQuotes', () => {
      // Find a keyword that isn't an allowed function
      const someForbiddenKeyword = RefName.RESERVED_KEYWORDS.find(
        k => !RefName.ALLOWED_FUNCTIONS.includes(k),
      );

      if (someForbiddenKeyword) {
        const refName = RefName.functionName(someForbiddenKeyword, false);
        expect(refName.quotes).toBe(true);
      }
    });

    it('returns the same instance if input is already a RefName', () => {
      const original = RefName.functionName('my_func');
      const result = RefName.functionName(original);

      expect(result).toBe(original);
    });
  });

  describe('#toString', () => {
    it('returns the name as is when quotes is false', () => {
      const refName = new RefName({ name: 'column', quotes: false });

      expect(refName.toString()).toBe('column');
    });

    it('surrounds the name with double quotes when quotes is true', () => {
      const refName = new RefName({ name: 'column', quotes: true });

      expect(refName.toString()).toBe('"column"');
    });

    it('escapes double quotes in the name', () => {
      const refName = new RefName({ name: 'col"umn', quotes: true });

      expect(refName.toString()).toBe('"col""umn"');
    });
  });

  describe('#changeName', () => {
    it('returns a new RefName with the new name and same quotes setting', () => {
      const original = new RefName({ name: 'old_name', quotes: true });

      const changed = original.changeName('new_name');

      expect(changed.name).toBe('new_name');
      expect(changed.quotes).toBe(true);
      expect(changed).not.toBe(original);
    });
  });

  describe('#changeNameAsAlias', () => {
    it('returns a new RefName with the new name treated as an alias', () => {
      const original = new RefName({ name: 'old_name', quotes: false });

      // Using a reserved alias keyword should force quotes
      const changed = original.changeNameAsAlias('VALUE');

      expect(changed.name).toBe('VALUE');
      expect(changed.quotes).toBe(true); // Forced quotes due to reserved alias
    });
  });

  describe('#changeNameAsFunctionName', () => {
    it('returns a new RefName with the new name treated as a function name', () => {
      const original = new RefName({ name: 'old_name', quotes: true });

      // Using an allowed function name should not need quotes
      const changed = original.changeNameAsFunctionName('COUNT');

      expect(changed.name).toBe('COUNT');
      expect(changed.quotes).toBe(true); // Preserves original quotes setting
    });
  });

  describe('#prettyTrim', () => {
    it('trims the name to the specified length', () => {
      const original = new RefName({ name: 'very_long_column_name', quotes: true });

      const trimmed = original.prettyTrim(10);

      expect(trimmed.name.length).toBeLessThanOrEqual(10);
      expect(trimmed.quotes).toBe(true);
    });
  });
});
