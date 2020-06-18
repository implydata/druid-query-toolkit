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

import {
  parseSql,
  parseSqlExpression,
  parseSqlQuery,
  SqlCaseSearched,
  SqlFunction,
  SqlRef,
} from '../../index';
import { backAndForth, sane } from '../../test-utils';

describe('SqlQuery', () => {
  it('things that work', () => {
    const queries: string[] = [
      `Select notingham from tbl`,
      `Select 3`,
      `Select * from tbl`,
      `(Select * from tbl)`,
      `Select count(*) As sums from tbl`,
      sane`
        SELECT
          datasource d,
          SUM("size") AS total_size,
          CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size")  END AS avg_size,
          CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,
          COUNT(*) AS num_segments
        FROM sys.segments
      `,
      `SELECT * FROM wikipedia t`,
      `SELECT t.* FROM wikipedia t`,
      `SELECT *, page FROM wikipedia t`,
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        throw new Error(`problem with \`${sql}\`: ${e.message}`);
      }
    }
  });

  it('things that do not work', () => {
    const queries: string[] = [
      `Select notingham from table`,
      `Selec 3`,
      `(Select * from tbl`,
      `Select count(*) As count from tbl`,
    ];

    for (const sql of queries) {
      let didNotError = false;
      try {
        parseSqlQuery(sql);
        didNotError = true;
      } catch {}
      if (didNotError) {
        throw new Error(`should not parse: ${sql}`);
      }
    }
  });

  describe('#walk', () => {
    it('does a simple ref replace', () => {
      const sql = sane`
        SELECT
          datasource d,
          SUM("size") AS total_size,
          CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size,
          CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,
          COUNT(*) AS num_segments
        FROM sys.segments
        WHERE datasource IN ('moon', 'beam') AND 'druid' = schema 
        GROUP BY datasource
        HAVING total_size > 100
        ORDER BY datasource 
      `;

      expect(
        String(
          parseSql(sql).walk(x => {
            if (x instanceof SqlRef) {
              if (x.column && x.column !== '*') {
                return x.changeColumn(x.column + '_lol');
              }
            }
            return x;
          }),
        ),
      ).toMatchInlineSnapshot(`
        "SELECT
          datasource_lol d,
          SUM(\\"size_lol\\") AS total_size,
          CASE WHEN SUM(\\"size_lol\\") = 0 THEN 0 ELSE SUM(\\"size_lol\\") END AS avg_size,
          CASE WHEN SUM(num_rows_lol) = 0 THEN 0 ELSE SUM(\\"num_rows_lol\\") END AS avg_num_rows,
          COUNT(*) AS num_segments
        FROM sys.segments
        WHERE datasource_lol IN ('moon', 'beam') AND 'druid' = schema_lol 
        GROUP BY datasource_lol
        HAVING total_size_lol > 100
        ORDER BY datasource_lol "
      `);
    });

    it('does a replace with an if', () => {
      const sql = `SUM(t.added) / COUNT(DISTINCT t."user") + COUNT(*)`;

      const condition = parseSqlExpression(
        `__time BETWEEN TIMESTAMP '2020-01-01 01:00:00' AND TIMESTAMP '2020-01-01 02:00:00'`,
      );
      expect(
        String(
          parseSql(sql).walk(x => {
            if (x instanceof SqlRef) {
              if (x.column && x.table === 't') {
                return SqlCaseSearched.ifFactory(condition, x);
              }
            }
            if (x instanceof SqlFunction && x.isCountStar()) {
              return x.changeWhereExpression(condition);
            }
            return x;
          }),
        ),
      ).toMatchInlineSnapshot(
        `"SUM(CASE WHEN __time BETWEEN TIMESTAMP '2020-01-01 01:00:00' AND TIMESTAMP '2020-01-01 02:00:00' THEN t.added  END) / COUNT(DISTINCT CASE WHEN __time BETWEEN TIMESTAMP '2020-01-01 01:00:00' AND TIMESTAMP '2020-01-01 02:00:00' THEN t.\\"user\\"  END) + COUNT(*) FILTER (WHERE __time BETWEEN TIMESTAMP '2020-01-01 01:00:00' AND TIMESTAMP '2020-01-01 02:00:00')"`,
      );
    });
  });

  it('Simple subquery in from', () => {
    const sql = sane`
      SELECT * FROM (SELECT dim1 FROM druid.foo ORDER BY __time DESC) LIMIT 2
    `;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postLimitKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preLimitKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": "LIMIT",
        "limitValue": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
              "expression": SqlQuery {
                "explainKeyword": undefined,
                "fromKeyword": "FROM",
                "groupByExpressions": undefined,
                "groupByKeyword": undefined,
                "havingExpression": undefined,
                "havingKeyword": undefined,
                "innerSpacing": Object {
                  "postFrom": " ",
                  "postOrderByKeyword": " ",
                  "postQuery": "",
                  "postSelect": " ",
                  "postSelectDecorator": "",
                  "preFrom": " ",
                  "preOrderByKeyword": " ",
                  "preQuery": "",
                },
                "joinParts": undefined,
                "limitKeyword": undefined,
                "limitValue": undefined,
                "orderByKeyword": "ORDER BY",
                "orderByParts": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlOrderByPart {
                      "direction": "DESC",
                      "expression": SqlRef {
                        "column": "__time",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      "innerSpacing": Object {
                        "preDirection": " ",
                      },
                      "type": "orderByPart",
                    },
                  ],
                },
                "parens": Array [
                  Object {
                    "leftSpacing": "",
                    "rightSpacing": "",
                  },
                ],
                "selectDecorator": "",
                "selectKeyword": "SELECT",
                "selectValues": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlAlias {
                      "alias": undefined,
                      "asKeyword": undefined,
                      "expression": SqlRef {
                        "column": "dim1",
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
                        "namespace": "druid",
                        "namespaceQuotes": "",
                        "quotes": undefined,
                        "table": "foo",
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

  it('Simple select, cols with many cols and aliases', () => {
    const sql = sane`
      SELECT
        datasource,
        SUM("size") AS total_size,
        COUNT(*) AS num_segments
      FROM sys.segments
    `;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": "
        ",
          "postSelectDecorator": "",
          "preFrom": "
      ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectValues": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": "
        ",
              "separator": ",",
            },
            Separator {
              "left": "",
              "right": "
        ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "datasource",
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
            SqlAlias {
              "alias": SqlRef {
                "column": "total_size",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlFunction {
                "arguments": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlRef {
                      "column": "size",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "\\"",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                  ],
                },
                "decorator": undefined,
                "filterKeyword": undefined,
                "functionName": "SUM",
                "innerSpacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "special": undefined,
                "type": "function",
                "whereExpression": undefined,
                "whereKeyword": undefined,
              },
              "innerSpacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
              "type": "alias",
            },
            SqlAlias {
              "alias": SqlRef {
                "column": "num_segments",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlFunction {
                "arguments": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlRef {
                      "column": "*",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                  ],
                },
                "decorator": undefined,
                "filterKeyword": undefined,
                "functionName": "COUNT",
                "innerSpacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "special": undefined,
                "type": "function",
                "whereExpression": undefined,
                "whereKeyword": undefined,
              },
              "innerSpacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
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

  it('Simple select with Explain', () => {
    const sql = `Explain plan for Select * from tbl`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "Explain plan for",
        "fromKeyword": "from",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": " ",
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select with With', () => {
    const sql = sane`
      WITH dept_count AS (
        SELECT deptno
        FROM   emp)
      Select * from tbl
    `;

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
          "postWith": " ",
          "postWithQuery": "
      ",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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
        "withKeyword": "WITH",
        "withParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlWithPart {
              "asKeyword": "AS",
              "innerSpacing": Object {
                "postAs": " ",
                "postWithTable": " ",
              },
              "postWithColumns": undefined,
              "type": "withPart",
              "withColumns": undefined,
              "withQuery": SqlQuery {
                "explainKeyword": undefined,
                "fromKeyword": "FROM",
                "groupByExpressions": undefined,
                "groupByKeyword": undefined,
                "havingExpression": undefined,
                "havingKeyword": undefined,
                "innerSpacing": Object {
                  "postFrom": "   ",
                  "postQuery": "",
                  "postSelect": " ",
                  "postSelectDecorator": "",
                  "preFrom": "
        ",
                  "preQuery": "",
                },
                "joinParts": undefined,
                "limitKeyword": undefined,
                "limitValue": undefined,
                "orderByKeyword": undefined,
                "orderByParts": undefined,
                "parens": Array [
                  Object {
                    "leftSpacing": "
        ",
                    "rightSpacing": "",
                  },
                ],
                "selectDecorator": "",
                "selectKeyword": "SELECT",
                "selectValues": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlAlias {
                      "alias": undefined,
                      "asKeyword": undefined,
                      "expression": SqlRef {
                        "column": "deptno",
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
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": undefined,
                        "table": "emp",
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
              },
              "withTable": SqlRef {
                "column": "dept_count",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
            },
          ],
        },
      }
    `);
  });
});

describe('expressions with where clause', () => {
  it('Simple select with where', () => {
    const sql = `Select * from tbl where col > 1`;

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
          "postWhereKeyword": " ",
          "preFrom": " ",
          "preQuery": "",
          "preWhereKeyword": " ",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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
        "whereExpression": SqlComparison {
          "innerSpacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "lhs": SqlRef {
            "column": "col",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          "notKeyword": undefined,
          "op": ">",
          "rhs": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          "type": "comparison",
        },
        "whereKeyword": "where",
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });

  it('Simple select with equals', () => {
    const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postWhereKeyword": " ",
          "preFrom": " ",
          "preQuery": "",
          "preWhereKeyword": " ",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "table": "supervisors",
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
        "whereExpression": SqlComparison {
          "innerSpacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "lhs": SqlRef {
            "column": "healthy",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          "notKeyword": undefined,
          "op": "=",
          "rhs": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "0",
            "type": "literal",
            "value": 0,
          },
          "type": "comparison",
        },
        "whereKeyword": "WHERE",
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });

  it('Simple select with many', () => {
    const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0 and col > 100 or otherColumn = 'value'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postWhereKeyword": " ",
          "preFrom": " ",
          "preQuery": "",
          "preWhereKeyword": " ",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "table": "supervisors",
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
        "whereExpression": SqlMulti {
          "arguments": SeparatedArray {
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "or",
              },
            ],
            "values": Array [
              SqlMulti {
                "arguments": SeparatedArray {
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": "and",
                    },
                  ],
                  "values": Array [
                    SqlComparison {
                      "innerSpacing": Object {
                        "postOp": " ",
                        "preOp": " ",
                      },
                      "lhs": SqlRef {
                        "column": "healthy",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      "notKeyword": undefined,
                      "op": "=",
                      "rhs": SqlLiteral {
                        "innerSpacing": Object {},
                        "keyword": undefined,
                        "stringValue": "0",
                        "type": "literal",
                        "value": 0,
                      },
                      "type": "comparison",
                    },
                    SqlComparison {
                      "innerSpacing": Object {
                        "postOp": " ",
                        "preOp": " ",
                      },
                      "lhs": SqlRef {
                        "column": "col",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      "notKeyword": undefined,
                      "op": ">",
                      "rhs": SqlLiteral {
                        "innerSpacing": Object {},
                        "keyword": undefined,
                        "stringValue": "100",
                        "type": "literal",
                        "value": 100,
                      },
                      "type": "comparison",
                    },
                  ],
                },
                "expressionType": "AND",
                "innerSpacing": Object {},
                "type": "multi",
              },
              SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "otherColumn",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "'value'",
                  "type": "literal",
                  "value": "value",
                },
                "type": "comparison",
              },
            ],
          },
          "expressionType": "OR",
          "innerSpacing": Object {},
          "type": "multi",
        },
        "whereKeyword": "WHERE",
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });
});

describe('expressions with group by clause', () => {
  it('Simple select with group by ', () => {
    const sql = `Select * from tbl group by col`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "col",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
          ],
        },
        "groupByKeyword": "group by",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preGroupByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select with group by ', () => {
    const sql = `Select * from tbl group by col`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "col",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
          ],
        },
        "groupByKeyword": "group by",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preGroupByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select with multiple group by clauses in brackets', () => {
    const sql = `(Select * from tbl group by col, colTwo)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpressions": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlRef {
              "column": "col",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            SqlRef {
              "column": "colTwo",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
          ],
        },
        "groupByKeyword": "group by",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preGroupByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

describe('expressions with having clause', () => {
  it('Simple select with where', () => {
    const sql = `Select * from tbl having col > 1`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": SqlComparison {
          "innerSpacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "lhs": SqlRef {
            "column": "col",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          "notKeyword": undefined,
          "op": ">",
          "rhs": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "1",
            "type": "literal",
            "value": 1,
          },
          "type": "comparison",
        },
        "havingKeyword": "having",
        "innerSpacing": Object {
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preHavingKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select with equals', () => {
    const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": SqlComparison {
          "innerSpacing": Object {
            "postOp": " ",
            "preOp": " ",
          },
          "lhs": SqlRef {
            "column": "healthy",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          "notKeyword": undefined,
          "op": "=",
          "rhs": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "0",
            "type": "literal",
            "value": 0,
          },
          "type": "comparison",
        },
        "havingKeyword": "HAVING",
        "innerSpacing": Object {
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preHavingKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "table": "supervisors",
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

  it('Simple select with many', () => {
    const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0 and col > 100 or otherColumn = 'value'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpressions": undefined,
        "groupByKeyword": undefined,
        "havingExpression": SqlMulti {
          "arguments": SeparatedArray {
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "or",
              },
            ],
            "values": Array [
              SqlMulti {
                "arguments": SeparatedArray {
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": "and",
                    },
                  ],
                  "values": Array [
                    SqlComparison {
                      "innerSpacing": Object {
                        "postOp": " ",
                        "preOp": " ",
                      },
                      "lhs": SqlRef {
                        "column": "healthy",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      "notKeyword": undefined,
                      "op": "=",
                      "rhs": SqlLiteral {
                        "innerSpacing": Object {},
                        "keyword": undefined,
                        "stringValue": "0",
                        "type": "literal",
                        "value": 0,
                      },
                      "type": "comparison",
                    },
                    SqlComparison {
                      "innerSpacing": Object {
                        "postOp": " ",
                        "preOp": " ",
                      },
                      "lhs": SqlRef {
                        "column": "col",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      "notKeyword": undefined,
                      "op": ">",
                      "rhs": SqlLiteral {
                        "innerSpacing": Object {},
                        "keyword": undefined,
                        "stringValue": "100",
                        "type": "literal",
                        "value": 100,
                      },
                      "type": "comparison",
                    },
                  ],
                },
                "expressionType": "AND",
                "innerSpacing": Object {},
                "type": "multi",
              },
              SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "otherColumn",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "'value'",
                  "type": "literal",
                  "value": "value",
                },
                "type": "comparison",
              },
            ],
          },
          "expressionType": "OR",
          "innerSpacing": Object {},
          "type": "multi",
        },
        "havingKeyword": "HAVING",
        "innerSpacing": Object {
          "postFrom": " ",
          "postHavingKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preHavingKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "table": "supervisors",
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

describe('expressions with order by clause', () => {
  it('Simple select with number order by', () => {
    const sql = `Select col from tbl order by 1`;

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
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderByParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlOrderByPart {
              "direction": undefined,
              "expression": SqlLiteral {
                "innerSpacing": Object {},
                "keyword": undefined,
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
              "innerSpacing": Object {},
              "type": "orderByPart",
            },
          ],
        },
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "col",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select with ref order by', () => {
    const sql = `Select col from tbl order by col`;

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
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderByParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlOrderByPart {
              "direction": undefined,
              "expression": SqlRef {
                "column": "col",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "orderByPart",
            },
          ],
        },
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "col",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select with number order by and direction', () => {
    const sql = `Select col from tbl order by 1 Asc`;

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
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderByParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlOrderByPart {
              "direction": "Asc",
              "expression": SqlLiteral {
                "innerSpacing": Object {},
                "keyword": undefined,
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
              "innerSpacing": Object {
                "preDirection": " ",
              },
              "type": "orderByPart",
            },
          ],
        },
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "col",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select with ref order by and direction', () => {
    const sql = `Select col, colTwo from tbl order by col DESC`;

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
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderByParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlOrderByPart {
              "direction": "DESC",
              "expression": SqlRef {
                "column": "col",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "innerSpacing": Object {
                "preDirection": " ",
              },
              "type": "orderByPart",
            },
          ],
        },
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "col",
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
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "colTwo",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select ordered on multiple cols 1', () => {
    const sql = `Select col from tbl order by 1 ASC, col`;

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
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderByParts": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlOrderByPart {
              "direction": "ASC",
              "expression": SqlLiteral {
                "innerSpacing": Object {},
                "keyword": undefined,
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
              "innerSpacing": Object {
                "preDirection": " ",
              },
              "type": "orderByPart",
            },
            SqlOrderByPart {
              "direction": undefined,
              "expression": SqlRef {
                "column": "col",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "orderByPart",
            },
          ],
        },
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "col",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Simple select ordered on multiple cols 2', () => {
    const sql = `Select col, colTwo from tbl order by 1 ASC, col DESC`;

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
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preOrderByKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderByParts": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlOrderByPart {
              "direction": "ASC",
              "expression": SqlLiteral {
                "innerSpacing": Object {},
                "keyword": undefined,
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
              "innerSpacing": Object {
                "preDirection": " ",
              },
              "type": "orderByPart",
            },
            SqlOrderByPart {
              "direction": "DESC",
              "expression": SqlRef {
                "column": "col",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "innerSpacing": Object {
                "preDirection": " ",
              },
              "type": "orderByPart",
            },
          ],
        },
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": " ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "col",
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
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "colTwo",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

describe('expressions with limit clause', () => {
  it('Simple select with limit', () => {
    const sql = `Select * from tbl limit 1`;

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
          "postLimitKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preLimitKeyword": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": "limit",
        "limitValue": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

describe('expressions with union clause', () => {
  it('Simple select with union all ', () => {
    const sql = `Select * from tbl union all select * from otherTable`;

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
          "postUnionKeyword": " ",
          "preFrom": " ",
          "preQuery": "",
          "preUnionKeyword": " ",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
                "tableQuotes": "",
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "alias",
            },
          ],
        },
        "type": "query",
        "unionKeyword": "union all",
        "unionQuery": SqlQuery {
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
          "joinParts": undefined,
          "limitKeyword": undefined,
          "limitValue": undefined,
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
                  "column": "*",
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
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "otherTable",
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
        },
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });
});

describe('Join Clause', () => {
  it('Inner join', () => {
    const sql = 'Select * from tbl INNER Join anotherTable ON col = col';

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
          "preJoin": " ",
          "preQuery": "",
        },
        "joinParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlJoinPart {
              "innerSpacing": Object {
                "postJoinKeywordSpacing": " ",
                "postJoinTypeSpacing": " ",
                "postOnSpacing": " ",
                "preOnKeywordSpacing": " ",
              },
              "joinKeyword": "Join",
              "joinType": "INNER",
              "onExpression": SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "type": "comparison",
              },
              "onKeyword": "ON",
              "table": SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "anotherTable",
                  "tableQuotes": "",
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
              "type": "joinPart",
            },
          ],
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Left join', () => {
    const sql = 'Select * from tbl Left Join anotherTable ON col = col';

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
          "preJoin": " ",
          "preQuery": "",
        },
        "joinParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlJoinPart {
              "innerSpacing": Object {
                "postJoinKeywordSpacing": " ",
                "postJoinTypeSpacing": " ",
                "postOnSpacing": " ",
                "preOnKeywordSpacing": " ",
              },
              "joinKeyword": "Join",
              "joinType": "Left",
              "onExpression": SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "type": "comparison",
              },
              "onKeyword": "ON",
              "table": SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "anotherTable",
                  "tableQuotes": "",
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
              "type": "joinPart",
            },
          ],
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Right join', () => {
    const sql = 'Select * from tbl RIGHT Join anotherTable ON col = col';

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
          "preJoin": " ",
          "preQuery": "",
        },
        "joinParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlJoinPart {
              "innerSpacing": Object {
                "postJoinKeywordSpacing": " ",
                "postJoinTypeSpacing": " ",
                "postOnSpacing": " ",
                "preOnKeywordSpacing": " ",
              },
              "joinKeyword": "Join",
              "joinType": "RIGHT",
              "onExpression": SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "type": "comparison",
              },
              "onKeyword": "ON",
              "table": SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "anotherTable",
                  "tableQuotes": "",
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
              "type": "joinPart",
            },
          ],
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Full join', () => {
    const sql = 'Select * from tbl FULL Join anotherTable ON col = col';

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
          "preJoin": " ",
          "preQuery": "",
        },
        "joinParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlJoinPart {
              "innerSpacing": Object {
                "postJoinKeywordSpacing": " ",
                "postJoinTypeSpacing": " ",
                "postOnSpacing": " ",
                "preOnKeywordSpacing": " ",
              },
              "joinKeyword": "Join",
              "joinType": "FULL",
              "onExpression": SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "type": "comparison",
              },
              "onKeyword": "ON",
              "table": SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "anotherTable",
                  "tableQuotes": "",
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
              "type": "joinPart",
            },
          ],
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('Full Outer join', () => {
    const sql = 'Select * from tbl FULL OUTER Join anotherTable ON col = col';

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
          "preJoin": " ",
          "preQuery": "",
        },
        "joinParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlJoinPart {
              "innerSpacing": Object {
                "postJoinKeywordSpacing": " ",
                "postJoinTypeSpacing": " ",
                "postOnSpacing": " ",
                "preOnKeywordSpacing": " ",
              },
              "joinKeyword": "Join",
              "joinType": "FULL OUTER",
              "onExpression": SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "type": "comparison",
              },
              "onKeyword": "ON",
              "table": SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": undefined,
                  "table": "anotherTable",
                  "tableQuotes": "",
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
              "type": "joinPart",
            },
          ],
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

describe('Queries with comments', () => {
  it('single comment', () => {
    const sql = sane`
      Select -- some comment 
      col from tbl
    `;

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
          "postSelect": " -- some comment 
      ",
          "postSelectDecorator": "",
          "preFrom": " ",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": undefined,
        "orderByParts": undefined,
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectValues": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "col",
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "tbl",
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

  it('two comments', () => {
    const sql = sane`
      Select --some comment
        --some comment
      col from tbl
    `;

    backAndForth(sql);
  });

  it('comment on new line', () => {
    const sql = sane`
      Select
        -- some comment
      col from tbl
    `;

    backAndForth(sql);
  });

  it('comment containing hyphens', () => {
    const sql = sane`
      Select
        -- some--comment
        col from tbl
    `;

    backAndForth(sql);
  });

  it('comment with no space', () => {
    const sql = sane`
      Select --some comment
      col from tbl
    `;

    backAndForth(sql);
  });

  it('comment with non english', () => {
    const sql = sane`
      Select --Здравствуйте
      col from tbl
    `;

    backAndForth(sql);
  });

  it('comment at end of query', () => {
    const sql = sane`
      Select 
      col from tbl
      -- comment
    `;

    backAndForth(sql);
  });

  it('comment with unary negative', () => {
    const sql = sane`
      Select 
      col from tbl
      -- comment
      order by -1
    `;

    backAndForth(sql);
  });
});

describe('No spacing', () => {
  it('Expression with no spacing', () => {
    const sql = `SELECT"channel",COUNT(*)AS"Count",COUNT(DISTINCT"cityName")AS"dist_cityName"FROM"wiki"GROUP BY"channel"ORDER BY"Count"DESC`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlRef {
              "column": "channel",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "\\"",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
          ],
        },
        "groupByKeyword": "GROUP BY",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": "",
          "postGroupByKeyword": "",
          "postOrderByKeyword": "",
          "postQuery": "",
          "postSelect": "",
          "postSelectDecorator": "",
          "preFrom": "",
          "preGroupByKeyword": "",
          "preOrderByKeyword": "",
          "preQuery": "",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "ORDER BY",
        "orderByParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlOrderByPart {
              "direction": "DESC",
              "expression": SqlRef {
                "column": "Count",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "\\"",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "innerSpacing": Object {
                "preDirection": "",
              },
              "type": "orderByPart",
            },
          ],
        },
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectValues": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": "",
              "separator": ",",
            },
            Separator {
              "left": "",
              "right": "",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "channel",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "\\"",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "alias",
            },
            SqlAlias {
              "alias": SqlRef {
                "column": "Count",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "\\"",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlFunction {
                "arguments": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlRef {
                      "column": "*",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                  ],
                },
                "decorator": undefined,
                "filterKeyword": undefined,
                "functionName": "COUNT",
                "innerSpacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "special": undefined,
                "type": "function",
                "whereExpression": undefined,
                "whereKeyword": undefined,
              },
              "innerSpacing": Object {
                "preAlias": "",
                "preAs": "",
              },
              "type": "alias",
            },
            SqlAlias {
              "alias": SqlRef {
                "column": "dist_cityName",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "\\"",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlFunction {
                "arguments": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlRef {
                      "column": "cityName",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "\\"",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                  ],
                },
                "decorator": "DISTINCT",
                "filterKeyword": undefined,
                "functionName": "COUNT",
                "innerSpacing": Object {
                  "postArguments": "",
                  "postDecorator": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "special": undefined,
                "type": "function",
                "whereExpression": undefined,
                "whereKeyword": undefined,
              },
              "innerSpacing": Object {
                "preAlias": "",
                "preAs": "",
              },
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "wiki",
                "tableQuotes": "\\"",
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

describe('Extra', () => {
  it('CURRENT_TIMESTAMP and Dynamic', () => {
    const sql = sane`
      SELECT
        CAST("channel" AS VARCHAR) AS "channel",
        COUNT(*) AS "Count"
      FROM "wikipedia"
      WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND cityName = ?
      GROUP BY 1
      ORDER BY "Count" DESC
    `;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "FROM",
        "groupByExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
          ],
        },
        "groupByKeyword": "GROUP BY",
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": "
        ",
          "postSelectDecorator": "",
          "postWhereKeyword": " ",
          "preFrom": "
      ",
          "preGroupByKeyword": "
      ",
          "preOrderByKeyword": "
      ",
          "preQuery": "",
          "preWhereKeyword": "
      ",
        },
        "joinParts": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "ORDER BY",
        "orderByParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlOrderByPart {
              "direction": "DESC",
              "expression": SqlRef {
                "column": "Count",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "\\"",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "innerSpacing": Object {
                "preDirection": " ",
              },
              "type": "orderByPart",
            },
          ],
        },
        "selectDecorator": "",
        "selectKeyword": "SELECT",
        "selectValues": SeparatedArray {
          "separators": Array [
            Separator {
              "left": "",
              "right": "
        ",
              "separator": ",",
            },
          ],
          "values": Array [
            SqlAlias {
              "alias": SqlRef {
                "column": "channel",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "\\"",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlFunction {
                "arguments": SeparatedArray {
                  "separators": Array [
                    Separator {
                      "left": " ",
                      "right": " ",
                      "separator": "AS",
                    },
                  ],
                  "values": Array [
                    SqlRef {
                      "column": "channel",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "\\"",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                    SqlLiteral {
                      "innerSpacing": Object {},
                      "keyword": undefined,
                      "stringValue": "VARCHAR",
                      "type": "literal",
                      "value": "VARCHAR",
                    },
                  ],
                },
                "decorator": undefined,
                "filterKeyword": undefined,
                "functionName": "CAST",
                "innerSpacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "special": undefined,
                "type": "function",
                "whereExpression": undefined,
                "whereKeyword": undefined,
              },
              "innerSpacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
              "type": "alias",
            },
            SqlAlias {
              "alias": SqlRef {
                "column": "Count",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "\\"",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlFunction {
                "arguments": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlRef {
                      "column": "*",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": undefined,
                      "quotes": "",
                      "table": undefined,
                      "tableQuotes": undefined,
                      "type": "ref",
                    },
                  ],
                },
                "decorator": undefined,
                "filterKeyword": undefined,
                "functionName": "COUNT",
                "innerSpacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "special": undefined,
                "type": "function",
                "whereExpression": undefined,
                "whereKeyword": undefined,
              },
              "innerSpacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
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
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": undefined,
                "table": "wikipedia",
                "tableQuotes": "\\"",
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
        "whereExpression": SqlMulti {
          "arguments": SeparatedArray {
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "AND",
              },
            ],
            "values": Array [
              SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "__time",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "\\"",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": ">=",
                "rhs": SqlMulti {
                  "arguments": SeparatedArray {
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "-",
                      },
                    ],
                    "values": Array [
                      SqlFunction {
                        "arguments": undefined,
                        "decorator": undefined,
                        "filterKeyword": undefined,
                        "functionName": "CURRENT_TIMESTAMP",
                        "innerSpacing": Object {},
                        "special": true,
                        "type": "function",
                        "whereExpression": undefined,
                        "whereKeyword": undefined,
                      },
                      SqlInterval {
                        "innerSpacing": Object {
                          "postIntervalKeyword": " ",
                          "postIntervalValue": " ",
                        },
                        "intervalKeyword": "INTERVAL",
                        "intervalValue": SqlLiteral {
                          "innerSpacing": Object {},
                          "keyword": undefined,
                          "stringValue": "'1'",
                          "type": "literal",
                          "value": "1",
                        },
                        "type": "interval",
                        "unitKeyword": "DAY",
                      },
                    ],
                  },
                  "expressionType": "Additive",
                  "innerSpacing": Object {},
                  "type": "multi",
                },
                "type": "comparison",
              },
              SqlComparison {
                "innerSpacing": Object {
                  "postOp": " ",
                  "preOp": " ",
                },
                "lhs": SqlRef {
                  "column": "cityName",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
                "notKeyword": undefined,
                "op": "=",
                "rhs": SqlLiteral {
                  "innerSpacing": Object {},
                  "keyword": undefined,
                  "stringValue": "?",
                  "type": "literal",
                  "value": "?",
                },
                "type": "comparison",
              },
            ],
          },
          "expressionType": "AND",
          "innerSpacing": Object {},
          "type": "multi",
        },
        "whereKeyword": "WHERE",
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });
});
