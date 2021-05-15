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
      `Select nottingham from tbl`,
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
      `SELECT w1."channel" FROM "wikipedia" w1 JOIN "wikipedia2" w2 ON w1."channel" = w2."channel"`,
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
      `Select nottingham from table`,
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
        SELECT
          channel,
          page,
          "user"
        FROM lol
        WHERE channel  =  '#en.wikipedia'
      `);
    });
  });

  describe('.from', () => {
    it('works', () => {
      expect(String(SqlQuery.from(SqlRef.table('lol')))).toEqual(sane`
        SELECT ...
        FROM lol
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
        'SELECT\n  datasource d,\n  SUM("size") AS total_size,\n  CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size,\n  CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE datasource IN (\'moon\', \'beam\') AND \'druid\' = schema\nGROUP BY datasource\nHAVING total_size > 100\nORDER BY datasource DESC, 2 ASC\nLIMIT 100',
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
        'SELECT\n  datasource d,\n  SUM("size") AS total_size,\n  CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size,\n  CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE datasource IN (\'moon\', \'beam\') AND \'druid\' = schema\nGROUP BY datasource\nHAVING total_size > 100\nORDER BY datasource DESC, 2 ASC\nLIMIT 100',
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
        'SELECT\n  _datasource_ d,\n  SUM("_size_") AS total_size,\n  CASE WHEN SUM("_size_") = 0 THEN 0 ELSE SUM("_size_") END AS avg_size,\n  CASE WHEN SUM(_num_rows_) = 0 THEN 0 ELSE SUM("_num_rows_") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE _datasource_ IN (\'moon\', \'beam\') AND \'druid\' = _schema_\nGROUP BY _datasource_\nHAVING _total_size_ > 100\nORDER BY _datasource_ DESC, 2 ASC\nLIMIT 100',
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
        'SELECT\n  datasource d,\n  SUM("size") AS total_size,\n  CASE WHEN SUM("size") = 0 THEN 0 ELSE SUM("size") END AS avg_size,\n  CASE WHEN SUM(num_rows) = 0 THEN 0 ELSE SUM("num_rows") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE datasource IN (\'moon\', \'beam\') AND \'druid\' = schema\nGROUP BY datasource\nHAVING total_size > 100\nORDER BY datasource DESC, 2 ASC\nLIMIT 100',
      ]);
    });
  });

  describe('#addSelect', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        isAnonymous,
        cityName,
        flags,
        COUNT(*) AS "Count",
        SUM(added) AS "sum_added"
      FROM wikipedia
      GROUP BY 1, 2, 3
      ORDER BY 4 DESC
    `);

    it('adds last', () => {
      expect(sql.addSelect(`"new_column" AS "New column"`).toString()).toEqual(sane`
        SELECT
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added",
          "new_column" AS "New column"
        FROM wikipedia
        GROUP BY 1, 2, 3
        ORDER BY 4 DESC
      `);
    });

    it('adds first', () => {
      expect(sql.addSelect(`"new_column" AS "New column"`, { insertIndex: 0 }).toString())
        .toEqual(sane`
        SELECT
          "new_column" AS "New column",
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 2, 3, 4
        ORDER BY 5 DESC
      `);
    });

    it('adds grouped', () => {
      expect(
        sql
          .addSelect(`UPPER(city) AS City`, { insertIndex: 'last-grouping', addToGroupBy: 'end' })
          .toString(),
      ).toEqual(sane`
        SELECT
          isAnonymous,
          cityName,
          flags,
          UPPER(city) AS City,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3, 4
        ORDER BY 5 DESC
      `);
    });

    it('adds sorted', () => {
      expect(
        sql
          .addSelect(`COUNT(DISTINCT "user") AS unique_users`, {
            insertIndex: 'last',
            addToOrderBy: 'start',
            direction: 'DESC',
          })
          .toString(),
      ).toEqual(sane`
        SELECT
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added",
          COUNT(DISTINCT "user") AS unique_users
        FROM wikipedia
        GROUP BY 1, 2, 3
        ORDER BY 6 DESC, 4 DESC
      `);
    });

    it('adds grouped + sorted', () => {
      expect(
        sql
          .addSelect(`UPPER(city) AS City`, {
            insertIndex: 'last-grouping',
            addToGroupBy: 'end',
            addToOrderBy: 'end',
          })
          .toString(),
      ).toEqual(sane`
        SELECT
          isAnonymous,
          cityName,
          flags,
          UPPER(city) AS City,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3, 4
        ORDER BY 5 DESC, 4
      `);
    });
  });

  describe('#changeSelect', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        isAnonymous,
        cityName,
        flags,
        COUNT(*) AS "Count",
        SUM(added) AS "sum_added"
      FROM wikipedia
      GROUP BY 1, 2, 3
      ORDER BY 4 DESC
    `);

    it('adds last', () => {
      expect(sql.changeSelect(2, `"new_column" AS "New column"`).toString()).toEqual(sane`
        SELECT
          isAnonymous,
          cityName,
          "new_column" AS "New column",
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
        ORDER BY 4 DESC
      `);
    });
  });

  describe('#removeSelectIndex', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        isAnonymous,
        cityName,
        flags,
        COUNT(*) AS "Count",
        SUM(added) AS "sum_added"
      FROM wikipedia
      GROUP BY 1, 2, 3
      ORDER BY 4 DESC
    `);

    it('works', () => {
      expect(sql.removeSelectIndex(1).toString()).toEqual(sane`
        SELECT
          isAnonymous,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2
        ORDER BY 3 DESC
      `);
    });

    it('eliminates order by', () => {
      expect(sql.removeSelectIndex(3).toString()).toEqual(sane`
        SELECT
          isAnonymous,
          cityName,
          flags,
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
      `);
    });
  });

  describe('#removeSelectIndexes', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        isAnonymous,
        cityName,
        flags,
        COUNT(*) AS "Count",
        SUM(added) AS "sum_added"
      FROM wikipedia
      GROUP BY 1, 2, 3
      ORDER BY 4 DESC
    `);

    it('works', () => {
      expect(sql.removeSelectIndexes([1, 3]).toString()).toEqual(sane`
        SELECT
          isAnonymous,
          flags,
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2
      `);
    });

    it('removes all', () => {
      expect(sql.removeSelectIndexes([1, 3, 2, 0, 4]).toString()).toEqual(sane`
        SELECT
          ...
        FROM wikipedia
        GROUP BY ()
      `);
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
        "decorator": undefined,
        "explainPlanFor": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlQuery {
                  "decorator": undefined,
                  "explainPlanFor": undefined,
                  "fromClause": SqlFromClause {
                    "expressions": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlAlias {
                          "alias": undefined,
                          "expression": SqlRef {
                            "column": undefined,
                            "keywords": Object {},
                            "namespace": "druid",
                            "namespaceQuotes": false,
                            "quotes": false,
                            "spacing": Object {
                              "postTableDot": "",
                              "preTableDot": "",
                            },
                            "table": "foo",
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
                      "from": "FROM",
                    },
                    "spacing": Object {
                      "postFrom": " ",
                    },
                    "type": "fromClause",
                  },
                  "groupByClause": undefined,
                  "havingClause": undefined,
                  "keywords": Object {
                    "select": "SELECT",
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
                            "keywords": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "spacing": Object {},
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          "keywords": Object {
                            "direction": "DESC",
                          },
                          "spacing": Object {
                            "preDirection": " ",
                          },
                          "type": "orderByExpression",
                        },
                      ],
                    },
                    "keywords": Object {
                      "by": "BY",
                      "order": "ORDER",
                    },
                    "spacing": Object {
                      "postBy": " ",
                      "postOrder": " ",
                    },
                    "type": "orderByClause",
                  },
                  "parens": Array [
                    Object {
                      "leftSpacing": "",
                      "rightSpacing": "",
                    },
                  ],
                  "selectExpressions": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlAlias {
                        "alias": undefined,
                        "expression": SqlRef {
                          "column": "dim1",
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
                    "preOrderBy": " ",
                    "preQuery": "",
                  },
                  "type": "query",
                  "unionQuery": undefined,
                  "whereClause": undefined,
                  "withParts": undefined,
                },
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
            ],
          },
          "joinParts": undefined,
          "keywords": Object {
            "from": "FROM",
          },
          "spacing": Object {
            "postFrom": " ",
          },
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "keywords": Object {
          "select": "SELECT",
        },
        "limitClause": SqlLimitClause {
          "keywords": Object {
            "limit": "LIMIT",
          },
          "limit": SqlLiteral {
            "keywords": Object {},
            "spacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
          "spacing": Object {
            "postLimit": " ",
          },
          "type": "limitClause",
        },
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "expression": SqlRef {
                "column": "*",
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
          "preLimit": " ",
          "preQuery": "",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
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
        "decorator": undefined,
        "explainPlanFor": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
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
            "from": "FROM",
          },
          "spacing": Object {
            "postFrom": " ",
          },
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "keywords": Object {
          "select": "SELECT",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
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
              "expression": SqlRef {
                "column": "datasource",
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
            SqlAlias {
              "alias": SqlRef {
                "column": "total_size",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "expression": SqlFunction {
                "args": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlRef {
                      "column": "size",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": true,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                  ],
                },
                "decorator": undefined,
                "functionName": "SUM",
                "keywords": Object {
                  "functionName": "SUM",
                },
                "spacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "specialParen": undefined,
                "type": "function",
                "whereClause": undefined,
              },
              "keywords": Object {
                "as": "AS",
              },
              "spacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
              "type": "alias",
            },
            SqlAlias {
              "alias": SqlRef {
                "column": "num_segments",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "expression": SqlFunction {
                "args": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
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
                    },
                  ],
                },
                "decorator": undefined,
                "functionName": "COUNT",
                "keywords": Object {
                  "functionName": "COUNT",
                },
                "spacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "specialParen": undefined,
                "type": "function",
                "whereClause": undefined,
              },
              "keywords": Object {
                "as": "AS",
              },
              "spacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
              "type": "alias",
            },
          ],
        },
        "spacing": Object {
          "postQuery": "",
          "postSelect": "
        ",
          "preFrom": "
      ",
          "preQuery": "",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
        "withParts": undefined,
      }
    `);
  });

  it('Simple select with Explain', () => {
    const sql = `Explain plan for Select * from tbl`;

    backAndForth(sql);

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "decorator": undefined,
        "explainPlanFor": true,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": "tbl",
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
          "explain": "Explain",
          "for": "for",
          "plan": "plan",
          "select": "Select",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "expression": SqlRef {
                "column": "*",
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
          "postExplain": " ",
          "postFor": " ",
          "postPlan": " ",
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
        "decorator": undefined,
        "explainPlanFor": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": undefined,
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": "tbl",
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
          "select": "Select",
          "with": "WITH",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "expression": SqlRef {
                "column": "*",
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
          "postWith": " ",
          "postWithParts": "
      ",
          "preFrom": " ",
          "preQuery": "",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
        "withParts": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlWithPart {
              "keywords": Object {
                "as": "AS",
              },
              "spacing": Object {
                "postAs": " ",
                "postWithTable": " ",
              },
              "type": "withPart",
              "withColumns": undefined,
              "withQuery": SqlQuery {
                "decorator": undefined,
                "explainPlanFor": undefined,
                "fromClause": SqlFromClause {
                  "expressions": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlAlias {
                        "alias": undefined,
                        "expression": SqlRef {
                          "column": undefined,
                          "keywords": Object {},
                          "namespace": undefined,
                          "namespaceQuotes": false,
                          "quotes": false,
                          "spacing": Object {},
                          "table": "emp",
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
                    "from": "FROM",
                  },
                  "spacing": Object {
                    "postFrom": "   ",
                  },
                  "type": "fromClause",
                },
                "groupByClause": undefined,
                "havingClause": undefined,
                "keywords": Object {
                  "select": "SELECT",
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
                "selectExpressions": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlAlias {
                      "alias": undefined,
                      "expression": SqlRef {
                        "column": "deptno",
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
                  "preFrom": "
        ",
                  "preQuery": "",
                },
                "type": "query",
                "unionQuery": undefined,
                "whereClause": undefined,
                "withParts": undefined,
              },
              "withTable": SqlRef {
                "column": "dept_count",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
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
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preWhere": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": SqlWhereClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": ">",
              },
              "lhs": SqlRef {
                "column": "col",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "not": false,
              "op": ">",
              "rhs": SqlLiteral {
                "keywords": Object {},
                "spacing": Object {},
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
              "spacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "type": "comparison",
            },
            "keywords": Object {
              "where": "where",
            },
            "spacing": Object {
              "postWhere": " ",
            },
            "type": "whereClause",
          },
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with equals', () => {
      const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0`;

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
                    "table": "supervisors",
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
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preWhere": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": SqlWhereClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": "=",
              },
              "lhs": SqlRef {
                "column": "healthy",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "not": false,
              "op": "=",
              "rhs": SqlLiteral {
                "keywords": Object {},
                "spacing": Object {},
                "stringValue": "0",
                "type": "literal",
                "value": 0,
              },
              "spacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "type": "comparison",
            },
            "keywords": Object {
              "where": "WHERE",
            },
            "spacing": Object {
              "postWhere": " ",
            },
            "type": "whereClause",
          },
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with many', () => {
      const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0 and col > 100 or otherColumn = 'value'`;

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
                    "table": "supervisors",
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
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preWhere": " ",
          },
          "type": "query",
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
                          "keywords": Object {
                            "op": "=",
                          },
                          "lhs": SqlRef {
                            "column": "healthy",
                            "keywords": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "spacing": Object {},
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          "not": false,
                          "op": "=",
                          "rhs": SqlLiteral {
                            "keywords": Object {},
                            "spacing": Object {},
                            "stringValue": "0",
                            "type": "literal",
                            "value": 0,
                          },
                          "spacing": Object {
                            "postOp": " ",
                            "preOp": " ",
                          },
                          "type": "comparison",
                        },
                        SqlComparison {
                          "decorator": undefined,
                          "keywords": Object {
                            "op": ">",
                          },
                          "lhs": SqlRef {
                            "column": "col",
                            "keywords": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "spacing": Object {},
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          "not": false,
                          "op": ">",
                          "rhs": SqlLiteral {
                            "keywords": Object {},
                            "spacing": Object {},
                            "stringValue": "100",
                            "type": "literal",
                            "value": 100,
                          },
                          "spacing": Object {
                            "postOp": " ",
                            "preOp": " ",
                          },
                          "type": "comparison",
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "AND",
                    "spacing": Object {},
                    "type": "multi",
                  },
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlRef {
                      "column": "otherColumn",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
                    "op": "=",
                    "rhs": SqlLiteral {
                      "keywords": Object {},
                      "spacing": Object {},
                      "stringValue": "'value'",
                      "type": "literal",
                      "value": "value",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                ],
              },
              "keywords": Object {},
              "op": "OR",
              "spacing": Object {},
              "type": "multi",
            },
            "keywords": Object {
              "where": "WHERE",
            },
            "spacing": Object {
              "postWhere": " ",
            },
            "type": "whereClause",
          },
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
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlRef {
                  "column": "col",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "group": "group",
            },
            "spacing": Object {
              "postBy": " ",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preGroupBy": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with group by ', () => {
      const sql = `Select * from tbl group by col`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlRef {
                  "column": "col",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "group": "group",
            },
            "spacing": Object {
              "postBy": " ",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preGroupBy": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with multiple group by clauses in brackets', () => {
      const sql = `(Select * from tbl group by col, colTwo)`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                SqlRef {
                  "column": "colTwo",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": false,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "group": "group",
            },
            "spacing": Object {
              "postBy": " ",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "Select",
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
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preGroupBy": " ",
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

  describe('expressions with having clause', () => {
    it('Simple select with where', () => {
      const sql = `Select * from tbl having col > 1`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
          "havingClause": SqlHavingClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": ">",
              },
              "lhs": SqlRef {
                "column": "col",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "not": false,
              "op": ">",
              "rhs": SqlLiteral {
                "keywords": Object {},
                "spacing": Object {},
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
              "spacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "type": "comparison",
            },
            "keywords": Object {
              "having": "having",
            },
            "spacing": Object {
              "postHaving": " ",
            },
            "type": "havingClause",
          },
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preHaving": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with equals', () => {
      const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0`;

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
                    "table": "supervisors",
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
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": SqlHavingClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": "=",
              },
              "lhs": SqlRef {
                "column": "healthy",
                "keywords": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "spacing": Object {},
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "not": false,
              "op": "=",
              "rhs": SqlLiteral {
                "keywords": Object {},
                "spacing": Object {},
                "stringValue": "0",
                "type": "literal",
                "value": 0,
              },
              "spacing": Object {
                "postOp": " ",
                "preOp": " ",
              },
              "type": "comparison",
            },
            "keywords": Object {
              "having": "HAVING",
            },
            "spacing": Object {
              "postHaving": " ",
            },
            "type": "havingClause",
          },
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preHaving": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with many', () => {
      const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0 and col > 100 or otherColumn = 'value'`;

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
                    "table": "supervisors",
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
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": " ",
            },
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
                          "keywords": Object {
                            "op": "=",
                          },
                          "lhs": SqlRef {
                            "column": "healthy",
                            "keywords": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "spacing": Object {},
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          "not": false,
                          "op": "=",
                          "rhs": SqlLiteral {
                            "keywords": Object {},
                            "spacing": Object {},
                            "stringValue": "0",
                            "type": "literal",
                            "value": 0,
                          },
                          "spacing": Object {
                            "postOp": " ",
                            "preOp": " ",
                          },
                          "type": "comparison",
                        },
                        SqlComparison {
                          "decorator": undefined,
                          "keywords": Object {
                            "op": ">",
                          },
                          "lhs": SqlRef {
                            "column": "col",
                            "keywords": Object {},
                            "namespace": undefined,
                            "namespaceQuotes": false,
                            "quotes": false,
                            "spacing": Object {},
                            "table": undefined,
                            "tableQuotes": false,
                            "type": "ref",
                          },
                          "not": false,
                          "op": ">",
                          "rhs": SqlLiteral {
                            "keywords": Object {},
                            "spacing": Object {},
                            "stringValue": "100",
                            "type": "literal",
                            "value": 100,
                          },
                          "spacing": Object {
                            "postOp": " ",
                            "preOp": " ",
                          },
                          "type": "comparison",
                        },
                      ],
                    },
                    "keywords": Object {},
                    "op": "AND",
                    "spacing": Object {},
                    "type": "multi",
                  },
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlRef {
                      "column": "otherColumn",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
                    "op": "=",
                    "rhs": SqlLiteral {
                      "keywords": Object {},
                      "spacing": Object {},
                      "stringValue": "'value'",
                      "type": "literal",
                      "value": "value",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                ],
              },
              "keywords": Object {},
              "op": "OR",
              "spacing": Object {},
              "type": "multi",
            },
            "keywords": Object {
              "having": "HAVING",
            },
            "spacing": Object {
              "postHaving": " ",
            },
            "type": "havingClause",
          },
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preHaving": " ",
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

  describe('expressions with order by clause', () => {
    it('Simple select with number order by', () => {
      const sql = `Select col from tbl order by 1`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
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
                    "keywords": Object {},
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "order": "order",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "col",
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
            "preOrderBy": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with ref order by', () => {
      const sql = `Select col from tbl order by col`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
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
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "order": "order",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "col",
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
            "preOrderBy": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with number order by and direction', () => {
      const sql = `Select col from tbl order by 1 Asc`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": SqlOrderByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlOrderByExpression {
                  "direction": "ASC",
                  "expression": SqlLiteral {
                    "keywords": Object {},
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "keywords": Object {
                    "direction": "Asc",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "order": "order",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "col",
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
            "preOrderBy": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select with ref order by and direction', () => {
      const sql = `Select col, colTwo from tbl order by col DESC`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
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
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "order": "order",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
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
                "expression": SqlRef {
                  "column": "col",
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
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "colTwo",
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
            "preOrderBy": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select ordered on multiple cols 1', () => {
      const sql = `Select col from tbl order by 1 ASC, col`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
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
                    "keywords": Object {},
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "keywords": Object {
                    "direction": "ASC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
                SqlOrderByExpression {
                  "direction": undefined,
                  "expression": SqlRef {
                    "column": "col",
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
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "order": "order",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "col",
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
            "preOrderBy": " ",
            "preQuery": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withParts": undefined,
        }
      `);
    });

    it('Simple select ordered on multiple cols 2', () => {
      const sql = `Select col, colTwo from tbl order by 1 ASC, col DESC`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
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
                    "keywords": Object {},
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "keywords": Object {
                    "direction": "ASC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlRef {
                    "column": "col",
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "by",
              "order": "order",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
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
                "expression": SqlRef {
                  "column": "col",
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
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "colTwo",
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
            "preOrderBy": " ",
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

  describe('expressions with limit clause', () => {
    it('Simple select with limit', () => {
      const sql = `Select * from tbl limit 1`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
          },
          "limitClause": SqlLimitClause {
            "keywords": Object {
              "limit": "limit",
            },
            "limit": SqlLiteral {
              "keywords": Object {},
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "spacing": Object {
              "postLimit": " ",
            },
            "type": "limitClause",
          },
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "preLimit": " ",
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

  describe('expressions with union clause', () => {
    it('Simple select with union all ', () => {
      const sql = `Select * from tbl union all select * from otherTable`;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
            "union": "union all",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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
            "postUnion": " ",
            "preFrom": " ",
            "preQuery": "",
            "preUnion": " ",
          },
          "type": "query",
          "unionQuery": SqlQuery {
            "decorator": undefined,
            "explainPlanFor": undefined,
            "fromClause": SqlFromClause {
              "expressions": SeparatedArray {
                "separators": Array [],
                "values": Array [
                  SqlAlias {
                    "alias": undefined,
                    "expression": SqlRef {
                      "column": undefined,
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": "otherTable",
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
                  "expression": SqlRef {
                    "column": "*",
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
          },
          "whereClause": undefined,
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
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "joinType": "INNER",
                  "keywords": Object {
                    "join": "Join",
                    "joinType": "INNER",
                    "on": "ON",
                  },
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlAlias {
                    "alias": undefined,
                    "expression": SqlRef {
                      "column": undefined,
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "keywords": Object {},
                    "spacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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

    it('Left join', () => {
      const sql = 'Select * from tbl Left Join anotherTable ON col = col';

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "joinType": "LEFT",
                  "keywords": Object {
                    "join": "Join",
                    "joinType": "Left",
                    "on": "ON",
                  },
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlAlias {
                    "alias": undefined,
                    "expression": SqlRef {
                      "column": undefined,
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "keywords": Object {},
                    "spacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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

    it('Right join', () => {
      const sql = 'Select * from tbl RIGHT Join anotherTable ON col = col';

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "joinType": "RIGHT",
                  "keywords": Object {
                    "join": "Join",
                    "joinType": "RIGHT",
                    "on": "ON",
                  },
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlAlias {
                    "alias": undefined,
                    "expression": SqlRef {
                      "column": undefined,
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "keywords": Object {},
                    "spacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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

    it('Full join', () => {
      const sql = 'Select * from tbl FULL Join anotherTable ON col = col';

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "joinType": "FULL",
                  "keywords": Object {
                    "join": "Join",
                    "joinType": "FULL",
                    "on": "ON",
                  },
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlAlias {
                    "alias": undefined,
                    "expression": SqlRef {
                      "column": undefined,
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "keywords": Object {},
                    "spacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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

    it('Full Outer join', () => {
      const sql = 'Select * from tbl FULL OUTER Join anotherTable ON col = col';

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {},
                  "spacing": Object {},
                  "type": "alias",
                },
              ],
            },
            "joinParts": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlJoinPart {
                  "joinType": "FULL",
                  "keywords": Object {
                    "join": "Join",
                    "joinType": "FULL OUTER",
                    "on": "ON",
                  },
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
                    "op": "=",
                    "rhs": SqlRef {
                      "column": "col",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlAlias {
                    "alias": undefined,
                    "expression": SqlRef {
                      "column": undefined,
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": "anotherTable",
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "keywords": Object {},
                    "spacing": Object {},
                    "type": "alias",
                  },
                  "type": "joinPart",
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "*",
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

  describe('Queries with comments', () => {
    it('single comment', () => {
      const sql = sane`
        Select -- some comment
        col from tbl
      `;

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
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "tbl",
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
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": undefined,
                "expression": SqlRef {
                  "column": "col",
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
            "postSelect": " -- some comment
        ",
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
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "wiki",
                    "tableQuotes": true,
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
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": "",
            },
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlRef {
                  "column": "channel",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "group": "GROUP",
            },
            "spacing": Object {
              "postBy": "",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
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
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": true,
                    "spacing": Object {},
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "spacing": Object {
                    "preDirection": "",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "order": "ORDER",
            },
            "spacing": Object {
              "postBy": "",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
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
                "expression": SqlRef {
                  "column": "channel",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "keywords": Object {},
                "spacing": Object {},
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "Count",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
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
                      },
                    ],
                  },
                  "decorator": undefined,
                  "functionName": "COUNT",
                  "keywords": Object {
                    "functionName": "COUNT",
                  },
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "spacing": Object {
                  "preAlias": "",
                  "preAs": "",
                },
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "dist_cityName",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlRef {
                        "column": "cityName",
                        "keywords": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": true,
                        "spacing": Object {},
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                    ],
                  },
                  "decorator": "DISTINCT",
                  "functionName": "COUNT",
                  "keywords": Object {
                    "decorator": "DISTINCT",
                    "functionName": "COUNT",
                  },
                  "spacing": Object {
                    "postArguments": "",
                    "postDecorator": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "spacing": Object {
                  "preAlias": "",
                  "preAs": "",
                },
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
            "postQuery": "",
            "postSelect": "",
            "preFrom": "",
            "preGroupBy": "",
            "preOrderBy": "",
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
          "decorator": undefined,
          "explainPlanFor": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlAlias {
                  "alias": undefined,
                  "expression": SqlRef {
                    "column": undefined,
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": false,
                    "spacing": Object {},
                    "table": "wikipedia",
                    "tableQuotes": true,
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
              "from": "FROM",
            },
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "group": "GROUP",
            },
            "spacing": Object {
              "postBy": " ",
              "postGroup": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "keywords": Object {
            "select": "SELECT",
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
                    "keywords": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": false,
                    "quotes": true,
                    "spacing": Object {},
                    "table": undefined,
                    "tableQuotes": false,
                    "type": "ref",
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "by": "BY",
              "order": "ORDER",
            },
            "spacing": Object {
              "postBy": " ",
              "postOrder": " ",
            },
            "type": "orderByClause",
          },
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
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
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
                        "keywords": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": false,
                        "quotes": true,
                        "spacing": Object {},
                        "table": undefined,
                        "tableQuotes": false,
                        "type": "ref",
                      },
                      SqlLiteral {
                        "keywords": Object {},
                        "spacing": Object {},
                        "stringValue": "VARCHAR",
                        "type": "literal",
                        "value": "VARCHAR",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "functionName": "CAST",
                  "keywords": Object {
                    "functionName": "CAST",
                  },
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
              SqlAlias {
                "alias": SqlRef {
                  "column": "Count",
                  "keywords": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": false,
                  "quotes": true,
                  "spacing": Object {},
                  "table": undefined,
                  "tableQuotes": false,
                  "type": "ref",
                },
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
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
                      },
                    ],
                  },
                  "decorator": undefined,
                  "functionName": "COUNT",
                  "keywords": Object {
                    "functionName": "COUNT",
                  },
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
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
          "type": "query",
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
                    "keywords": Object {
                      "op": ">=",
                    },
                    "lhs": SqlRef {
                      "column": "__time",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": true,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
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
                            "functionName": "CURRENT_TIMESTAMP",
                            "keywords": Object {
                              "functionName": "CURRENT_TIMESTAMP",
                            },
                            "spacing": Object {},
                            "specialParen": "none",
                            "type": "function",
                            "whereClause": undefined,
                          },
                          SqlInterval {
                            "intervalValue": SqlLiteral {
                              "keywords": Object {},
                              "spacing": Object {},
                              "stringValue": "'1'",
                              "type": "literal",
                              "value": "1",
                            },
                            "keywords": Object {
                              "interval": "INTERVAL",
                            },
                            "spacing": Object {
                              "postInterval": " ",
                              "postIntervalValue": " ",
                            },
                            "type": "interval",
                            "unit": "DAY",
                          },
                        ],
                      },
                      "keywords": Object {},
                      "op": "-",
                      "spacing": Object {},
                      "type": "multi",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlRef {
                      "column": "cityName",
                      "keywords": Object {},
                      "namespace": undefined,
                      "namespaceQuotes": false,
                      "quotes": false,
                      "spacing": Object {},
                      "table": undefined,
                      "tableQuotes": false,
                      "type": "ref",
                    },
                    "not": false,
                    "op": "=",
                    "rhs": SqlPlaceholder {
                      "customPlaceholder": undefined,
                      "keywords": Object {},
                      "spacing": Object {},
                      "type": "placeholder",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                ],
              },
              "keywords": Object {},
              "op": "AND",
              "spacing": Object {},
              "type": "multi",
            },
            "keywords": Object {
              "where": "WHERE",
            },
            "spacing": Object {
              "postWhere": " ",
            },
            "type": "whereClause",
          },
          "withParts": undefined,
        }
      `);
    });
  });
});
