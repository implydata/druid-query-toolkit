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

import { parseSql, parseSqlQuery, SqlAliasRef, SqlFunction, SqlRef } from '../..';
import { sane } from '../../test-utils';

describe('getTableName Tests', () => {
  it('getTableNames', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM "github"`).getTableName(),
    ).toMatchInlineSnapshot(`"github"`);
  });

  it('getTableName with nameSpace', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github"`).getTableName(),
    ).toMatchInlineSnapshot(`"github"`);
  });

  it('getTableName with nameSpace and alias', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" as Name`).getTableName(),
    ).toMatchInlineSnapshot(`"Name"`);
  });

  it('getTableName with multiple tables', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" as test, sys.name`).getTableName(),
    ).toMatchInlineSnapshot(`"test"`);
  });
});

describe('getSchema Test', () => {
  it('getSchema', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github"`).getSchema(),
    ).toMatchInlineSnapshot(`"sys"`);
  });

  it('getSchema from SqlRef with no nameSpace', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM "github"`).getSchema(),
    ).toMatchInlineSnapshot(`undefined`);
  });

  it('getSchema from multiple tables', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github", "table"`).getSchema(),
    ).toMatchInlineSnapshot(`"sys"`);
  });
});

describe('getSorted Test', () => {
  it('getSorted', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" ORDER BY col DESC`).getSorted(),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": true,
          "id": "col",
        },
      ]
    `);
  });

  it('getSorted with undefined direction', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" ORDER BY col`).getSorted(),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": true,
          "id": "col",
        },
      ]
    `);
  });

  it('getSorted with multiple cols', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" ORDER BY col, colTwo ASC`).getSorted(),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": true,
          "id": "col",
        },
        Object {
          "desc": false,
          "id": "colTwo",
        },
      ]
    `);
  });

  it('getSorted with numbered col', () => {
    expect(
      parseSqlQuery(`SELECT col0, colTwo 
  FROM sys."github" ORDER BY 1 ASC`).getSorted(),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": false,
          "id": "col0",
        },
      ]
    `);
  });
});

describe('order by Test', () => {
  it('noo order by clause', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github"`)
        .orderBy('col', 'DESC')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\"
      ORDER BY \\"col\\" DESC"
    `);
  });

  it('add to order by clause', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" ORDER BY col`)
        .orderBy('colTwo', 'DESC')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\" ORDER BY col, \\"colTwo\\" DESC"
    `);
  });

  it('order by with out direction', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" ORDER BY col, colTwo ASC`)
        .orderBy('colThree')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\" ORDER BY col, colTwo ASC, \\"colThree\\""
    `);
  });
});

describe('addWhereFilter test ', () => {
  it('no Where filter', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github"`)
        .addWhereFilter('col', '>', 1)
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\"
      WHERE \\"col\\" > 1"
    `);
  });

  it('Single Where filter value', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" WHERE col > 1`)
        .addWhereFilter('colTwo', '>', 2)
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\" WHERE col > 1"
    `);
  });

  it('OR Where filter value', () => {
    expect(
      parseSqlQuery(`SELECT *
  FROM sys."github" WHERE col > 1 OR col < 5`)
        .addWhereFilter('colTwo', '>', 2)
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\" WHERE (col > 1 OR col < 5) AND \\"colTwo\\" > 2"
    `);
  });

  it('AND Where filter value', () => {
    expect(
      parseSqlQuery(`SELECT *
        FROM sys."github" WHERE (col > 1 OR col < 5) AND colTwo > 5`)
        .addWhereFilter('colTwo', '>', 2)
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
              FROM sys.\\"github\\" WHERE (col > 1 OR col < 5) AND colTwo > 5"
    `);
  });
});

describe('remove functions', () => {
  describe('#removeFromSelect', () => {
    it('basic cols', () => {
      const query = parseSqlQuery(sane`
        SELECT col0, col1, col2 
        FROM github
      `);

      expect(query.removeFromSelect('col0').toString()).toEqual(sane`
        SELECT col1, col2 
        FROM github
      `);

      expect(query.removeFromSelect('col1').toString()).toEqual(sane`
        SELECT col0, col2 
        FROM github
      `);

      expect(query.removeFromSelect('col2').toString()).toEqual(sane`
        SELECT col0, col1 
        FROM github
      `);
    });

    it(`removes from group by and order by`, () => {
      const query = parseSqlQuery(sane`
        SELECT col0, col1, SUM(a), col2 
        FROM github
        GROUP BY 1, 2, 4
        ORDER BY 2
      `);

      expect(query.removeFromSelect('col0').toString()).toEqual(sane`
        SELECT col1, SUM(a), col2 
        FROM github
        GROUP BY 1, 3
        ORDER BY 1
      `);

      expect(query.removeFromSelect('col1').toString()).toEqual(sane`
        SELECT col0, SUM(a), col2 
        FROM github
        GROUP BY 1, 3
      `);

      expect(query.removeFromSelect('col2').toString()).toEqual(sane`
        SELECT col0, col1, SUM(a) 
        FROM github
        GROUP BY 1, 2
        ORDER BY 2
      `);
    });
  });

  it('remove col from where', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Where col AND col2`)
        .removeFromWhere('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Where col"
    `);
  });

  it('remove only col from where', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Where col2 = '1'`)
        .removeFromWhere('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\""
    `);
  });

  it('remove multiple filters for the same col', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Where col2 > '1' AND col2 < '1'`)
        .removeFromWhere('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\""
    `);
  });

  it('remove multiple filters for the same col', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Where col2 > '1' AND col1 > 2 OR col2 < '1'`)
        .removeFromWhere('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Where col1 > 2"
    `);
  });

  it('remove only comparison expression from where', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Where col2 > 1`)
        .removeFromWhere('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\""
    `);
  });

  it('remove only comparison expression from where', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Where col2 > 1 AND col1 > 1`)
        .removeFromWhere('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Where col1 > 1"
    `);
  });

  it('remove only col from having', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Having col2 > 1`)
        .removeFromHaving('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\""
    `);
  });

  it('remove only comparison expression from having 1', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Having col2 > 1`)
        .removeFromHaving('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\""
    `);
  });

  it('remove only comparison expression from having 2', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Having col2 > 1 AND col1 > 1`)
        .removeFromHaving('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Having col1 > 1"
    `);
  });

  it('remove one numbered col from order by', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Order By col, 2 ASC`)
        .removeFromOrderBy('col')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Order By 2 ASC"
    `);
  });

  it('remove col not in order by', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Order By col, col1 ASC`)
        .removeFromOrderBy('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Order By col, col1 ASC"
    `);
  });

  it('remove one numbered col not in order by', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Order By col, 3 ASC`)
        .removeFromOrderBy('col1')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Order By col, 3 ASC"
    `);
  });

  it('remove only col in order by', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Order By col1`)
        .removeFromOrderBy('col1')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\""
    `);
  });

  it('remove col from group by', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Group By col, 3`)
        .removeFromGroupBy('col')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Group By 3"
    `);
  });

  it('remove col as number from group by', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Group By col, 3`)
        .removeFromGroupBy('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\"
        Group By col"
    `);
  });

  it('remove only col from group by', () => {
    expect(
      parseSqlQuery(`SELECT col0, col1, col2
  FROM sys."github"
  Group By col2`)
        .removeFromGroupBy('col2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT col0, col1, col2
        FROM sys.\\"github\\""
    `);
  });
});

describe('getAggregateColumns', () => {
  it('get all aggregate cols', () => {
    const sql = sane`
      SELECT col0, SUM(col1) As aggregated, col2
      FROM sys."github"
      Group By col2
    `;

    expect(parseSqlQuery(sql).getAggregateColumns()).toMatchInlineSnapshot(`
      Array [
        "col0",
        "aggregated",
      ]
    `);
  });

  it('get all aggregate cols using numbers', () => {
    const sql = sane`
      SELECT col0, SUM(col1) As aggregated, col2
      FROM sys."github"
      Group By col2,  1, 3
    `;

    expect(parseSqlQuery(sql).getAggregateColumns()).toMatchInlineSnapshot(`
      Array [
        "aggregated",
      ]
    `);
  });
});

describe('getCurrentFilters', () => {
  it('get all filters, only having clause', () => {
    const sql = sane`
      SELECT col1, SUM(col1) As aggregated
      FROM sys."github"
      Group By col2
      Having col1 > 1 AND aggregated < 100
    `;

    expect(parseSqlQuery(sql).getCurrentFilters()).toMatchInlineSnapshot(`Array []`);
  });

  it('get all filters, only where clause', () => {
    const sql = sane`
      SELECT col1
      FROM sys."github"
      Where col1 > 1 AND aggregated < 100
      Group By col2
    `;

    expect(parseSqlQuery(sql).getCurrentFilters()).toMatchInlineSnapshot(`Array []`);
  });

  it('get all filters, where and having clauses', () => {
    const sql = sane`
      SELECT col0, SUM(col1) As aggregated, col2
      FROM sys."github"
      Where col > 1 AND aggregated < 100
      Group By col2
      Having col3 > 1 AND col4 < 100
    `;

    expect(parseSqlQuery(sql).getCurrentFilters()).toMatchInlineSnapshot(`Array []`);
  });
});

describe('addAggregateColumn', () => {
  it('single col', () => {
    const sql = 'select col1 from tbl';

    expect(
      parseSqlQuery(sql)
        .addAggregateColumn([SqlRef.fromString('col2')], 'min', 'alias')
        .toString(),
    ).toMatchInlineSnapshot(`"select col1, min(col2) AS \\"alias\\" from tbl"`);
  });

  it('function with decorator', () => {
    const sql = 'select col1 from tbl';

    expect(
      parseSqlQuery(sql)
        .addAggregateColumn([SqlRef.fromString('col2')], 'min', 'alias', undefined, 'DISTINCT')
        .toString(),
    ).toMatchInlineSnapshot(`"select col1, min(DISTINCT col2) AS \\"alias\\" from tbl"`);
  });
});

describe('addToGroupBy', () => {
  it('add simple col to group by', () => {
    const sql = 'select Count(*) from tbl';

    expect(
      parseSqlQuery(sql)
        .addToGroupBy(SqlRef.fromStringWithDoubleQuotes('col'))
        .toString(),
    ).toMatchInlineSnapshot(`
      "select \\"col\\", Count(*) from tbl
      GROUP BY 1"
    `);
  });

  it('no existing col', () => {
    const sql = 'select col1 from tbl';

    expect(
      parseSqlQuery(sql)
        .addToGroupBy(
          SqlAliasRef.sqlAliasFactory(
            SqlFunction.sqlFunctionFactory('min', [SqlRef.fromString('col1')]),
            'MinColumn',
          ),
        )
        .toString(),
    ).toMatchInlineSnapshot(`
      "select min(col1) AS \\"MinColumn\\", col1 from tbl
      GROUP BY 1"
    `);
  });

  it('existing cols in group by', () => {
    const sql = sane`
      select col1, min(col1) AS aliasName
      from tbl 
      GROUP BY 2
    `;

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromKeyword": "from",
        "groupByExpressions": Array [
          SqlLiteral {
            "innerSpacing": Object {},
            "keyword": undefined,
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
        ],
        "groupByKeyword": "GROUP BY",
        "groupBySeparators": Array [],
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postFrom": " ",
          "postGroupByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "preFrom": "
      ",
          "preGroupByKeyword": " 
      ",
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
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "select",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "column": "col1",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlAliasRef {
            "alias": SqlRef {
              "column": "aliasName",
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
              "arguments": Array [
                SqlRef {
                  "column": "col1",
                  "innerSpacing": Object {},
                  "namespace": undefined,
                  "namespaceQuotes": undefined,
                  "quotes": "",
                  "table": undefined,
                  "tableQuotes": undefined,
                  "type": "ref",
                },
              ],
              "decorator": undefined,
              "filterKeyword": undefined,
              "functionName": "min",
              "innerSpacing": Object {
                "postDecorator": "",
                "postFilterKeyword": "",
                "postFilterLeftParen": "",
                "postLeftParen": "",
                "postName": "",
                "postWhereKeyword": "",
                "preFilter": "",
                "preFilterRightParen": "",
                "preRightParen": "",
              },
              "separators": Array [],
              "type": "function",
              "whereExpression": undefined,
              "whereKeyword": undefined,
            },
            "innerSpacing": Object {
              "postAs": " ",
              "postExpression": " ",
            },
            "type": "alias-ref",
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
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "tbl",
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
    expect(
      parseSqlQuery(sql)
        .addToGroupBy(
          SqlAliasRef.sqlAliasFactory(
            SqlFunction.sqlFunctionFactory('max', [SqlRef.fromString('col2')]),
            'MaxColumn',
          ),
        )
        .toString(),
    ).toMatchInlineSnapshot(`
      "select max(col2) AS \\"MaxColumn\\", col1, min(col1) AS aliasName
      from tbl 
      GROUP BY 1, 3"
    `);
  });
});
