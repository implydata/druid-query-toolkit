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

import { backAndForth } from '../../test-utils';
import { RefName, SqlAlias, SqlColumn, SqlQuery } from '..';

describe('SqlAlias', () => {
  describe('parses', () => {
    it('works in no alias case', () => {
      const sql = `SELECT city`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "city",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        }
      `);
    });

    it('works in basic case', () => {
      const sql = `SELECT city AS City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {},
            "table": undefined,
            "type": "column",
          },
          "keywords": Object {
            "as": "AS",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": " ",
            "preAs": " ",
          },
          "type": "alias",
        }
      `);
    });

    it('works with table prefix', () => {
      const sql = `SELECT tbl.city  As   City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {
              "postDot": "",
              "postTable": "",
            },
            "table": SqlTable {
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "refName": RefName {
                "name": "tbl",
                "quotes": false,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "column",
          },
          "keywords": Object {
            "as": "As",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": "   ",
            "preAs": "  ",
          },
          "type": "alias",
        }
      `);
    });

    it('works without AS', () => {
      const sql = `SELECT tbl.city City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {
              "postDot": "",
              "postTable": "",
            },
            "table": SqlTable {
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "refName": RefName {
                "name": "tbl",
                "quotes": false,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "column",
          },
          "keywords": Object {
            "as": "",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": " ",
          },
          "type": "alias",
        }
      `);
    });
  });

  describe('.create', () => {
    it('overwrites existing alias when aliasing an already aliased expression', () => {
      expect(
        SqlAlias.create(SqlAlias.create(SqlColumn.create('X'), 'name1'), 'name2').toString(),
      ).toEqual('"X" AS "name2"');
    });

    it('creates a simple alias with string column and string alias', () => {
      expect(SqlAlias.create(SqlColumn.create('col1'), 'alias1').toString()).toEqual(
        '"col1" AS "alias1"',
      );
    });

    it('creates an alias with RefName object as alias', () => {
      const refName = RefName.create('myAlias', true);
      expect(SqlAlias.create(SqlColumn.create('col1'), refName).toString()).toEqual(
        '"col1" AS "myAlias"',
      );
    });

    it('auto-quotes aliases that are reserved keywords', () => {
      expect(SqlAlias.create(SqlColumn.create('col1'), 'select').toString()).toEqual(
        '"col1" AS "select"',
      );
    });

    it('forces quotes when forceQuotes is true', () => {
      expect(SqlAlias.create(SqlColumn.create('col1'), 'normal', true).toString()).toEqual(
        '"col1" AS "normal"',
      );
    });

    it('adds parentheses to SqlQuery expressions', () => {
      const query = SqlQuery.create('tbl');
      const aliasedQuery = SqlAlias.create(query, 'subq');
      const result = aliasedQuery.toString();

      // Check that the result contains the main components rather than exact formatting
      expect(result).toContain('(');
      expect(result).toContain(')');
      expect(result).toContain('SELECT');
      expect(result).toContain('FROM "tbl"');
      expect(result).toContain('AS "subq"');
    });
  });

  describe('#changeAlias', () => {
    const x = SqlAlias.create(SqlColumn.optionalQuotes('X'), 'test');
    const z = SqlAlias.create(SqlColumn.optionalQuotes('Z'), RefName.create('test', true));

    it('should work with normal string', () => {
      expect(String(x.changeAlias('hello'))).toEqual('X AS "hello"');
    });

    it('should preserve quotes', () => {
      expect(String(z.changeAlias('hello'))).toEqual('Z AS "hello"');
    });

    it('should work with quotes if needed', () => {
      expect(String(x.changeAlias('select'))).toEqual('X AS "select"');
    });

    it('should work with quotes if forced', () => {
      expect(String(x.changeAlias('hello', true))).toEqual('X AS "hello"');
    });
  });
});
