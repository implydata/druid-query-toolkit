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

import { SqlExpression, SqlQuery, SqlRef } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlRef', () => {
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
      expect(String(SqlRef.column('as'))).toEqual(`"as"`);
    });

    it('is cool with reserved alias', () => {
      expect(String(SqlRef.column('user'))).toEqual(`user`);
    });

    it('works with . and "', () => {
      expect(String(SqlRef.column('wiki.pe"dia'))).toEqual(`"wiki.pe""dia"`);
    });

    it('works with column starting with a number', () => {
      expect(String(SqlRef.column('3d'))).toEqual(`"3d"`);
    });
  });

  it('Ref with double quotes and double quoted namespace', () => {
    const sql = '"test"."namespace"';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "namespace",
          "quotes": true,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
        "parens": undefined,
        "spacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "tableRefName": RefName {
          "name": "test",
          "quotes": true,
        },
        "type": "ref",
      }
    `);
  });

  it('Ref with double quotes and no quotes namespace', () => {
    const sql = '"test".namespace';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "namespace",
          "quotes": false,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
        "parens": undefined,
        "spacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "tableRefName": RefName {
          "name": "test",
          "quotes": true,
        },
        "type": "ref",
      }
    `);
  });

  it('Ref with no quotes and namespace', () => {
    const sql = 'test.namespace';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "namespace",
          "quotes": false,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
        "parens": undefined,
        "spacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "tableRefName": RefName {
          "name": "test",
          "quotes": false,
        },
        "type": "ref",
      }
    `);
  });

  it('Ref with no quotes and no namespace', () => {
    const sql = 'test';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "test",
          "quotes": false,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
        "parens": undefined,
        "spacing": Object {},
        "tableRefName": undefined,
        "type": "ref",
      }
    `);
  });

  it('Ref with double quotes and no namespace', () => {
    const sql = '"test"';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "test",
          "quotes": true,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
        "parens": undefined,
        "spacing": Object {},
        "tableRefName": undefined,
        "type": "ref",
      }
    `);
  });

  it('quotes', () => {
    const sql = `"page"`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "page",
          "quotes": true,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
        "parens": undefined,
        "spacing": Object {},
        "tableRefName": undefined,
        "type": "ref",
      }
    `);
  });

  it('without quotes', () => {
    const sql = `channel`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "channel",
          "quotes": false,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
        "parens": undefined,
        "spacing": Object {},
        "tableRefName": undefined,
        "type": "ref",
      }
    `);
  });

  it('without quotes + namespace', () => {
    const sql = `"lol" . channel`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "channel",
          "quotes": false,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
        "parens": undefined,
        "spacing": Object {
          "postTableDot": " ",
          "preTableDot": " ",
        },
        "tableRefName": RefName {
          "name": "lol",
          "quotes": true,
        },
        "type": "ref",
      }
    `);
  });

  it('without quotes + namespace + parens', () => {
    const sql = `(( "lol" . channel)   )`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "channel",
          "quotes": false,
        },
        "keywords": Object {},
        "namespaceRefName": undefined,
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
        "spacing": Object {
          "postTableDot": " ",
          "preTableDot": " ",
        },
        "tableRefName": RefName {
          "name": "lol",
          "quotes": true,
        },
        "type": "ref",
      }
    `);
  });

  it('column.table.namespace', () => {
    const sql = `"lol"  .  channel  .  boo`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "columnRefName": RefName {
          "name": "boo",
          "quotes": false,
        },
        "keywords": Object {},
        "namespaceRefName": RefName {
          "name": "lol",
          "quotes": true,
        },
        "parens": undefined,
        "spacing": Object {
          "postNamespaceDot": "  ",
          "postTableDot": "  ",
          "preNamespaceDot": "  ",
          "preTableDot": "  ",
        },
        "tableRefName": RefName {
          "name": "channel",
          "quotes": false,
        },
        "type": "ref",
      }
    `);
  });

  it('too many parts', () => {
    const sql = `"lol" . channel.boo .moo`;

    expect(() => SqlExpression.parse(sql)).toThrowError();
  });
});

describe('#convertToTableRef', () => {
  it('Ref with double quotes upgraded', () => {
    const sql = `"namespace"  . "table"`;

    expect((SqlExpression.parse(sql) as SqlRef).convertToTableRef().toString()).toEqual(sql);

    expect((SqlExpression.parse(sql) as SqlRef).convertToTableRef()).toMatchInlineSnapshot(`
      SqlTableRef {
        "keywords": Object {},
        "namespaceRefName": RefName {
          "name": "namespace",
          "quotes": true,
        },
        "parens": undefined,
        "spacing": Object {
          "postNamespaceDot": " ",
          "preNamespaceDot": "  ",
        },
        "tableRefName": RefName {
          "name": "table",
          "quotes": true,
        },
        "type": "tableRef",
      }
    `);
  });

  it('SqlRef in select should be upgraded', () => {
    const sql = `select tbl from sys.segments`;

    backAndForth(sql);

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "clusteredByClause": undefined,
        "decorator": undefined,
        "explainClause": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlTableRef {
                "keywords": Object {},
                "namespaceRefName": RefName {
                  "name": "sys",
                  "quotes": false,
                },
                "parens": undefined,
                "spacing": Object {
                  "postNamespaceDot": "",
                  "preNamespaceDot": "",
                },
                "tableRefName": RefName {
                  "name": "segments",
                  "quotes": false,
                },
                "type": "tableRef",
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
            SqlRef {
              "columnRefName": RefName {
                "name": "tbl",
                "quotes": false,
              },
              "keywords": Object {},
              "namespaceRefName": undefined,
              "parens": undefined,
              "spacing": Object {},
              "tableRefName": undefined,
              "type": "ref",
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
