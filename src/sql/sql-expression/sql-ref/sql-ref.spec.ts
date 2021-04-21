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

import { SqlExpression, SqlQuery, SqlRef } from '../../..';
import { backAndForth } from '../../../test-utils';

describe('SqlRef', () => {
  it('things that work', () => {
    const queries: string[] = [`hello`, `"hello"`, `"""hello"""`, `"a""b"`, `a.b`, `"a""b".c`];

    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        throw new Error(`problem with \`${sql}\`: ${e.message}`);
      }
    }
  });

  it('avoids reserved', () => {
    const sql = 'From';

    expect(() => SqlExpression.parse(sql)).toThrowError('Expected');
  });

  it('#column', () => {
    const star = SqlRef.column('*');

    backAndForth(star.toString());
    expect(star.isStar()).toEqual(true);
    expect(star).toMatchInlineSnapshot(`
      SqlRef {
        "column": "*",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": false,
        "spacing": Object {},
        "table": undefined,
        "tableQuotes": false,
        "type": "ref",
      }
    `);
  });

  describe('#column', () => {
    it('works with reserved word', () => {
      expect(String(SqlRef.column('user'))).toEqual(`"user"`);
    });

    it('works with .', () => {
      expect(String(SqlRef.column('wiki.pedia'))).toEqual(`"wiki.pedia"`);
    });
  });

  it('Ref with double quotes and double quoted namespace', () => {
    const sql = '"test"."namespace"';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "namespace",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": true,
        "spacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "table": "test",
        "tableQuotes": true,
        "type": "ref",
      }
    `);
  });

  it('Ref with double quotes and no quotes namespace', () => {
    const sql = '"test".namespace';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "namespace",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": false,
        "spacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "table": "test",
        "tableQuotes": true,
        "type": "ref",
      }
    `);
  });

  it('Ref with no quotes and namespace', () => {
    const sql = 'test.namespace';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "namespace",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": false,
        "spacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "table": "test",
        "tableQuotes": false,
        "type": "ref",
      }
    `);
  });

  it('Ref with no quotes and no namespace', () => {
    const sql = 'test';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "test",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": false,
        "spacing": Object {},
        "table": undefined,
        "tableQuotes": false,
        "type": "ref",
      }
    `);
  });

  it('Ref with double quotes and no namespace', () => {
    const sql = '"test"';

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "test",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": true,
        "spacing": Object {},
        "table": undefined,
        "tableQuotes": false,
        "type": "ref",
      }
    `);
  });

  it('quotes', () => {
    const sql = `"page"`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "page",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": true,
        "spacing": Object {},
        "table": undefined,
        "tableQuotes": false,
        "type": "ref",
      }
    `);
  });

  it('without quotes', () => {
    const sql = `channel`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "channel",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": false,
        "spacing": Object {},
        "table": undefined,
        "tableQuotes": false,
        "type": "ref",
      }
    `);
  });

  it('without quotes + namespace', () => {
    const sql = `"lol" . channel`;

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "channel",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
        "quotes": false,
        "spacing": Object {
          "postTableDot": " ",
          "preTableDot": " ",
        },
        "table": "lol",
        "tableQuotes": true,
        "type": "ref",
      }
    `);
  });

  it('without quotes + namespace + parens', () => {
    const sql = `(( "lol" . channel)   )`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "channel",
        "keywords": Object {},
        "namespace": undefined,
        "namespaceQuotes": false,
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
        "quotes": false,
        "spacing": Object {
          "postTableDot": " ",
          "preTableDot": " ",
        },
        "table": "lol",
        "tableQuotes": true,
        "type": "ref",
      }
    `);
  });

  it('column.table.namespace', () => {
    const sql = `"lol"  .  channel  .  boo`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "boo",
        "keywords": Object {},
        "namespace": "lol",
        "namespaceQuotes": true,
        "quotes": false,
        "spacing": Object {
          "postNamespaceDot": "  ",
          "postTableDot": "  ",
          "preNamespaceDot": "  ",
          "preTableDot": "  ",
        },
        "table": "channel",
        "tableQuotes": false,
        "type": "ref",
      }
    `);
  });

  it('too many parts', () => {
    const sql = `"lol" . channel.boo .moo`;

    expect(() => SqlExpression.parse(sql)).toThrowError();
  });
});

describe('upgrades', () => {
  it('Ref with double quotes upgraded', () => {
    const sql = `"namespace"."table"`;

    expect((SqlExpression.parse(sql) as SqlRef).upgrade().toString()).toEqual(sql);

    expect((SqlExpression.parse(sql) as SqlRef).upgrade()).toMatchInlineSnapshot(`
      SqlRef {
        "column": undefined,
        "keywords": Object {},
        "namespace": "namespace",
        "namespaceQuotes": true,
        "quotes": false,
        "spacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "table": "table",
        "tableQuotes": true,
        "type": "ref",
      }
    `);
  });

  it('SqlRef in select should be upgraded', () => {
    const sql = `select tbl from sys.segments`;

    backAndForth(sql);

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "decorator": undefined,
        "explainPlanFor": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "as": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "keywords": Object {},
                  "namespace": "sys",
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {
                    "postTableDot": "",
                    "preTableDot": "",
                  },
                  "table": "segments",
                  "tableQuotes": false,
                  "type": "ref",
                },
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
            ],
          },
          "joinParts": undefined,
          "keywords": Object {
            "from": "from",
          },
          "spacing": Object {
            "postFrom": " ",
          },
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "keywords": Object {
          "select": "select",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "as": undefined,
              "expression": SqlRef {
                "column": "tbl",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "keywords": Object {},
              "spacing": Object {},
              "type": "alias",
            },
          ],
        },
        "spacing": Object {
          "postQuery": "",
          "postSelect": " ",
          "preFrom": " ",
          "preQuery": "",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
        "withParts": undefined,
      }
    `);
  });
});
