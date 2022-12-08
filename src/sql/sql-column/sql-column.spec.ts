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

import { SqlColumn, SqlExpression, SqlQuery } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlColumn', () => {
  it('things that work', () => {
    const queries: string[] = [
      `hello`,
      `h`,
      `_hello`,
      `"hello"`,
      `"""hello"""`,
      `"a""b"`,
      `a.b`,
      `"a""b".c`,
      `U&"fo\\feffo"`, // \ufeff = invisible space
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        console.log(`Problem with: \`${sql}\``);
        throw e;
      }
    }
  });

  it('avoids reserved', () => {
    const sql = 'From';

    expect(() => SqlExpression.parse(sql)).toThrowError('Expected');
  });

  describe('#column', () => {
    it('works with reserved word', () => {
      expect(String(SqlColumn.create('as'))).toEqual(`"as"`);
    });

    it('works with . and "', () => {
      expect(String(SqlColumn.create('wiki.pe"dia'))).toEqual(`"wiki.pe""dia"`);
    });

    it('works with column starting with a number', () => {
      expect(String(SqlColumn.create('3d'))).toEqual(`"3d"`);
    });
  });

  describe('#columnWithoutQuotes', () => {
    it('is cool with reserved alias', () => {
      expect(String(SqlColumn.optionalQuotes('user'))).toEqual(`user`);
    });
  });

  it('with double quotes and double quoted namespace', () => {
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

  it('with double quotes and no quotes namespace', () => {
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

  it('with no quotes and namespace', () => {
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

  it('with no quotes and no namespace', () => {
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

  it('with double quotes and no namespace', () => {
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

  it('quotes', () => {
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

  it('without quotes', () => {
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

  it('without quotes + namespace', () => {
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

  it('without quotes + table + parens', () => {
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

  it('column.table.namespace', () => {
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

  it('too many parts', () => {
    const sql = `"lol" . channel.boo .moo`;

    expect(() => SqlExpression.parse(sql)).toThrowError();
  });
});

describe('#convertToTable', () => {
  it('with double quotes upgraded', () => {
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

  it('SqlColumn in select should be upgraded', () => {
    const sql = `select tbl from sys.segments`;

    backAndForth(sql);

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "clusteredByClause": undefined,
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
