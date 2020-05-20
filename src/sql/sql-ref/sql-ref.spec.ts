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

import { parseSql, SqlRef } from '../../index';
import { backAndForth } from '../../test-utils';

describe('SqlRef', () => {
  it('Ref with double quotes and double quoted namespace', () => {
    const sql = '"test"."namespace"';

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "column": "namespace",
        "innerSpacing": Object {},
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
        "innerSpacing": Object {},
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
        "innerSpacing": Object {},
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
          "postTable": "",
          "preTable": "",
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
    const sql = `select table from sys.segments`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
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
        "orderBySeparators": undefined,
        "orderByUnits": undefined,
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "select",
        "selectSeparators": Array [],
        "selectValues": Array [
          SqlRef {
            "column": "table",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": "sys",
            "namespaceQuotes": "",
            "quotes": undefined,
            "table": "segments",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});
