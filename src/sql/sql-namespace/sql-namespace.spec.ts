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

import { RefName, SqlColumn, SqlExpression, SqlFunction, SqlNamespace, SqlTable } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlNamespace', () => {
  describe('parses', () => {
    it.each([`ns.t.c`, `"ns" . t . c`, `"a""b".c.d`])('parses a namespace in %s', sql => {
      backAndForth(sql);
    });

    it('parses the first of three parts as a namespace', () => {
      const column = SqlExpression.parse(`"ns" . t . c`) as SqlColumn;
      const namespace = column.table!.namespace!;
      expect(namespace).toBeInstanceOf(SqlNamespace);
      expect(namespace.getName()).toEqual('ns');
      expect(String(namespace)).toEqual('"ns"');
    });
  });

  describe('.create', () => {
    it('always quotes', () => {
      expect(String(SqlNamespace.create('sys'))).toEqual(`"sys"`);
    });

    it('returns an existing namespace as is', () => {
      const namespace = SqlNamespace.create('sys');
      expect(SqlNamespace.create(namespace)).toBe(namespace);
    });
  });

  describe('.optionalQuotes', () => {
    it('quotes only what needs quoting', () => {
      expect(String(SqlNamespace.optionalQuotes('sys'))).toEqual(`sys`);
      expect(String(SqlNamespace.optionalQuotes('my ns'))).toEqual(`"my ns"`);
    });

    it('returns an existing namespace as is', () => {
      const namespace = SqlNamespace.create('sys');
      expect(SqlNamespace.optionalQuotes(namespace)).toBe(namespace);
    });
  });

  describe('#changeRefName', () => {
    it('replaces the name', () => {
      expect(
        String(SqlNamespace.create('sys').changeRefName(RefName.create('ext', false))),
      ).toEqual(`ext`);
    });
  });

  describe('#getName', () => {
    it('returns the unquoted name', () => {
      expect(SqlNamespace.create('a"b').getName()).toEqual('a"b');
    });
  });

  describe('#changeName', () => {
    it('keeps the existing quoting', () => {
      expect(String(SqlNamespace.optionalQuotes('sys').changeName('ext'))).toEqual(`ext`);
      expect(String(SqlNamespace.create('sys').changeName('ext'))).toEqual(`"ext"`);
    });
  });

  describe('#prettyTrim', () => {
    it('trims a long name', () => {
      expect(String(SqlNamespace.create('abcdefghij').prettyTrim(6))).toEqual(`"abc..."`);
    });

    it('leaves a short name alone', () => {
      expect(String(SqlNamespace.optionalQuotes('sys').prettyTrim(6))).toEqual(`sys`);
    });
  });

  describe('#table', () => {
    it('makes a quoted table in the namespace', () => {
      const table = SqlNamespace.optionalQuotes('sys').table('segments');
      expect(table).toBeInstanceOf(SqlTable);
      expect(String(table)).toEqual(`sys."segments"`);
      expect(table.getNamespaceName()).toEqual('sys');
    });
  });

  describe('#tableWithOptionalQuotes', () => {
    it('makes a table that is quoted only when needed', () => {
      expect(
        String(SqlNamespace.optionalQuotes('sys').tableWithOptionalQuotes('segments')),
      ).toEqual(`sys.segments`);
      expect(String(SqlNamespace.optionalQuotes('sys').tableWithOptionalQuotes('my t'))).toEqual(
        `sys."my t"`,
      );
    });
  });

  describe('#F', () => {
    it('makes a function call in the namespace', () => {
      const fn = SqlNamespace.optionalQuotes('ext').F('my_fn', 1, SqlColumn.create('x'));
      expect(fn).toBeInstanceOf(SqlFunction);
      expect(String(fn)).toEqual(`ext.my_fn(1, "x")`);
      expect(fn.getNamespaceName()).toEqual('ext');
    });
  });
});
