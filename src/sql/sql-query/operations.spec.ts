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

import { sqlParserFactory, SqlRef } from '../..';
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('getTableName Tests', () => {
  it('getTableNames', () => {
    expect(
      parser(`SELECT *
  FROM "github"`).getTableName(),
    ).toMatchInlineSnapshot(`"github"`);
  });

  it('getTableName with nameSpace', () => {
    expect(
      parser(`SELECT *
  FROM sys."github"`).getTableName(),
    ).toMatchInlineSnapshot(`"github"`);
  });

  it('getTableName with nameSpace and alias', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" as Name`).getTableName(),
    ).toMatchInlineSnapshot(`"Name"`);
  });

  it('getTableName with multiple tables', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" as test, sys.name`).getTableName(),
    ).toMatchInlineSnapshot(`"test"`);
  });
});

describe('getSchema Test', () => {
  it('getSchema', () => {
    expect(
      parser(`SELECT *
  FROM sys."github"`).getSchema(),
    ).toMatchInlineSnapshot(`"sys"`);
  });

  it('getSchema from SqlRef with no nameSpace', () => {
    expect(
      parser(`SELECT *
  FROM "github"`).getSchema(),
    ).toMatchInlineSnapshot(`undefined`);
  });

  it('getSchema from multiple tables', () => {
    expect(
      parser(`SELECT *
  FROM sys."github", "table"`).getSchema(),
    ).toMatchInlineSnapshot(`"sys"`);
  });
});

describe('getSorted Test', () => {
  it('getSorted', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" ORDER BY column DESC`).getSorted(),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": true,
          "id": "column",
        },
      ]
    `);
  });
  it('getSorted with undefined direction', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" ORDER BY column`).getSorted(),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": true,
          "id": "column",
        },
      ]
    `);
  });
  it('getSorted with multiple columns', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" ORDER BY column, columnTwo ASC`).getSorted(),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": true,
          "id": "column",
        },
        Object {
          "desc": false,
          "id": "columnTwo",
        },
      ]
    `);
  });
  it('getSorted with numbered column', () => {
    expect(
      parser(`SELECT column, columnTwo 
  FROM sys."github" ORDER BY 1 ASC`).getSorted(),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "desc": false,
          "id": "column",
        },
      ]
    `);
  });
});

describe('order by Test', () => {
  it('noo order by clause', () => {
    expect(
      parser(`SELECT *
  FROM sys."github"`)
        .orderBy('column', 'DESC')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\"
      ORDER BY \\"column\\" DESC"
    `);
  });
  it('add to order by clause', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" ORDER BY column`)
        .orderBy('columnTwo', 'DESC')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\" ORDER BY column, \\"columnTwo\\" DESC"
    `);
  });
  it('order by with out direction', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" ORDER BY column, columnTwo ASC`)
        .orderBy('columnThree')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\" ORDER BY column, columnTwo ASC, \\"columnThree\\""
    `);
  });
});

describe('addWhereFilter test ', () => {
  it('no Where filter', () => {
    expect(
      parser(`SELECT *
  FROM sys."github"`)
        .addWhereFilter('column', '>', 1)
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\"
      WHERE \\"column\\" > 1"
    `);
  });
  it('Single Where filter value', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" WHERE column > 1`)
        .addWhereFilter('columnTwo', '>', 2)
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\" WHERE column > 1 AND \\"columnTwo\\" > 2"
    `);
  });
  it('OR Where filter value', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" WHERE column > 1 OR column < 5`)
        .addWhereFilter('columnTwo', '>', 2)
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
        FROM sys.\\"github\\" WHERE (column > 1 OR column < 5) AND \\"columnTwo\\" > 2"
    `);
  });
  it('AND Where filter value', () => {
    expect(
      parser(`SELECT *
        FROM sys."github" WHERE (column > 1 OR column < 5) AND columnTwo > 5`)
        .addWhereFilter('columnTwo', '>', 2)
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT *
              FROM sys.\\"github\\" WHERE (column > 1 OR column < 5) AND \\"columnTwo\\" > 2"
    `);
  });
});

describe('remove functions', () => {
  it('remove first column from select', () => {
    expect(
      parser(`SELECT column, column1
  FROM sys."github"`)
        .removeFromSelect('column')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column1
        FROM sys.\\"github\\""
    `);
  });
  it('remove middle column from select', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"`)
        .removeFromSelect('column1')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column2
        FROM sys.\\"github\\""
    `);
  });
  it('remove end column from select', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"`)
        .removeFromSelect('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1
        FROM sys.\\"github\\""
    `);
  });
  it('remove column from where', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Where column AND column2`)
        .removeFromWhere('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Where column"
    `);
  });
  it('remove only column from where', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Where column2 = '1'`)
        .removeFromWhere('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\""
    `);
  });
  it('remove multiple filters for the same column', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Where column2 > '1' AND column2 < '1'`)
        .removeFromWhere('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\""
    `);
  });
  it('remove multiple filters for the same column', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Where column2 > '1' AND column1 > 2 OR column2 < '1'`)
        .removeFromWhere('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Where column1 > 2"
    `);
  });
  it('remove only comparison expression from where', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Where column2 > 1`)
        .removeFromWhere('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\""
    `);
  });
  it('remove only comparison expression from where', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Where column2 > 1 AND column1 > 1`)
        .removeFromWhere('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Where column1 > 1"
    `);
  });
  it('remove only column from having', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Having column2 > 1`)
        .removeFromHaving('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\""
    `);
  });
  it('remove only comparison expression from having', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Having column2 > 1`)
        .removeFromHaving('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\""
    `);
  });
  it('remove only comparison expression from having', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Having column2 > 1 AND column1 > 1`)
        .removeFromHaving('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Having column1 > 1"
    `);
  });
  it('remove one numbered column from order by', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Order By column, 2 ASC`)
        .removeFromOrderBy()
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Order By column, 2 ASC"
    `);
  });
  it('remove column not in order by', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Order By column, column1 ASC`)
        .removeFromOrderBy('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Order By column, column1 ASC"
    `);
  });
  it('remove one numbered column not in order by', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Order By column, 3 ASC`)
        .removeFromOrderBy('column1')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Order By column, 3 ASC"
    `);
  });
  it('remove only column in order by', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Order By column1`)
        .removeFromOrderBy('column1')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\""
    `);
  });
  it('remove column from group by', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Group By column, 3`)
        .removeFromGroupBy('column')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Group By 3"
    `);
  });
  it('remove column as number from group by', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Group By column, 3`)
        .removeFromGroupBy('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\"
        Group By column"
    `);
  });
  it('remove only column from group by', () => {
    expect(
      parser(`SELECT column, column1, column2
  FROM sys."github"
  Group By column2`)
        .removeFromGroupBy('column2')
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT column, column1, column2
        FROM sys.\\"github\\""
    `);
  });
});

describe('getAggregateColumns', () => {
  it('get all aggregate columns', () => {
    const sql = `SELECT column, SUM(column1) As aggregated, column2
  FROM sys."github"
  Group By column2`;
    expect(parser(sql).getAggregateColumns()).toMatchInlineSnapshot(`
      Array [
        "column",
        "aggregated",
      ]
    `);
  });
  it('get all aggregate columns using numbers', () => {
    const sql = `SELECT column, SUM(column1) As aggregated, column2
  FROM sys."github"
  Group By column2,  1, 3`;
    expect(parser(sql).getAggregateColumns()).toMatchInlineSnapshot(`
      Array [
        "aggregated",
      ]
    `);
  });
});

describe('getCurrentFilters', () => {
  it('get all filters, only having clause', () => {
    const sql = `SELECT column, SUM(column1) As aggregated, column2
  FROM sys."github"
  Group By column2
  Having column > 1 AND aggregated < 100
`;
    expect(parser(sql).getCurrentFilters()).toMatchInlineSnapshot(`
      Array [
        "column",
        "aggregated",
      ]
    `);
  });
  it('get all filters, only where clause', () => {
    const sql = `SELECT column, SUM(column1) As aggregated, column2
  FROM sys."github"
  Where column > 1 AND aggregated < 100
  Group By column2
`;
    expect(parser(sql).getCurrentFilters()).toMatchInlineSnapshot(`
      Array [
        "column",
        "aggregated",
      ]
    `);
  });
  it('get all filters, where and having clauses', () => {
    const sql = `SELECT column, SUM(column1) As aggregated, column2
  FROM sys."github"
  Where column > 1 AND aggregated < 100
  Group By column2
  Having column3 > 1 AND column4 < 100
`;
    expect(parser(sql).getCurrentFilters()).toMatchInlineSnapshot(`
      Array [
        "column3",
        "column4",
        "column",
        "aggregated",
      ]
    `);
  });
});

describe('addAggregateColumn', () => {
  it('single column', () => {
    const sql = 'select column1 from table';

    expect(
      parser(sql)
        .addAggregateColumn([SqlRef.fromName('column2')], 'min', 'alias')
        .toString(),
    ).toMatchInlineSnapshot(`"select column1, min(column2) AS \\"alias\\" from table"`);
  });
});

describe('addToGroupBy', () => {
  it('no existing column', () => {
    const sql = 'select column1 from table';

    expect(
      parser(sql)
        .addFunctionToGroupBy([SqlRef.fromName('column1')], 'min', 'MinColumn')
        .toString(),
    ).toMatchInlineSnapshot(`
      "select column1, min(column1) AS \\"MinColumn\\" from table
      GROUP BY 2"
    `);
  });

  it('existing columns in group by', () => {
    const sql = `select column1, min(column1) AS aliasName from table 
      GROUP BY 2`;

    expect(
      parser(sql)
        .addFunctionToGroupBy([SqlRef.fromName('column2')], 'max', 'MaxColumn')
        .toString(),
    ).toMatchInlineSnapshot(`
      "select column1, min(column1) AS aliasName, max(column2) AS \\"MaxColumn\\" from table 
            GROUP BY 2, 3"
    `);
  });
});
