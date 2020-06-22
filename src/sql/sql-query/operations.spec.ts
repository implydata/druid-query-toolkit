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

import { parseSqlQuery, SqlAlias, SqlFunction, SqlRef } from '../..';
import { sane } from '../../test-utils';

describe('SqlQuery operations', () => {
  describe('#getFirstTableName', () => {
    it('getFirstTableNames', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM "github"
        `).getFirstTableName(),
      ).toEqual('github');
    });

    it('getFirstTableName with nameSpace', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM sys."github"
        `).getFirstTableName(),
      ).toEqual('github');
    });

    it('getFirstTableName with nameSpace and alias', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM sys."github" as Name
        `).getFirstTableName(),
      ).toEqual('github');
    });

    it('getFirstTableName with multiple tables', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM sys."github" as test, sys.name
        `).getFirstTableName(),
      ).toEqual('github');
    });
  });

  describe('#getFirstSchema', () => {
    it('getFirstSchema', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM sys."github"
        `).getFirstSchema(),
      ).toEqual('sys');
    });

    it('getFirstSchema from SqlRef with no nameSpace', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM "github"
        `).getFirstSchema(),
      ).toBeUndefined();
    });

    it('getFirstSchema from multiple tables', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM "github", sys."table"
        `).getFirstSchema(),
      ).toEqual('sys');
    });
  });

  describe('getSorted Test', () => {
    it('getSorted', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM sys."github" ORDER BY col DESC
        `).getSorted(),
      ).toEqual([
        {
          direction: 'DESC',
          id: 'col',
        },
      ]);
    });

    it('getSorted with undefined direction', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM sys."github" ORDER BY col
        `).getSorted(),
      ).toEqual([
        {
          direction: 'DESC',
          id: 'col',
        },
      ]);
    });

    it('getSorted with multiple cols', () => {
      expect(
        parseSqlQuery(sane`
          SELECT * FROM sys."github" ORDER BY col, colTwo ASC
        `).getSorted(),
      ).toEqual([
        {
          direction: 'DESC',
          id: 'col',
        },
        {
          direction: 'ASC',
          id: 'colTwo',
        },
      ]);
    });

    it('getSorted with numbered col', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, colTwo FROM sys."github" ORDER BY 1 ASC
        `).getSorted(),
      ).toEqual([
        {
          direction: 'ASC',
          id: 'col0',
        },
      ]);
    });
  });

  describe('orderBy', () => {
    it('no ORDER BY clause', () => {
      expect(
        parseSqlQuery(sane`
          SELECT *
          FROM sys."github"
        `)
          .orderBy('col', 'DESC')
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        ORDER BY "col" DESC
      `);
    });

    it('add to ORDER BY clause', () => {
      expect(
        parseSqlQuery(sane`
          SELECT *
          FROM sys."github"
          ORDER BY col
        `)
          .orderBy('colTwo', 'DESC')
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        ORDER BY col, "colTwo" DESC
      `);
    });

    it('ORDER BY with out direction', () => {
      expect(
        parseSqlQuery(sane`
          SELECT *
          FROM sys."github"
          ORDER BY col, colTwo ASC
        `)
          .orderBy('colThree')
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        ORDER BY col, colTwo ASC, "colThree"
      `);
    });
  });

  describe.skip('#addWhereFilter', () => {
    it('no Where filter', () => {
      expect(
        parseSqlQuery(sane`
          SELECT *
          FROM sys."github"
        `)
          .addWhereFilter(`col > 1`)
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        WHERE "col" > 1
      `);
    });

    it('Single Where filter value', () => {
      expect(
        parseSqlQuery(sane`
          SELECT *
          FROM sys."github" WHERE col > 1
        `)
          .addWhereFilter(`colTwo > 2`)
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github" WHERE col > 1
      `);
    });

    it('OR Where filter value', () => {
      expect(
        parseSqlQuery(sane`
          SELECT *
          FROM sys."github" WHERE col > 1 OR col < 5
        `)
          .addWhereFilter(`colTwo > 2`)
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github" WHERE (col > 1 OR col < 5) AND "colTwo" > 2"
      `);
    });

    it('AND Where filter value', () => {
      expect(
        parseSqlQuery(sane`
          SELECT *
          FROM sys."github" WHERE (col > 1 OR col < 5) AND colTwo > 5
        `)
          .addWhereFilter(`colTwo > 2`)
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github" WHERE (col > 1 OR col < 5) AND colTwo > 5
      `);
    });
  });

  describe.skip('remove functions', () => {
    describe('#removeColumn', () => {
      it('basic cols', () => {
        const query = parseSqlQuery(sane`
          SELECT col0, col1, col2 
          FROM github
        `);

        expect(query.removeColumn('col0').toString()).toEqual(sane`
          SELECT col1, col2 
          FROM github
        `);

        expect(query.removeColumn('col1').toString()).toEqual(sane`
          SELECT col0, col2 
          FROM github
        `);

        expect(query.removeColumn('col2').toString()).toEqual(sane`
          SELECT col0, col1 
          FROM github
        `);
      });

      it(`removes from group by and ORDER BY`, () => {
        const query = parseSqlQuery(sane`
          SELECT col0, col1, SUM(a), col2 
          FROM github
          GROUP BY 1, 2, 4
          ORDER BY 2
        `);

        expect(query.removeColumn('col0').toString()).toEqual(sane`
          SELECT col1, SUM(a), col2 
          FROM github
          GROUP BY 1, 3
          ORDER BY 1
        `);

        expect(query.removeColumn('col1').toString()).toEqual(sane`
          SELECT col0, SUM(a), col2 
          FROM github
          GROUP BY 1, 3
        `);

        expect(query.removeColumn('col2').toString()).toEqual(sane`
          SELECT col0, col1, SUM(a) 
          FROM github
          GROUP BY 1, 2
          ORDER BY 2
        `);
      });
    });

    it('remove col from where', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col AND col2
        `)
          .removeFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github"
        Where col2"
      `);
    });

    it('remove only col from where', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 = '1'
        `)
          .removeFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github""
      `);
    });

    it('remove multiple filters for the same col', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 > '1' AND col2 < '1'
        `)
          .removeFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github"
        Where col2 > '1',col2 < '1'"
      `);
    });

    it('remove multiple filters for the same col', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 > '1' AND col1 > 2 OR col2 < '1'
        `)
          .removeFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Where col1 > 2"
      `);
    });

    it('remove only comparison expression from where', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 > 1
        `)
          .removeFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github""
      `);
    });

    it('remove only comparison expression from where', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 > 1 AND col1 > 1
        `)
          .removeFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github"
        Where col2 > 1"
      `);
    });

    it('remove only col from having', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Having col2 > 1
        `)
          .removeFromHaving('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github""
      `);
    });

    it('remove only comparison expression from having 1', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Having col2 > 1
        `)
          .removeFromHaving('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github""
      `);
    });

    it('remove only comparison expression from having 2', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Having col2 > 1 AND col1 > 1
        `)
          .removeFromHaving('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Having col1 > 1"
      `);
    });

    it('remove one numbered col from ORDER BY', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Order By col, 2 ASC
        `)
          .removeFromOrderBy('col')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Order By 2 ASC"
      `);
    });

    it('remove col not in ORDER BY', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Order By col, col1 ASC
        `)
          .removeFromOrderBy('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Order By col, col1 ASC"
      `);
    });

    it('remove one numbered col not in ORDER BY', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Order By col, 3 ASC
        `)
          .removeFromOrderBy('col1')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Order By col, 3 ASC"
      `);
    });

    it('remove only col in ORDER BY', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Order By col1
        `)
          .removeFromOrderBy('col1')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github""
      `);
    });

    it('remove col from group by', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Group By col, 3
        `)
          .removeFromGroupBy('col')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Group By 3"
      `);
    });

    it('remove col as number from group by', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Group By col, 3
        `)
          .removeFromGroupBy('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Group By col"
      `);
    });

    it('remove only col from group by', () => {
      expect(
        parseSqlQuery(sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Group By col2
        `)
          .removeFromGroupBy('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github""
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

      expect(parseSqlQuery(sql).getAggregateColumns()).toEqual(['col0', 'aggregated']);
    });

    it('get all aggregate cols using numbers', () => {
      const sql = sane`
        SELECT col0, SUM(col1) As aggregated, col2
        FROM sys."github"
        Group By col2,  1, 3
      `;

      expect(parseSqlQuery(sql).getAggregateColumns()).toEqual(['aggregated']);
    });
  });

  describe.skip('getCurrentFilters', () => {
    it('get all filters, only having clause', () => {
      const sql = sane`
        SELECT col1, SUM(col1) As aggregated
        FROM sys."github"
        Group By col2
        Having col1 > 1 AND aggregated < 100
      `;

      expect(parseSqlQuery(sql).getCurrentFilters()).toEqual([]);
    });

    it('get all filters, only where clause', () => {
      const sql = sane`
        SELECT col1
        FROM sys."github"
        Where col1 > 1 AND aggregated < 100
        Group By col2
      `;

      expect(parseSqlQuery(sql).getCurrentFilters()).toEqual([]);
    });

    it('get all filters, where and having clauses', () => {
      const sql = sane`
        SELECT col0, SUM(col1) As aggregated, col2
        FROM sys."github"
        Where col > 1 AND aggregated < 100
        Group By col2
        Having col3 > 1 AND col4 < 100
      `;

      expect(parseSqlQuery(sql).getCurrentFilters()).toEqual([]);
    });
  });

  describe('addColumn', () => {
    it('single col', () => {
      const sql = sane`
        select col1
        from tbl
      `;

      expect(
        parseSqlQuery(sql)
          .addColumn('min(col2) AS "alias"')
          .toString(),
      ).toEqual(sane`
        select col1, min(col2) AS "alias"
        from tbl
      `);
    });

    it('function with decorator', () => {
      const sql = sane`
        select col1
        from tbl
      `;

      expect(
        parseSqlQuery(sql)
          .addColumn(`count(DISTINCT col2) AS "alias"`)
          .toString(),
      ).toEqual(sane`
        select col1, count(DISTINCT col2) AS "alias"
        from tbl
      `);
    });
  });

  describe('addToGroupBy', () => {
    it('add simple col to group by', () => {
      const sql = sane`
        select Count(*) from tbl
      `;

      expect(
        parseSqlQuery(sql)
          .addToGroupBy(SqlRef.factoryWithQuotes('col'))
          .toString(),
      ).toEqual(sane`
        select "col", Count(*) from tbl
        GROUP BY 1
      `);
    });

    it('no existing col', () => {
      const sql = sane`
        select col1 from tbl
      `;

      expect(
        parseSqlQuery(sql)
          .addToGroupBy(
            SqlAlias.factory(SqlFunction.factory('min', [SqlRef.factory('col1')]), 'MinColumn'),
          )
          .toString(),
      ).toEqual(sane`
        select min(col1) AS "MinColumn", col1 from tbl
        GROUP BY 1
      `);
    });

    it('existing cols in group by', () => {
      const sql = sane`
        select col1, min(col1) AS aliasName
        from tbl 
        GROUP BY 2
      `;

      expect(
        parseSqlQuery(sql)
          .addToGroupBy(
            SqlAlias.factory(SqlFunction.factory('max', [SqlRef.factory('col2')]), 'MaxColumn'),
          )
          .toString(),
      ).toEqual(sane`
        select max(col2) AS "MaxColumn", col1, min(col1) AS aliasName
        from tbl 
        GROUP BY 1, 3
      `);
    });
  });
});
