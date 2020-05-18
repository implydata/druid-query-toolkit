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

import { sqlParserFactory } from '../../index';
import { backAndForth } from '../../test-utils';

const parser = sqlParserFactory();

describe('SqlRef', () => {
  it('Ref with double quotes and double quoted namespace', () => {
    const sql = '"test"."namespace"';

    backAndForth(sql);

    expect(parser(sql)).toMatchInlineSnapshot(`
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

    expect(parser(sql)).toMatchInlineSnapshot(`
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

    expect(parser(sql)).toMatchInlineSnapshot(`
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

    expect(parser(sql)).toMatchInlineSnapshot(`
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

    expect(parser(sql)).toMatchInlineSnapshot(`
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
});

describe('upgrades', () => {
  it('Ref with double quotes upgraded', () => {
    const sql = `"namespace"."table"`;

    expect(
      parser(sql)
        .upgrade()
        .toString(),
    ).toMatch(sql);

    expect(parser(sql).upgrade()).toMatchInlineSnapshot(`
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

    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postJoinKeyword": "",
          "postJoinTable": "",
          "postJoinType": "",
          "postLimitKeyword": "",
          "postOn": "",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preJoin": "",
          "preLimitKeyword": "",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
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
