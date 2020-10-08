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

import { SqlAlias, SqlExpression, SqlFunction, SqlQuery, SqlRef } from '../..';
import { sane } from '../../test-utils';

describe('SqlQuery operations', () => {
  describe('#getFirstTableName', () => {
    it('getFirstTableNames', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT * FROM "github"
        `,
        ).getFirstTableName(),
      ).toEqual('github');
    });

    it('getFirstTableName with nameSpace', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT * FROM sys."github"
        `,
        ).getFirstTableName(),
      ).toEqual('github');
    });

    it('getFirstTableName with nameSpace and alias', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT * FROM sys."github" as Name
        `,
        ).getFirstTableName(),
      ).toEqual('github');
    });

    it('getFirstTableName with multiple tables', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT * FROM sys."github" as test, sys.name
        `,
        ).getFirstTableName(),
      ).toEqual('github');
    });
  });

  describe('#getFirstSchema', () => {
    it('getFirstSchema', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT * FROM sys."github"
        `,
        ).getFirstSchema(),
      ).toEqual('sys');
    });

    it('getFirstSchema from SqlRef with no nameSpace', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT * FROM "github"
        `,
        ).getFirstSchema(),
      ).toBeUndefined();
    });

    it('getFirstSchema from multiple tables', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT * FROM "github", sys."table"
        `,
        ).getFirstSchema(),
      ).toEqual('sys');
    });
  });

  describe('output columns', () => {
    const query = SqlQuery.parse(sane`
      SELECT
        channel, SUBSTR(cityName, 1, 2), namespace AS s_namespace,
        COUNT(*), SUM(added) AS "Added"            
      FROM wikipedia
      GROUP BY 1, namespace, SUBSTR(cityName, 1, 2)
      ORDER BY channel, s_namespace Desc, COUNT(*)
      LIMIT 5 
    `);

    it('#getSelectIndexForExpression', () => {
      expect(query.getSelectIndexForExpression(SqlExpression.parse('channel'), false)).toEqual(0);
      expect(
        query.getSelectIndexForExpression(SqlExpression.parse('SUBSTR(cityName, 1, 2)'), false),
      ).toEqual(1);
      expect(query.getSelectIndexForExpression(SqlExpression.parse('s_namespace'), false)).toEqual(
        -1,
      );
      expect(query.getSelectIndexForExpression(SqlExpression.parse('s_namespace'), true)).toEqual(
        2,
      );
    });

    it('#getGroupedSelectExpressions', () => {
      expect(query.getGroupedSelectExpressions().map(String)).toEqual([
        'channel',
        'SUBSTR(cityName, 1, 2)',
        'namespace AS s_namespace',
      ]);
    });

    it('#getGroupedOutputColumns', () => {
      expect(query.getGroupedOutputColumns()).toEqual(['channel', 'EXPR$1', 's_namespace']);
    });

    it('#getAggregateSelectExpressions', () => {
      expect(query.getAggregateSelectExpressions().map(String)).toEqual([
        'COUNT(*)',
        'SUM(added) AS "Added"',
      ]);
    });

    it('#getAggregateOutputColumns', () => {
      expect(query.getAggregateOutputColumns()).toEqual(['EXPR$3', 'Added']);
    });

    it('#getEffectiveDirectionOfOutputColumn', () => {
      expect(String(query.getOrderByForOutputColumn('channel'))).toEqual('channel');
      expect(String(query.getOrderByForOutputColumn('s_namespace'))).toEqual('s_namespace Desc');
      expect(String(query.getOrderByForOutputColumn('Added'))).toEqual('undefined');
      expect(String(query.getOrderByForOutputColumn('lol'))).toEqual('undefined');
    });

    it('#getOrderedOutputColumns', () => {
      expect(query.getOrderedOutputColumns()).toEqual(['channel', 's_namespace', 'EXPR$3']);
    });
  });

  describe('orderBy', () => {
    it('no ORDER BY clause', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT *
          FROM sys."github"
        `,
        )
          .addOrderBy(SqlRef.column('col').toOrderByPart('DESC'))
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        ORDER BY col DESC
      `);
    });

    it('add to ORDER BY clause', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT *
          FROM sys."github"
          ORDER BY col
        `,
        )
          .addOrderBy(SqlRef.columnWithQuotes('colTwo').toOrderByPart('ASC'))
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        ORDER BY "colTwo" ASC, col
      `);
    });

    it('ORDER BY without direction', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT *
          FROM sys."github"
          ORDER BY col, colTwo ASC
        `,
        )
          .addOrderBy(SqlRef.columnWithQuotes('colThree').toOrderByPart())
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        ORDER BY "colThree", col, colTwo ASC
      `);
    });
  });

  describe('#addWhere', () => {
    it('no initial where', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT *
          FROM sys."github"
        `,
        )
          .addToWhere(`col > 1`)
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        WHERE col > 1
      `);
    });

    it('Single Where filter value', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT *
          FROM sys."github"
          WHERE col > 1
        `,
        )
          .addToWhere(`colTwo > 2`)
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        WHERE col > 1 AND colTwo > 2
      `);
    });

    it('OR Where filter value', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT *
          FROM sys."github" WHERE col > 1 OR col < 5
        `,
        )
          .addToWhere(`colTwo > 2`)
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github" WHERE (col > 1 OR col < 5) AND colTwo > 2
      `);
    });

    it('AND Where filter value', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT *
          FROM sys."github" WHERE (col > 1 OR col < 5) AND colTwo > 5
        `,
        )
          .addToWhere(`colTwo > 2`)
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github" WHERE (col > 1 OR col < 5) AND colTwo > 5 AND colTwo > 2
      `);
    });
  });

  describe('#removeOutputColumn', () => {
    it('basic cols', () => {
      const query = SqlQuery.parse(sane`
        SELECT col0, col1, col2 
        FROM github
      `);

      expect(query.removeOutputColumn('col0').toString()).toEqual(sane`
        SELECT col1, col2 
        FROM github
      `);

      expect(query.removeOutputColumn('col1').toString()).toEqual(sane`
        SELECT col0, col2 
        FROM github
      `);

      expect(query.removeOutputColumn('col2').toString()).toEqual(sane`
        SELECT col0, col1 
        FROM github
      `);
    });

    it(`removes from group by and ORDER BY`, () => {
      const query = SqlQuery.parse(sane`
        SELECT col0, col1, SUM(a), col2 
        FROM github
        GROUP BY 1, 2, 4
        ORDER BY 2
      `);

      expect(query.removeOutputColumn('col0').toString()).toEqual(sane`
        SELECT col1, SUM(a), col2 
        FROM github
        GROUP BY 1, 3
        ORDER BY 1
      `);

      expect(query.removeOutputColumn('col1').toString()).toEqual(sane`
        SELECT col0, SUM(a), col2 
        FROM github
        GROUP BY 1, 3
      `);

      expect(query.removeOutputColumn('col2').toString()).toEqual(sane`
        SELECT col0, col1, SUM(a) 
        FROM github
        GROUP BY 1, 2
        ORDER BY 2
      `);
    });
  });

  describe.skip('remove functions', () => {
    it('remove col from where', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col AND col2
        `,
        )
          .removeColumnFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github"
        Where col2"
      `);
    });

    it('remove only col from where', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 = '1'
        `,
        )
          .removeColumnFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github""
      `);
    });

    it('remove multiple filters for the same col', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 > '1' AND col2 < '1'
        `,
        )
          .removeColumnFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github"
        Where col2 > '1',col2 < '1'"
      `);
    });

    it('remove multiple filters for the same col', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 > '1' AND col1 > 2 OR col2 < '1'
        `,
        )
          .removeColumnFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Where col1 > 2"
      `);
    });

    it('remove only comparison expression from where', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 > 1
        `,
        )
          .removeColumnFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github""
      `);
    });

    it('remove only comparison expression from where', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Where col2 > 1 AND col1 > 1
        `,
        )
          .removeColumnFromWhere('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github"
        Where col2 > 1"
      `);
    });

    it('remove only col from having', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Having col2 > 1
        `,
        )
          .removeFromHaving('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github""
      `);
    });

    it('remove only comparison expression from having 1', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Having col2 > 1
        `,
        )
          .removeFromHaving('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0,col1,col2
        FROM sys."github""
      `);
    });

    it('remove only comparison expression from having 2', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Having col2 > 1 AND col1 > 1
        `,
        )
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
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Order By col, 2 ASC
        `,
        )
          .removeOrderByForOutputColumn('col')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Order By 2 ASC"
      `);
    });

    it('remove col not in ORDER BY', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Order By col, col1 ASC
        `,
        )
          .removeOrderByForOutputColumn('col2')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Order By col, col1 ASC"
      `);
    });

    it('remove one numbered col not in ORDER BY', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Order By col, 3 ASC
        `,
        )
          .removeOrderByForOutputColumn('col1')
          .toString(),
      ).toEqual(sane`
        SELECT col0, col1, col2
        FROM sys."github"
        Order By col, 3 ASC"
      `);
    });

    it('remove only col in ORDER BY', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT col0, col1, col2
          FROM sys."github"
          Order By col1
        `,
        )
          .removeOrderByForOutputColumn('col1')
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

      expect(SqlQuery.parse(sql).getAggregateOutputColumns()).toEqual(['col0', 'aggregated']);
    });

    it('get all aggregate cols using numbers', () => {
      const sql = sane`
        SELECT col0, SUM(col1) As aggregated, col2
        FROM sys."github"
        Group By col2,  1, 3
      `;

      expect(SqlQuery.parse(sql).getAggregateOutputColumns()).toEqual(['aggregated']);
    });
  });

  describe('addColumn', () => {
    it('single col', () => {
      const sql = sane`
        select col1
        from tbl
      `;

      expect(
        SqlQuery.parse(sql)
          .addSelectExpression('min(col2) AS "alias"')
          .toString(),
      ).toEqual(sane`
        select col1,
          min(col2) AS "alias"
        from tbl
      `);
    });

    it('function with decorator', () => {
      const sql = sane`
        select col1
        from tbl
      `;

      expect(
        SqlQuery.parse(sql)
          .addSelectExpression(`count(DISTINCT col2) AS "alias"`)
          .toString(),
      ).toEqual(sane`
        select col1,
          count(DISTINCT col2) AS "alias"
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
        SqlQuery.parse(sql)
          .addToGroupBy(SqlRef.columnWithQuotes('col'))
          .toString(),
      ).toEqual(sane`
        select "col",
          Count(*) from tbl
        GROUP BY 1
      `);
    });

    it('no existing col', () => {
      const sql = sane`
        select col1 from tbl
      `;

      expect(
        SqlQuery.parse(sql)
          .addToGroupBy(
            SqlAlias.create(SqlFunction.simple('min', [SqlRef.column('col1')]), 'MinColumn'),
          )
          .toString(),
      ).toEqual(sane`
        select min(col1) AS "MinColumn",
          col1 from tbl
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
        SqlQuery.parse(sql)
          .addToGroupBy(
            SqlAlias.create(SqlFunction.simple('max', [SqlRef.column('col2')]), 'MaxColumn'),
          )
          .toString(),
      ).toEqual(sane`
        select max(col2) AS "MaxColumn", col1, min(col1) AS aliasName
        from tbl 
        GROUP BY 1, 3
      `);
    });
  });

  describe('prettify', () => {
    it('misc query 1', () => {
      const sql = sane`
        Select  
          Distinct col1    ||    lol
        From tbl       
      `;

      expect(
        SqlQuery.parse(sql)
          .prettify()
          .toString(),
      ).toEqual(sane`
        SELECT DISTINCT col1 || lol
        FROM tbl
      `);
    });

    it('misc query 2', () => {
      const sql = sane`
        Select   col1    ||    lol  ,  ( Min(col1)   +   Sum(kl)  )  AS   aliasName   ,
        Concat(   a      ,   b,          c    ),
        Case   A
          When   B   Then    C
          WheN   D   Then    E
          End   As m
        From tbl
        Where   __time  Between  Timestamp  '2020-01-01'  And  Timestamp  '2020-01-02'  And   goo   is  not  Null  aNd NoT True
        Group    By   1
        Order  By   2   Desc  ,  3
        asC   LimIT  12
      `;

      expect(
        SqlQuery.parse(sql)
          .prettify()
          .toString(),
      ).toEqual(sane`
        SELECT
          col1 || lol,
          (MIN(col1) + SUM(kl)) AS aliasName,
          CONCAT(a, b, c),
          CASE A WHEN B THEN C WHEN D THEN E END AS m
        FROM tbl
        WHERE __time BETWEEN TIMESTAMP '2020-01-01' AND TIMESTAMP '2020-01-02' AND goo IS NOT NULL AND NOT TRUE
        GROUP BY 1
        ORDER BY 2 DESC, 3 ASC
        LIMIT 12
      `);
    });
  });
});
