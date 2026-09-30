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

import { RefName, SqlColumn, SqlExpression, SqlNamespace, SqlStar, SqlTable } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlTable', () => {
  describe('parses', () => {
    it.each([`hello`, `"hello"`, `"""hello"""`, `"a""b"`, `a.b`, `"a""b".c`])(
      'does back and forth with %s',
      sql => {
        backAndForth(sql);
      },
    );
  });

  describe('does not parse', () => {
    it('rejects a reserved keyword', () => {
      const sql = 'From';

      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('quotes the name and namespace', () => {
      expect(String(SqlTable.create('hello'))).toEqual(`"hello"`);
      expect(String(SqlTable.create('hello', 'world'))).toEqual(`"world"."hello"`);
    });

    it('returns an existing table as is when no namespace is given', () => {
      const table = SqlTable.create('hello');
      expect(SqlTable.create(table)).toBe(table);
    });

    it('sets the namespace on an existing table', () => {
      expect(String(SqlTable.create(SqlTable.optionalQuotes('hello'), 'world'))).toEqual(
        `"world".hello`,
      );
    });
  });

  describe('.optionalQuotes', () => {
    it('quotes only what needs quoting', () => {
      expect(String(SqlTable.optionalQuotes('hello', 'world'))).toEqual(`world.hello`);
      expect(String(SqlTable.optionalQuotes('my table', 'my ns'))).toEqual(`"my ns"."my table"`);
    });

    it('returns an existing table as is when no namespace is given', () => {
      const table = SqlTable.create('hello');
      expect(SqlTable.optionalQuotes(table)).toBe(table);
    });

    it('sets the namespace on an existing table', () => {
      expect(String(SqlTable.optionalQuotes(SqlTable.optionalQuotes('hello'), 'world'))).toEqual(
        `"world".hello`,
      );
    });
  });

  describe('#changeRefName', () => {
    it('replaces the name and keeps the namespace', () => {
      const table = SqlTable.optionalQuotes('hello', 'world');
      expect(String(table.changeRefName(RefName.create('bye')))).toEqual(`world."bye"`);
    });
  });

  describe('#getName', () => {
    it('returns the unquoted name', () => {
      expect(SqlTable.create('a"b', 'ns').getName()).toEqual('a"b');
    });
  });

  describe('#changeName', () => {
    it('keeps the existing quoting', () => {
      expect(String(SqlTable.optionalQuotes('hello').changeName('bye'))).toEqual(`bye`);
      expect(String(SqlTable.create('hello').changeName('bye'))).toEqual(`"bye"`);
    });
  });

  describe('#changeNamespace', () => {
    it('sets a namespace', () => {
      expect(String(SqlTable.create('t').changeNamespace(SqlNamespace.create('ns')))).toEqual(
        `"ns"."t"`,
      );
    });

    it('removes the namespace along with its spacing', () => {
      const table = SqlTable.optionalQuotes('t', 'ns').changeSpaces({
        postNamespace: ' ',
        postDot: ' ',
      });
      expect(String(table)).toEqual(`ns . t`);

      const changed = table.changeNamespace(undefined);
      expect(String(changed)).toEqual(`t`);
      expect(changed.namespace).toBeUndefined();
      expect(changed.spacing).toEqual({});
    });
  });

  describe('#getNamespaceName', () => {
    it('returns the namespace name when there is one', () => {
      expect(SqlTable.create('t', 'ns').getNamespaceName()).toEqual('ns');
      expect(SqlTable.create('t').getNamespaceName()).toBeUndefined();
    });
  });

  describe('#changeNamespaceName', () => {
    it('renames an existing namespace and keeps its quoting', () => {
      expect(String(SqlTable.optionalQuotes('t', 'ns').changeNamespaceName('sys'))).toEqual(
        `sys.t`,
      );
    });

    it('creates a namespace when there is none', () => {
      expect(String(SqlTable.optionalQuotes('t').changeNamespaceName('sys'))).toEqual(`"sys".t`);
    });

    it('removes the namespace when given undefined', () => {
      expect(String(SqlTable.optionalQuotes('t', 'ns').changeNamespaceName(undefined))).toEqual(
        `t`,
      );
    });
  });

  describe('#prettyTrim', () => {
    it('trims the table name', () => {
      expect(String(SqlTable.create('abcdefghij').prettyTrim(6))).toEqual(`"abc..."`);
    });

    it('trims the namespace name too', () => {
      expect(String(SqlTable.create('abcdefghij', 'klmnopqrst').prettyTrim(6))).toEqual(
        `"klm..."."abc..."`,
      );
    });
  });

  describe('#convertToNamespace', () => {
    it('converts a table without a namespace', () => {
      const namespace = SqlTable.optionalQuotes('sys').convertToNamespace();
      expect(namespace).toBeInstanceOf(SqlNamespace);
      expect(String(namespace)).toEqual('sys');
    });

    it('fails when there is a namespace', () => {
      expect(() => SqlTable.create('t', 'ns').convertToNamespace()).toThrow('can not convert');
    });
  });

  describe('#column', () => {
    it('makes a column in the table', () => {
      expect(String(SqlTable.create('hello').column('x'))).toEqual('"hello"."x"');
      expect(String(SqlTable.create('hello', SqlNamespace.create('world')).column('x'))).toEqual(
        '"world"."hello"."x"',
      );
    });
  });

  describe('#columnWithOptionalQuotes', () => {
    it('makes a column that is quoted only when needed', () => {
      const column = SqlTable.optionalQuotes('hello').columnWithOptionalQuotes('x');
      expect(column).toBeInstanceOf(SqlColumn);
      expect(String(column)).toEqual('hello.x');
      expect(String(SqlTable.optionalQuotes('hello').columnWithOptionalQuotes('my x'))).toEqual(
        'hello."my x"',
      );
    });
  });

  describe('#star', () => {
    it('makes a star for the table', () => {
      const star = SqlTable.optionalQuotes('hello', 'world').star();
      expect(star).toBeInstanceOf(SqlStar);
      expect(String(star)).toEqual('world.hello.*');
    });
  });
});
