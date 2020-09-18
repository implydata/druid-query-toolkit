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

import { SqlCase, SqlExpression, SqlFunction, SqlQuery, SqlRef } from '../..';
import { backAndForth, sane } from '../../test-utils';

describe('SqlQuery', () => {
  it('things that work', () => {
    const queries: string[] = [
      `Select notingham from tbl`,
      `Select 3`,
      `Select * from tbl`,
      `Select * from tbl Limit 10`,
      `Select * from tbl Limit 10 offset 5`,
      `(Select * from tbl)`,
      `Select count(*) As sums from tbl`,
      `Select count(*) As sums from tbl GROUP BY ()`,
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
      `SELECT DISTINCT a, b FROM wikipedia t`,
      `SELECT ALL a, b FROM wikipedia t`,
      sane`
        SELECT
          flags, channel, user, page,
          SUM(sum_added) AS Added
        FROM wikipedia
        GROUP BY 1, 2, 3, 4
        ORDER BY 4 DESC
      `,
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
      // `SELECT 1 AS user`,
    ];

    for (const sql of queries) {
      let didNotError = false;
      try {
        SqlQuery.parse(sql);
        didNotError = true;
      } catch {}
      if (didNotError) {
        throw new Error(`should not parse: ${sql}`);
      }
    }
  });

  describe('.create', () => {
    it('works', () => {
      expect(String(SqlQuery.create(SqlRef.table('lol')))).toEqual(sane`
        SELECT *
        FROM lol
      `);
    });

    it('works in advanced case', () => {
      const query = SqlQuery.create(SqlRef.table('lol'))
        .changeSelectExpressions([
          SqlRef.column('channel').as(),
          SqlRef.column('page').as(),
          SqlRef.column('user').as(),
        ])
        .changeWhereExpression(`channel  =  '#en.wikipedia'`);

      expect(String(query)).toEqual(sane`
        SELECT channel, page, "user"
        FROM lol
        WHERE channel  =  '#en.wikipedia'
      `);
    });
  });

  describe('.parse', () => {
    it('parse queries only', () => {
      expect(() => SqlQuery.parse('a OR b')).toThrowErrorMatchingInlineSnapshot(
        `"Provided SQL was not a query"`,
      );
    });
  });

  describe('.isPhonyOutputName', () => {
    it('works', () => {
      expect(SqlQuery.isPhonyOutputName('EXPR$0')).toEqual(true);
      expect(SqlQuery.isPhonyOutputName('EXPR$12')).toEqual(true);
      expect(SqlQuery.isPhonyOutputName('EXPR$01')).toEqual(false);
      expect(SqlQuery.isPhonyOutputName('expr$')).toEqual(false);
    });
  });

  describe('#walk', () => {
    const sqlMaster = SqlQuery.parseSql(sane`
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
      ORDER BY datasource DESC, 2 ASC
      LIMIT 100
    `);

    it('does a simple ref replace', () => {
      expect(
        String(
          sqlMaster.walk(x => {
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
        ORDER BY datasource_lol DESC, 2 ASC
        LIMIT 100"
      `);
    });

    it('has correct walk order', () => {
      const parts: string[] = [];
      sqlMaster.walk(x => {
        parts.push(x.toString());
        return x;
      });

      expect(parts).toEqual([
        'SELECT\n  datasource d,\n  SUM("size") AS total_size,\n  CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size,\n  CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE datasource IN (\'moon\', \'beam\') AND \'druid\' = schema \nGROUP BY datasource\nHAVING total_size > 100\nORDER BY datasource DESC, 2 ASC\nLIMIT 100',
        'datasource d',
        'datasource',
        'SUM("size") AS total_size',
        'SUM("size")',
        '"size"',
        'CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size',
        'CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END',
        'WHEN SUM("size") = 0 THEN 0',
        'SUM("size") = 0',
        'SUM("size")',
        '"size"',
        '0',
        '0',
        'SUM("size")',
        '"size"',
        'CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows',
        'CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END',
        'WHEN SUM(num_rows) = 0 THEN 0',
        'SUM(num_rows) = 0',
        'SUM(num_rows)',
        'num_rows',
        '0',
        '0',
        'SUM("num_rows")',
        '"num_rows"',
        'COUNT(*) AS num_segments',
        'COUNT(*)',
        '*',
        'FROM sys.segments',
        'sys.segments',
        'sys.segments',
        "WHERE datasource IN ('moon', 'beam') AND 'druid' = schema",
        "datasource IN ('moon', 'beam') AND 'druid' = schema",
        "datasource IN ('moon', 'beam')",
        'datasource',
        "('moon', 'beam')",
        "'druid' = schema",
        "'druid'",
        'schema',
        'GROUP BY datasource',
        'datasource',
        'HAVING total_size > 100',
        'total_size > 100',
        'total_size',
        '100',
        'ORDER BY datasource DESC, 2 ASC',
        'datasource DESC',
        'datasource',
        '2 ASC',
        '2',
        'LIMIT 100',
        '100',
      ]);
    });

    it('has correct walk postorder order', () => {
      const parts: string[] = [];
      sqlMaster.walkPostorder(x => {
        parts.push(x.toString());
        return x;
      });

      expect(parts).toEqual([
        'datasource',
        'datasource d',
        '"size"',
        'SUM("size")',
        'SUM("size") AS total_size',
        '"size"',
        'SUM("size")',
        '0',
        'SUM("size") = 0',
        '0',
        'WHEN SUM("size") = 0 THEN 0',
        '"size"',
        'SUM("size")',
        'CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END',
        'CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size',
        'num_rows',
        'SUM(num_rows)',
        '0',
        'SUM(num_rows) = 0',
        '0',
        'WHEN SUM(num_rows) = 0 THEN 0',
        '"num_rows"',
        'SUM("num_rows")',
        'CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END',
        'CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows',
        '*',
        'COUNT(*)',
        'COUNT(*) AS num_segments',
        'sys.segments',
        'sys.segments',
        'FROM sys.segments',
        'datasource',
        "('moon', 'beam')",
        "datasource IN ('moon', 'beam')",
        "'druid'",
        'schema',
        "'druid' = schema",
        "datasource IN ('moon', 'beam') AND 'druid' = schema",
        "WHERE datasource IN ('moon', 'beam') AND 'druid' = schema",
        'datasource',
        'GROUP BY datasource',
        'total_size',
        '100',
        'total_size > 100',
        'HAVING total_size > 100',
        'datasource',
        'datasource DESC',
        '2',
        '2 ASC',
        'ORDER BY datasource DESC, 2 ASC',
        '100',
        'LIMIT 100',
        'SELECT\n  datasource d,\n  SUM("size") AS total_size,\n  CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size,\n  CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE datasource IN (\'moon\', \'beam\') AND \'druid\' = schema \nGROUP BY datasource\nHAVING total_size > 100\nORDER BY datasource DESC, 2 ASC\nLIMIT 100',
      ]);
    });

    it('has correct walk postorder order modify', () => {
      const parts: string[] = [];
      sqlMaster.walkPostorder(x => {
        parts.push(x.toString());
        if (x instanceof SqlRef && !x.isStar() && x.column) {
          return x.changeColumn(`_${x.column}_`);
        }
        return x;
      });

      expect(parts).toEqual([
        'datasource',
        '_datasource_ d',
        '"size"',
        'SUM("_size_")',
        'SUM("_size_") AS total_size',
        '"size"',
        'SUM("_size_")',
        '0',
        'SUM("_size_") = 0',
        '0',
        'WHEN SUM("_size_") = 0 THEN 0',
        '"size"',
        'SUM("_size_")',
        'CASE WHEN SUM("_size_") = 0 THEN 0 ELSE SUM("_size_") END',
        'CASE WHEN SUM("_size_") = 0 THEN 0 ELSE SUM("_size_") END AS avg_size',
        'num_rows',
        'SUM(_num_rows_)',
        '0',
        'SUM(_num_rows_) = 0',
        '0',
        'WHEN SUM(_num_rows_) = 0 THEN 0',
        '"num_rows"',
        'SUM("_num_rows_")',
        'CASE WHEN SUM(_num_rows_) = 0 THEN 0 ELSE SUM("_num_rows_") END',
        'CASE WHEN SUM(_num_rows_) = 0 THEN 0 ELSE SUM("_num_rows_") END AS avg_num_rows',
        '*',
        'COUNT(*)',
        'COUNT(*) AS num_segments',
        'sys.segments',
        'sys.segments',
        'FROM sys.segments',
        'datasource',
        "('moon', 'beam')",
        "_datasource_ IN ('moon', 'beam')",
        "'druid'",
        'schema',
        "'druid' = _schema_",
        "_datasource_ IN ('moon', 'beam') AND 'druid' = _schema_",
        "WHERE _datasource_ IN ('moon', 'beam') AND 'druid' = _schema_",
        'datasource',
        'GROUP BY _datasource_',
        'total_size',
        '100',
        '_total_size_ > 100',
        'HAVING _total_size_ > 100',
        'datasource',
        '_datasource_ DESC',
        '2',
        '2 ASC',
        'ORDER BY _datasource_ DESC, 2 ASC',
        '100',
        'LIMIT 100',
        'SELECT\n  _datasource_ d,\n  SUM("_size_") AS total_size,\n  CASE WHEN SUM("_size_") = 0 THEN 0 ELSE SUM("_size_") END AS avg_size,\n  CASE WHEN SUM(_num_rows_) = 0 THEN 0 ELSE SUM("_num_rows_") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE _datasource_ IN (\'moon\', \'beam\') AND \'druid\' = _schema_ \nGROUP BY _datasource_\nHAVING _total_size_ > 100\nORDER BY _datasource_ DESC, 2 ASC\nLIMIT 100',
      ]);
    });

    it('walks with stack', () => {
      let foundStack: string[] | undefined;
      sqlMaster.walk((x, stack) => {
        if (String(x) === 'schema') {
          foundStack = stack.map(String);
        }
        return x;
      });

      expect(foundStack).toEqual([
        "'druid' = schema",
        "datasource IN ('moon', 'beam') AND 'druid' = schema",
        "WHERE datasource IN ('moon', 'beam') AND 'druid' = schema",
        'SELECT\n  datasource d,\n  SUM("size") AS total_size,\n  CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size,\n  CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE datasource IN (\'moon\', \'beam\') AND \'druid\' = schema \nGROUP BY datasource\nHAVING total_size > 100\nORDER BY datasource DESC, 2 ASC\nLIMIT 100',
      ]);
    });
  });

  it('does a replace with an if', () => {
    const sql = `SUM(t.added) / COUNT(DISTINCT t."user") + COUNT(*)`;

    const condition = SqlExpression.parse(
      `__time BETWEEN TIMESTAMP '2020-01-01 01:00:00' AND TIMESTAMP '2020-01-01 02:00:00'`,
    );
    expect(
      String(
        SqlExpression.parse(sql).walk(x => {
          if (x instanceof SqlRef) {
            if (x.column && x.table === 't') {
              return SqlCase.ifThenElse(condition, x);
            }
          }
          if (x instanceof SqlFunction && x.isCountStar()) {
            return x.changeWhereExpression(condition);
          }
          return x;
        }),
      ),
    ).toMatchInlineSnapshot(
      `"SUM(CASE WHEN __time BETWEEN TIMESTAMP '2020-01-01 01:00:00' AND TIMESTAMP '2020-01-01 02:00:00' THEN t.added END) / COUNT(DISTINCT CASE WHEN __time BETWEEN TIMESTAMP '2020-01-01 01:00:00' AND TIMESTAMP '2020-01-01 02:00:00' THEN t.\\"user\\" END) + COUNT(*) FILTER (WHERE __time BETWEEN TIMESTAMP '2020-01-01 01:00:00' AND TIMESTAMP '2020-01-01 02:00:00')"`,
    );
  });

  it('Simple subquery in from', () => {
    const sql = sane`
      SELECT * FROM (SELECT dim1 FROM druid.foo ORDER BY __time DESC) LIMIT 2
    `;

    backAndForth(sql);

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlQuery {
                  "explainKeyword": undefined,
                  "fromClause": SqlFromClause {
                    "expressions": SeparatedArray {
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
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": "foo",
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          "innerSpacing": Object {},
                          "type": "alias",
                        },
                      ],
                    },
                    "innerSpacing": Object {
                      "postKeyword": " ",
                    },
                    "joinParts": undefined,
                    "keyword": "FROM",
                    "type": "fromClause",
                  },
                  "groupByClause": undefined,
                  "havingClause": undefined,
                  "innerSpacing": Object {
                    "postQuery": "",
                    "postSelect": " ",
                    "preFrom": " ",
                    "preOrderBy": " ",
                    "preQuery": "",
                  },
                  "limitClause": undefined,
                  "offsetClause": undefined,
                  "orderByClause": SqlOrderByClause {
                    "expressions": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlOrderByExpression {
                          "direction": "DESC",
                          "expression": SqlRef {
                            "column": "__time",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          "innerSpacing": Object {
                            "preDirection": " ",
                          },
                          "type": "orderByExpression",
                        },
                      ],
                    },
                    "innerSpacing": Object {
                      "postKeyword": " ",
                    },
                    "keyword": "ORDER BY",
                    "type": "orderByClause",
                  },
                  "parens": Array [
                    Object {
                      "leftSpacing": "",
                      "rightSpacing": "",
                    },
                  ],
                  "selectDecorator": undefined,
                  "selectExpressions": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlAlias {
                        "alias": undefined,
                        "asKeyword": undefined,
                        "expression": SqlRef {
                          "column": "dim1",
                          "innerSpacing": Object {},
                          "namespace": undefined,
                          "namespaceQuotes": false,
                          "quotes": false,
                          "table": undefined,
                          "tableQuotes": false,
                          "type": "ref",
                        },
                        "innerSpacing": Object {},
                        "type": "alias",
                      },
                    ],
                  },
                  "selectKeyword": "SELECT",
                  "type": "query",
                  "unionKeyword": undefined,
                  "unionQuery": undefined,
                  "whereClause": undefined,
                  "withKeyword": undefined,
                  "withParts": undefined,
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "innerSpacing": Object {
            "postKeyword": " ",
          },
          "joinParts": undefined,
          "keyword": "FROM",
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "innerSpacing": Object {
          "postQuery": "",
          "postSelect": " ",
          "preFrom": " ",
          "preLimit": " ",
          "preQuery": "",
        },
        "limitClause": SqlLimitClause {
          "innerSpacing": Object {
            "postKeyword": " ",
          },
          "keyword": "LIMIT",
          "limit": SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
          "type": "limitClause",
        },
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectDecorator": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "alias",
            },
          ],
        },
        "selectKeyword": "SELECT",
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereClause": undefined,
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

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
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
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": "segments",
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "innerSpacing": Object {
            "postKeyword": " ",
          },
          "joinParts": undefined,
          "keyword": "FROM",
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "innerSpacing": Object {
          "postQuery": "",
          "postSelect": "
        ",
          "preFrom": "
      ",
          "preQuery": "",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectDecorator": undefined,
        "selectExpressions": SeparatedArray {
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
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
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
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlFunction {
                "args": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlRef {
                      "column": "size",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": true,
                      "table": undefined,
                      "tableQuotes": false,
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
                "specialParen": undefined,
                "type": "function",
                "whereClause": undefined,
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
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlFunction {
                "args": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlRef {
                      "column": "*",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
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
                "specialParen": undefined,
                "type": "function",
                "whereClause": undefined,
              },
              "innerSpacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
              "type": "alias",
            },
          ],
        },
        "selectKeyword": "SELECT",
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereClause": undefined,
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });

  it('Simple select with Explain', () => {
    const sql = `Explain plan for Select * from tbl`;

    backAndForth(sql);

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "Explain plan for",
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": "tbl",
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "innerSpacing": Object {
            "postKeyword": " ",
          },
          "joinParts": undefined,
          "keyword": "from",
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "innerSpacing": Object {
          "postExplain": " ",
          "postQuery": "",
          "postSelect": " ",
          "preFrom": " ",
          "preQuery": "",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectDecorator": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "alias",
            },
          ],
        },
        "selectKeyword": "Select",
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereClause": undefined,
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

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": "tbl",
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "innerSpacing": Object {
            "postKeyword": " ",
          },
          "joinParts": undefined,
          "keyword": "from",
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "innerSpacing": Object {
          "postQuery": "",
          "postSelect": " ",
          "postWith": " ",
          "postWithQuery": "
      ",
          "preFrom": " ",
          "preQuery": "",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectDecorator": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "*",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "alias",
            },
          ],
        },
        "selectKeyword": "Select",
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereClause": undefined,
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
                "fromClause": SqlFromClause {
                  "expressions": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlAlias {
                        "alias": undefined,
                        "asKeyword": undefined,
                        "expression": SqlRef {
                          "column": undefined,
                          "innerSpacing": Object {},
                          "namespace": undefined,
                          "namespaceQuotes": false,
                          "quotes": false,
                          "table": "emp",
                          "tableQuotes": false,
                          "type": "ref",
                        },
                        "innerSpacing": Object {},
                        "type": "alias",
                      },
                    ],
                  },
                  "innerSpacing": Object {
                    "postKeyword": "   ",
                  },
                  "joinParts": undefined,
                  "keyword": "FROM",
                  "type": "fromClause",
                },
                "groupByClause": undefined,
                "havingClause": undefined,
                "innerSpacing": Object {
                  "postQuery": "",
                  "postSelect": " ",
                  "preFrom": "
        ",
                  "preQuery": "",
                },
                "limitClause": undefined,
                "offsetClause": undefined,
                "orderByClause": undefined,
                "parens": Array [
                  Object {
                    "leftSpacing": "
        ",
                    "rightSpacing": "",
                  },
                ],
                "selectDecorator": undefined,
                "selectExpressions": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlAlias {
                      "alias": undefined,
                      "asKeyword": undefined,
                      "expression": SqlRef {
                        "column": "deptno",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                      "innerSpacing": Object {},
                      "type": "alias",
                    },
                  ],
                },
                "selectKeyword": "SELECT",
                "type": "query",
                "unionKeyword": undefined,
                "unionQuery": undefined,
                "whereClause": undefined,
                "withKeyword": undefined,
                "withParts": undefined,
              },
              "withTable": SqlRef {
                "column": "dept_count",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
            },
          ],
        },
      }
    `);
  });

  describe('expressions with where clause', () => {
    it('Simple select with where', () => {
      const sql = `Select * from tbl where col > 1`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preQuery": "",
            "preWhere": " ",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": SqlWhereClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "innerSpacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "lhs": SqlRef {
                "column": "col",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
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
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "where",
            "type": "whereClause",
          },
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with equals', () => {
      const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
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
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "supervisors",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preQuery": "",
            "preWhere": " ",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": SqlWhereClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "innerSpacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "lhs": SqlRef {
                "column": "healthy",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
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
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "WHERE",
            "type": "whereClause",
          },
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with many', () => {
      const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0 and col > 100 or otherColumn = 'value'`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
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
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "supervisors",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preQuery": "",
            "preWhere": " ",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": SqlWhereClause {
            "expression": SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "or",
                  },
                ],
                "values": Array [
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "and",
                        },
                      ],
                      "values": Array [
                        SqlComparison {
                          "decorator": undefined,
                          "innerSpacing": Object {
                            "postOp": " ",
                            "preOp": " ",
                          },
                          "lhs": SqlRef {
                            "column": "healthy",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
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
                          "decorator": undefined,
                          "innerSpacing": Object {
                            "postOp": " ",
                            "preOp": " ",
                          },
                          "lhs": SqlRef {
                            "column": "col",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
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
                    "expressionType": "and",
                    "innerSpacing": Object {},
                    "type": "multi",
                  },
                  SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "otherColumn",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
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
              "expressionType": "or",
              "innerSpacing": Object {},
              "type": "multi",
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "WHERE",
            "type": "whereClause",
          },
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

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "group by",
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preGroupBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with group by ', () => {
      const sql = `Select * from tbl group by col`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "group by",
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preGroupBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with multiple group by clauses in brackets', () => {
      const sql = `(Select * from tbl group by col, colTwo)`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
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
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                SqlRef {
                  "column": "colTwo",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "group by",
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preGroupBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
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

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": SqlHavingClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "innerSpacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "lhs": SqlRef {
                "column": "col",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
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
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "having",
            "type": "havingClause",
          },
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preHaving": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with equals', () => {
      const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
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
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "supervisors",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": SqlHavingClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "innerSpacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "lhs": SqlRef {
                "column": "healthy",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
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
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "HAVING",
            "type": "havingClause",
          },
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preHaving": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with many', () => {
      const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0 and col > 100 or otherColumn = 'value'`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
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
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "supervisors",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": SqlHavingClause {
            "expression": SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "or",
                  },
                ],
                "values": Array [
                  SqlMulti {
                    "args": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": " ",
                          "right": " ",
                          "separator": "and",
                        },
                      ],
                      "values": Array [
                        SqlComparison {
                          "decorator": undefined,
                          "innerSpacing": Object {
                            "postOp": " ",
                            "preOp": " ",
                          },
                          "lhs": SqlRef {
                            "column": "healthy",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
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
                          "decorator": undefined,
                          "innerSpacing": Object {
                            "postOp": " ",
                            "preOp": " ",
                          },
                          "lhs": SqlRef {
                            "column": "col",
                            "innerSpacing": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "table": undefined,
                            "tableQuotes": false,
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
                    "expressionType": "and",
                    "innerSpacing": Object {},
                    "type": "multi",
                  },
                  SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "otherColumn",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
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
              "expressionType": "or",
              "innerSpacing": Object {},
              "type": "multi",
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "HAVING",
            "type": "havingClause",
          },
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preHaving": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
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

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preOrderBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": undefined,
                  "expression": SqlLiteral {
                    "innerSpacing": Object {},
                    "keyword": undefined,
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "innerSpacing": Object {},
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "order by",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with ref order by', () => {
      const sql = `Select col from tbl order by col`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preOrderBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": undefined,
                  "expression": SqlRef {
                    "column": "col",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "order by",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with number order by and direction', () => {
      const sql = `Select col from tbl order by 1 Asc`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preOrderBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
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
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "order by",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with ref order by and direction', () => {
      const sql = `Select col, colTwo from tbl order by col DESC`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preOrderBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlRef {
                    "column": "col",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "order by",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
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
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
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
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select ordered on multiple cols 1', () => {
      const sql = `Select col from tbl order by 1 ASC, col`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preOrderBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [
                Separator {
                  "left": "",
                  "right": " ",
                  "separator": ",",
                },
              ],
              "values": Array [
                SqlOrderByExpression {
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
                  "type": "orderByExpression",
                },
                SqlOrderByExpression {
                  "direction": undefined,
                  "expression": SqlRef {
                    "column": "col",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "order by",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select ordered on multiple cols 2', () => {
      const sql = `Select col, colTwo from tbl order by 1 ASC, col DESC`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preOrderBy": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [
                Separator {
                  "left": "",
                  "right": " ",
                  "separator": ",",
                },
              ],
              "values": Array [
                SqlOrderByExpression {
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
                  "type": "orderByExpression",
                },
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlRef {
                    "column": "col",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "order by",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
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
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
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
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
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

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preLimit": " ",
            "preQuery": "",
          },
          "limitClause": SqlLimitClause {
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "limit",
            "limit": SqlLiteral {
              "innerSpacing": Object {},
              "keyword": undefined,
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "type": "limitClause",
          },
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
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

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "postUnion": " ",
            "preFrom": " ",
            "preQuery": "",
            "preUnion": " ",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": "union all",
          "unionQuery": SqlQuery {
            "explainKeyword": undefined,
            "fromClause": SqlFromClause {
              "expressions": SeparatedArray {
                "separators": Array [],
                "values": Array [
                  SqlAlias {
                    "alias": undefined,
                    "asKeyword": undefined,
                    "expression": SqlRef {
                      "column": undefined,
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": "otherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "innerSpacing": Object {},
                    "type": "alias",
                  },
                ],
              },
              "innerSpacing": Object {
                "postKeyword": " ",
              },
              "joinParts": undefined,
              "keyword": "from",
              "type": "fromClause",
            },
            "groupByClause": undefined,
            "havingClause": undefined,
            "innerSpacing": Object {
              "postQuery": "",
              "postSelect": " ",
              "preFrom": " ",
              "preQuery": "",
            },
            "limitClause": undefined,
            "offsetClause": undefined,
            "orderByClause": undefined,
            "selectDecorator": undefined,
            "selectExpressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": "*",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "selectKeyword": "select",
            "type": "query",
            "unionKeyword": undefined,
            "unionQuery": undefined,
            "whereClause": undefined,
            "withKeyword": undefined,
            "withParts": undefined,
          },
          "whereClause": undefined,
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

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
              "preJoin": " ",
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "innerSpacing": Object {
                    "postJoinKeyword": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "joinKeyword": "Join",
                  "joinType": "INNER",
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
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
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "innerSpacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Left join', () => {
      const sql = 'Select * from tbl Left Join anotherTable ON col = col';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
              "preJoin": " ",
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "innerSpacing": Object {
                    "postJoinKeyword": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "joinKeyword": "Join",
                  "joinType": "Left",
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
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
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "innerSpacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Right join', () => {
      const sql = 'Select * from tbl RIGHT Join anotherTable ON col = col';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
              "preJoin": " ",
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "innerSpacing": Object {
                    "postJoinKeyword": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "joinKeyword": "Join",
                  "joinType": "RIGHT",
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
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
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "innerSpacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Full join', () => {
      const sql = 'Select * from tbl FULL Join anotherTable ON col = col';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
              "preJoin": " ",
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "innerSpacing": Object {
                    "postJoinKeyword": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "joinKeyword": "Join",
                  "joinType": "FULL",
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
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
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "innerSpacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Full Outer join', () => {
      const sql = 'Select * from tbl FULL OUTER Join anotherTable ON col = col';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
              "preJoin": " ",
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "innerSpacing": Object {
                    "postJoinKeyword": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "joinKeyword": "Join",
                  "joinType": "FULL OUTER",
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
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
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "innerSpacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " ",
            "preFrom": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "*",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
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

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "from",
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": " -- some comment 
        ",
            "preFrom": " ",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "asKeyword": undefined,
                "expression": SqlRef {
                  "column": "col",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "innerSpacing": Object {},
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "Select",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
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

    it('comment with final comment with no new line', () => {
      const sql = `Select col from tbl -- comment`;

      backAndForth(sql);
    });

    it('comment with inline comments', () => {
      const sql = sane`
        Select 
        col from /* This is an inline comment */ tbl
        order by -1
      `;

      backAndForth(sql);
    });

    it('comment with multiline comments', () => {
      const sql = sane`
        Select 
        col from tbl
        /* This
        is a multiline
        comment */
        order by -1
      `;

      backAndForth(sql);
    });
  });

  describe('No spacing', () => {
    it('Expression with no spacing', () => {
      const sql = `SELECT"channel",COUNT(*)AS"Count",COUNT(DISTINCT"cityName")AS"dist_cityName"FROM"wiki"GROUP BY"channel"ORDER BY"Count"DESC`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "wiki",
                    "tableQuotes": true,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": "",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlRef {
                  "column": "channel",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": "",
            },
            "keyword": "GROUP BY",
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": "",
            "preFrom": "",
            "preGroupBy": "",
            "preOrderBy": "",
            "preQuery": "",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlRef {
                    "column": "Count",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": true,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {
                    "preDirection": "",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": "",
            },
            "keyword": "ORDER BY",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
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
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
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
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "asKeyword": "AS",
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "*",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "table": undefined,
                        "tableQuotes": false,
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
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
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
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "asKeyword": "AS",
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "cityName",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": true,
                        "table": undefined,
                        "tableQuotes": false,
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
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "innerSpacing": Object {
                  "preAlias": "",
                  "preAs": "",
                },
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": undefined,
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

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "explainKeyword": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "asKeyword": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "table": "wikipedia",
                    "tableQuotes": true,
                    "type": "ref",
                  },
                  "innerSpacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "joinParts": undefined,
            "keyword": "FROM",
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
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
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "GROUP BY",
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "innerSpacing": Object {
            "postQuery": "",
            "postSelect": "
          ",
            "preFrom": "
        ",
            "preGroupBy": "
        ",
            "preOrderBy": "
        ",
            "preQuery": "",
            "preWhere": "
        ",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlRef {
                    "column": "Count",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": true,
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "innerSpacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "ORDER BY",
            "type": "orderByClause",
          },
          "selectDecorator": undefined,
          "selectExpressions": SeparatedArray {
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
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "asKeyword": "AS",
                "expression": SqlFunction {
                  "args": SeparatedArray {
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
                        "namespaceQuotes": false,
                        "quotes": true,
                        "table": undefined,
                        "tableQuotes": false,
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
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
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
                  "namespaceQuotes": false,
                  "quotes": true,
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "asKeyword": "AS",
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "*",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": false,
                        "table": undefined,
                        "tableQuotes": false,
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
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "innerSpacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "selectKeyword": "SELECT",
          "type": "query",
          "unionKeyword": undefined,
          "unionQuery": undefined,
          "whereClause": SqlWhereClause {
            "expression": SqlMulti {
              "args": SeparatedArray {
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": "AND",
                  },
                ],
                "values": Array [
                  SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "__time",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": true,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": ">=",
                    "rhs": SqlMulti {
                      "args": SeparatedArray {
                        "separators": Array [
                          Separator {
                            "left": " ",
                            "right": " ",
                            "separator": "-",
                          },
                        ],
                        "values": Array [
                          SqlFunction {
                            "args": undefined,
                            "decorator": undefined,
                            "filterKeyword": undefined,
                            "functionName": "CURRENT_TIMESTAMP",
                            "innerSpacing": Object {},
                            "specialParen": "none",
                            "type": "function",
                            "whereClause": undefined,
                          },
                          SqlInterval {
                            "innerSpacing": Object {
                              "postIntervalKeyword": " ",
                              "postIntervalValue": " ",
                            },
                            "intervalValue": SqlLiteral {
                              "innerSpacing": Object {},
                              "keyword": undefined,
                              "stringValue": "'1'",
                              "type": "literal",
                              "value": "1",
                            },
                            "keyword": "INTERVAL",
                            "type": "interval",
                            "unitKeyword": "DAY",
                          },
                        ],
                      },
                      "expressionType": "-",
                      "innerSpacing": Object {},
                      "type": "multi",
                    },
                    "type": "comparison",
                  },
                  SqlComparison {
                    "decorator": undefined,
                    "innerSpacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "lhs": SqlRef {
                      "column": "cityName",
                      "innerSpacing": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "notKeyword": undefined,
                    "op": "=",
                    "rhs": SqlPlaceholder {
                      "customPlaceholder": undefined,
                      "innerSpacing": Object {},
                      "type": "placeholder",
                    },
                    "type": "comparison",
                  },
                ],
              },
              "expressionType": "and",
              "innerSpacing": Object {},
              "type": "multi",
            },
            "innerSpacing": Object {
              "postKeyword": " ",
            },
            "keyword": "WHERE",
            "type": "whereClause",
          },
          "withKeyword": undefined,
          "withParts": undefined,
        }
      `);
    });
  });
});
