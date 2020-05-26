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

import { parseSql, SqlRef } from '../../..';
import { backAndForth } from '../../../test-utils';

describe('SqlRef', () => {
  it('avoids reserved', () => {
    const sql = 'From';

    expect(() => parseSql(sql)).toThrowError('Expected');
  });

  it('Ref with double quotes and double quoted namespace', () => {
    const sql = '"test"."namespace"';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "namespace",
        "innerSpacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "\\"",
        "table": "test",
        "tableQuotes": "\\"",
        "type": "ref",
      }
    `);
  });

  it('Ref with double quotes and no quotes namespace', () => {
    const sql = '"test".namespace';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "namespace",
        "innerSpacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "",
        "table": "test",
        "tableQuotes": "\\"",
        "type": "ref",
      }
    `);
  });

  it('Ref with no quotes and namespace', () => {
    const sql = 'test.namespace';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "namespace",
        "innerSpacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "",
        "table": "test",
        "tableQuotes": "",
        "type": "ref",
      }
    `);
  });

  it('Ref with no quotes and no namespace', () => {
    const sql = 'test';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "test",
        "innerSpacing": Object {},
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "",
        "table": undefined,
        "tableQuotes": undefined,
        "type": "ref",
      }
    `);
  });

  it('Ref with double quotes and no namespace', () => {
    const sql = '"test"';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "test",
        "innerSpacing": Object {},
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "\\"",
        "table": undefined,
        "tableQuotes": undefined,
        "type": "ref",
      }
    `);
  });

  it('quotes', () => {
    const sql = `"page"`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "page",
        "innerSpacing": Object {},
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "\\"",
        "table": undefined,
        "tableQuotes": undefined,
        "type": "ref",
      }
    `);
  });

  it('without quotes', () => {
    const sql = `channel`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "channel",
        "innerSpacing": Object {},
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "",
        "table": undefined,
        "tableQuotes": undefined,
        "type": "ref",
      }
    `);
  });

  it('without quotes + namespace', () => {
    const sql = `"lol" . channel`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "column": "channel",
          "innerSpacing": Object {
            "postTableDot": " ",
            "preTableDot": " ",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": "lol",
          "tableQuotes": "\\"",
          "type": "ref",
        }
      `);
  });

  it('without quotes + namespace + parens', () => {
    const sql = `(( "lol" . channel)   )`;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "column": "channel",
          "innerSpacing": Object {
            "postTableDot": " ",
            "preTableDot": " ",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
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
          "quotes": "",
          "table": "lol",
          "tableQuotes": "\\"",
          "type": "ref",
        }
      `);
    expect(parseSql(sql).toRawString()).toMatchInlineSnapshot(`"\\"lol\\" . channel"`);
  });
});

describe('upgrades', () => {
  it('Ref with double quotes upgraded', () => {
    const sql = `"namespace"."table"`;

    expect((parseSql(sql) as SqlRef).upgrade().toString()).toEqual(sql);

    expect((parseSql(sql) as SqlRef).upgrade()).toMatchInlineSnapshot(`
      SqlRef {
        "column": undefined,
        "innerSpacing": Object {
          "postTableDot": "",
          "preTableDot": "",
        },
        "namespace": "namespace",
        "namespaceQuotes": "\\"",
        "quotes": undefined,
        "table": "table",
        "tableQuotes": "\\"",
        "type": "ref",
      }
    `);
  });

  it('SqlRef in select should be upgraded', () => {
    const sql = `select tbl from sys.segments`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "tbl",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "alias",
            },
          ],
        },
        "tables": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": undefined,
                "innerSpacing": Object {
                  "postTableDot": "",
                  "preTableDot": "",
                },
                "namespace": "sys",
                "namespaceQuotes": "",
                "quotes": undefined,
                "table": "segments",
                "tableQuotes": "",
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "alias",
            },
          ],
        },
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });
});
