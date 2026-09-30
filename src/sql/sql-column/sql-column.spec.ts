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

import { RefName, SqlColumn, SqlExpression, SqlQuery, SqlTable } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlColumn', () => {
  describe('parses', () => {
    it.each([
      `hello`,
      `h`,
      `_hello`,
      `"hello"`,
      `"""hello"""`,
      `"a""b"`,
      `a.b`,
      `"a""b".c`,
      `U&"fo\\feffo"`, // \ufeff = invisible space
    ])('correctly parses: %s', sql => {
      backAndForth(sql);
    });

    it('works with double quotes and double quoted namespace', () => {
      const sql = '"test"."namespace"';

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "namespace",
            "quotes": true,
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
              "name": "test",
              "quotes": true,
            },
            "spacing": Object {},
            "type": "table",
          },
          "type": "column",
        }
      `);
    });

    it('works with double quotes and no quotes namespace', () => {
      const sql = '"test".namespace';

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "namespace",
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
              "name": "test",
              "quotes": true,
            },
            "spacing": Object {},
            "type": "table",
          },
          "type": "column",
        }
      `);
    });

    it('works with no quotes and namespace', () => {
      const sql = 'test.namespace';

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "namespace",
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
              "name": "test",
              "quotes": false,
            },
            "spacing": Object {},
            "type": "table",
          },
          "type": "column",
        }
      `);
    });

    it('works with no quotes and no namespace', () => {
      const sql = 'test';

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "test",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        }
      `);
    });

    it('works with double quotes and no namespace', () => {
      const sql = '"test"';

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "test",
            "quotes": true,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        }
      `);
    });

    it('works with quotes', () => {
      const sql = `"page"`;

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "page",
            "quotes": true,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        }
      `);
    });

    it('works without quotes', () => {
      const sql = `channel`;

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "channel",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        }
      `);
    });

    it('works without quotes + namespace', () => {
      const sql = `"lol" . channel`;

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "channel",
            "quotes": false,
          },
          "spacing": Object {
            "postDot": " ",
            "postTable": " ",
          },
          "table": SqlTable {
            "keywords": Object {},
            "namespace": undefined,
            "parens": undefined,
            "refName": RefName {
              "name": "lol",
              "quotes": true,
            },
            "spacing": Object {},
            "type": "table",
          },
          "type": "column",
        }
      `);
    });

    it('works without quotes + table + parens', () => {
      const sql = `(( "lol" . channel)   )`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": Array [
            Object {
              "leftSpacing": " ",
              "rightSpacing": "",
            },
            Object {
              "leftSpacing": "",
              "rightSpacing": "   ",
            },
          ],
          "refName": RefName {
            "name": "channel",
            "quotes": false,
          },
          "spacing": Object {
            "postDot": " ",
            "postTable": " ",
          },
          "table": SqlTable {
            "keywords": Object {},
            "namespace": undefined,
            "parens": undefined,
            "refName": RefName {
              "name": "lol",
              "quotes": true,
            },
            "spacing": Object {},
            "type": "table",
          },
          "type": "column",
        }
      `);
    });

    it('works with column.table.namespace', () => {
      const sql = `"lol"  .  channel  .  boo`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "boo",
            "quotes": false,
          },
          "spacing": Object {
            "postDot": "  ",
            "postTable": "  ",
          },
          "table": SqlTable {
            "keywords": Object {},
            "namespace": SqlNamespace {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "lol",
                "quotes": true,
              },
              "spacing": Object {},
              "type": "namespace",
            },
            "parens": undefined,
            "refName": RefName {
              "name": "channel",
              "quotes": false,
            },
            "spacing": Object {
              "postDot": "  ",
              "postNamespace": "  ",
            },
            "type": "table",
          },
          "type": "column",
        }
      `);
    });

    it('upgrades a column in FROM to a table', () => {
      const sql = `select tbl from sys.segments`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": SqlNamespace {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "sys",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "namespace",
                  },
                  "parens": undefined,
                  "refName": RefName {
                    "name": "segments",
                    "quotes": false,
                  },
                  "spacing": Object {
                    "postDot": "",
                    "postNamespace": "",
                  },
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "tbl",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });
  });

  describe('does not parse', () => {
    it('rejects a reserved keyword', () => {
      const sql = 'From';

      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });

    it('rejects too many parts', () => {
      const sql = `"lol" . channel.boo .moo`;

      expect(() => SqlExpression.parse(sql)).toThrow();
    });
  });

  describe('.create', () => {
    it('works with reserved word', () => {
      expect(String(SqlColumn.create('as'))).toEqual(`"as"`);
    });

    it('works with . and "', () => {
      expect(String(SqlColumn.create('wiki.pe"dia'))).toEqual(`"wiki.pe""dia"`);
    });

    it('works with column starting with a number', () => {
      expect(String(SqlColumn.create('3d'))).toEqual(`"3d"`);
    });

    it('adds a quoted table', () => {
      expect(String(SqlColumn.create('x', 'tbl'))).toEqual(`"tbl"."x"`);
      expect(String(SqlColumn.create('x', SqlTable.create('tbl', 'ns')))).toEqual(`"ns"."tbl"."x"`);
    });

    it('returns an existing column as is when no table is given', () => {
      const column = SqlColumn.create('x');
      expect(SqlColumn.create(column)).toBe(column);
    });

    it('sets the table on an existing column', () => {
      const column = SqlExpression.parse('a.x') as SqlColumn;
      expect(String(SqlColumn.create(column, 'b'))).toEqual(`"b".x`);
    });
  });

  describe('.optionalQuotes', () => {
    it('does not quote a reserved alias', () => {
      expect(String(SqlColumn.optionalQuotes('user'))).toEqual(`user`);
    });

    it('quotes only what needs quoting', () => {
      expect(String(SqlColumn.optionalQuotes('x', 'tbl'))).toEqual(`tbl.x`);
      expect(String(SqlColumn.optionalQuotes('my col', 'my tbl'))).toEqual(`"my tbl"."my col"`);
    });

    it('returns an existing column as is when no table is given', () => {
      const column = SqlColumn.create('x');
      expect(SqlColumn.optionalQuotes(column)).toBe(column);
    });

    it('sets the table on an existing column', () => {
      const column = SqlExpression.parse('a.x') as SqlColumn;
      expect(String(SqlColumn.optionalQuotes(column, 'b'))).toEqual(`"b".x`);
    });
  });

  describe('#changeRefName', () => {
    it('replaces the name and keeps the table', () => {
      const column = SqlExpression.parse('t . x') as SqlColumn;
      expect(String(column.changeRefName(RefName.create('y', false)))).toEqual(`t . y`);
    });
  });

  describe('#getName', () => {
    it('returns the unquoted name', () => {
      expect((SqlExpression.parse('t."a""b"') as SqlColumn).getName()).toEqual('a"b');
    });
  });

  describe('#changeName', () => {
    it('keeps the existing quoting', () => {
      expect(String((SqlExpression.parse('t.x') as SqlColumn).changeName('y'))).toEqual(`t.y`);
      expect(String((SqlExpression.parse('"x"') as SqlColumn).changeName('y'))).toEqual(`"y"`);
    });

    it('adds quotes when the new name needs them', () => {
      expect(String((SqlExpression.parse('x') as SqlColumn).changeName('my col'))).toEqual(
        `"my col"`,
      );
    });
  });

  describe('#changeTable', () => {
    it('sets a table', () => {
      const column = SqlColumn.create('x');
      expect(String(column.changeTable(SqlTable.create('t')))).toEqual(`"t"."x"`);
    });

    it('replaces the table and keeps the spacing', () => {
      const column = SqlExpression.parse('a . x') as SqlColumn;
      expect(String(column.changeTable(SqlTable.optionalQuotes('b')))).toEqual(`b . x`);
    });

    it('removes the table along with its spacing', () => {
      const column = SqlExpression.parse('a . x') as SqlColumn;
      const changed = column.changeTable(undefined);
      expect(String(changed)).toEqual(`x`);
      expect(changed.table).toBeUndefined();
      expect(changed.spacing).toEqual({});
    });
  });

  describe('#getTableName', () => {
    it('returns the table name when there is one', () => {
      expect((SqlExpression.parse('ns.t.x') as SqlColumn).getTableName()).toEqual('t');
      expect((SqlExpression.parse('x') as SqlColumn).getTableName()).toBeUndefined();
    });
  });

  describe('#changeTableName', () => {
    it('renames an existing table and keeps its namespace and quoting', () => {
      const column = SqlExpression.parse('ns.t.x') as SqlColumn;
      expect(String(column.changeTableName('u'))).toEqual(`ns.u.x`);
    });

    it('creates a table when there is none', () => {
      expect(String(SqlColumn.create('x').changeTableName('t'))).toEqual(`"t"."x"`);
    });

    it('removes the table when given undefined', () => {
      const column = SqlExpression.parse('t.x') as SqlColumn;
      expect(String(column.changeTableName(undefined))).toEqual(`x`);
    });
  });

  describe('#getNamespaceName', () => {
    it('returns the namespace of the table when there is one', () => {
      expect((SqlExpression.parse('ns.t.x') as SqlColumn).getNamespaceName()).toEqual('ns');
      expect((SqlExpression.parse('t.x') as SqlColumn).getNamespaceName()).toBeUndefined();
      expect((SqlExpression.parse('x') as SqlColumn).getNamespaceName()).toBeUndefined();
    });
  });

  describe('#prettyTrim', () => {
    it('trims the column name', () => {
      expect(String(SqlColumn.create('abcdefghij').prettyTrim(6))).toEqual(`"abc..."`);
    });

    it('trims the table and namespace names too', () => {
      const column = SqlColumn.create('abcdefghij', SqlTable.create('klmnopqrst', 'uvwxyzabcd'));
      expect(String(column.prettyTrim(6))).toEqual(`"uvw..."."klm..."."abc..."`);
    });

    it('leaves short names alone', () => {
      expect(String((SqlExpression.parse('t.x') as SqlColumn).prettyTrim(6))).toEqual(`t.x`);
    });
  });

  describe('#convertToTable', () => {
    it('converts a namespaced column with double quotes', () => {
      const sql = `"namespace"  . "table"`;

      expect((SqlExpression.parse(sql) as SqlColumn).convertToTable().toString()).toEqual(sql);

      expect((SqlExpression.parse(sql) as SqlColumn).convertToTable()).toMatchInlineSnapshot(`
        SqlTable {
          "keywords": Object {},
          "namespace": SqlNamespace {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "namespace",
              "quotes": true,
            },
            "spacing": Object {},
            "type": "namespace",
          },
          "parens": undefined,
          "refName": RefName {
            "name": "table",
            "quotes": true,
          },
          "spacing": Object {
            "postDot": " ",
            "postNamespace": "  ",
          },
          "type": "table",
        }
      `);
    });

    it('converts a plain column', () => {
      const table = (SqlExpression.parse('x') as SqlColumn).convertToTable();
      expect(table).toBeInstanceOf(SqlTable);
      expect(String(table)).toEqual('x');
      expect(table.namespace).toBeUndefined();
    });

    it('fails when there are three parts', () => {
      const column = SqlExpression.parse('a.b.c') as SqlColumn;
      expect(() => column.convertToTable()).toThrow('can not convert');
    });
  });

  describe('#getOutputName', () => {
    it('returns the column name', () => {
      expect((SqlExpression.parse('t."Hello"') as SqlColumn).getOutputName()).toEqual('Hello');
    });
  });
});
