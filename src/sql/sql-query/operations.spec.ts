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

import { SqlColumn, SqlExpression, SqlQuery } from '../..';
import { sane } from '../../utils';

function stringifyExpressions(v: any) {
  return JSON.parse(JSON.stringify(v));
}

describe('SqlQuery operations', () => {
  describe('#makeExplain', () => {
    it('works', () => {
      const query = SqlQuery.parse(
        sane`
          SELECT __time FROM "wiki"
        `,
      );

      expect(String(query.makeExplain())).toEqual(sane`
        EXPLAIN PLAN FOR
        SELECT __time FROM "wiki"
      `);
    });
  });

  describe('#prependWith', () => {
    it('works when there is no WITH', () => {
      const withQuery = SqlQuery.parse(
        sane`
          SELECT * FROM "wikipedia"
          WHERE channel = 'en'
        `,
      );

      const query = SqlQuery.parse(
        sane`
          SELECT __time FROM "wiki"
        `,
      );

      expect(String(query.prependWith('wiki', withQuery))).toEqual(sane`
        WITH "wiki" AS (
          SELECT * FROM "wikipedia"
          WHERE channel = 'en'
        )
        SELECT __time FROM "wiki"
      `);
    });

    it('works when there is already a WITH', () => {
      const withQuery = SqlQuery.parse(
        sane`
          SELECT * FROM "wikipedia"
          WHERE channel = 'he'
        `,
      );

      const query = SqlQuery.parse(
        sane`
          WITH
            wiki AS (SELECT * FROM "wiki2" WHERE channel = 'en')
          SELECT __time FROM "wiki"
        `,
      );

      expect(String(query.prependWith('wiki2', withQuery))).toEqual(sane`
        WITH
          "wiki2" AS (
          SELECT * FROM "wikipedia"
          WHERE channel = 'he'
        ),
        wiki AS (SELECT * FROM "wiki2" WHERE channel = 'en')
        SELECT __time FROM "wiki"
      `);
    });

    it('works when there is an EXPLAIN', () => {
      const withQuery = SqlQuery.parse(
        sane`
          SELECT * FROM "wikipedia"
          WHERE channel = 'en'
        `,
      );

      const query = SqlQuery.parse(
        sane`
          EXPLAIN PLAN FOR
          SELECT __time FROM "wiki"
        `,
      );

      expect(String(query.prependWith('wiki', withQuery))).toEqual(sane`
        EXPLAIN PLAN FOR
        WITH "wiki" AS (
          SELECT * FROM "wikipedia"
          WHERE channel = 'en'
        )
        SELECT __time FROM "wiki"
      `);
    });
  });

  describe('#getFirstTableName', () => {
    it('works with simple query', () => {
      expect(
        SqlQuery.parse(
          sane`
            SELECT * FROM "github"
          `,
        ).getFirstTableName(),
      ).toEqual('github');
    });

    it('works with namespace', () => {
      expect(
        SqlQuery.parse(
          sane`
            SELECT * FROM sys."github"
          `,
        ).getFirstTableName(),
      ).toEqual('github');
    });

    it('works with namespace and alias', () => {
      expect(
        SqlQuery.parse(
          sane`
            SELECT * FROM sys."github" as Name
          `,
        ).getFirstTableName(),
      ).toEqual('github');
    });

    it('works with multiple tables', () => {
      expect(
        SqlQuery.parse(
          sane`
            SELECT * FROM sys."github" as test, sys.name
          `,
        ).getFirstTableName(),
      ).toEqual('github');
    });

    it('works with CTE', () => {
      expect(
        SqlQuery.parse(
          sane`
            WITH x AS (SELECT * FROM "wikipedia")
            SELECT * FROM x, sys."github" as test, sys.name
          `,
        ).getFirstTableName(),
      ).toEqual('wikipedia');
    });
  });

  describe('#getFirstSchema', () => {
    it('works in simple case', () => {
      expect(
        SqlQuery.parse(
          sane`
            SELECT * FROM sys."github"
          `,
        ).getFirstSchema(),
      ).toEqual('sys');
    });

    it('from column with no namespace', () => {
      expect(
        SqlQuery.parse(
          sane`
            SELECT * FROM "github"
          `,
        ).getFirstSchema(),
      ).toBeUndefined();
    });

    it('from multiple tables', () => {
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
        channel,
        SUBSTR(cityName, 1, 2),
        namespace AS s_namespace,
        TRANSFORM(countryName) AS "trans",
        COUNT(*),
        SUM(added) AS "Added"
      FROM wikipedia
      GROUP BY
        1.1, -- Yes the index can be non-whole, go figure
        namespace,
        SUBSTR(cityName, 1, 2),
        subspace,
        countryName
      ORDER BY channel, s_namespace Desc, COUNT(*), subspace ASC
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
        'TRANSFORM(countryName) AS "trans"',
      ]);
    });

    it('#getGroupingExpressionInfos', () => {
      expect(stringifyExpressions(query.getGroupingExpressionInfos())).toEqual([
        {
          expression: 'channel',
          orderByExpression: 'channel',
          outputColumn: 'channel',
          selectIndex: 0,
        },
        {
          expression: 'namespace',
          orderByExpression: 's_namespace Desc',
          outputColumn: 's_namespace',
          selectIndex: 2,
        },
        {
          expression: 'SUBSTR(cityName, 1, 2)',
          outputColumn: 'EXPR$1',
          selectIndex: 1,
        },
        {
          expression: 'subspace',
          orderByExpression: 'subspace ASC',
          selectIndex: -1,
        },
        {
          expression: 'countryName',
          selectIndex: -1,
        },
      ]);
    });

    it('#getGroupingExpressions', () => {
      expect(query.getGroupingExpressions()?.map(String)).toEqual([
        'channel',
        'namespace',
        'SUBSTR(cityName, 1, 2)',
        'subspace',
        'countryName',
      ]);
    });

    it('#getGroupedOutputColumns', () => {
      expect(query.getGroupedOutputColumns()).toEqual([
        'channel',
        'EXPR$1',
        's_namespace',
        'trans',
      ]);
    });

    it('#getAggregateSelectExpressions', () => {
      expect(query.getAggregateSelectExpressions().map(String)).toEqual([
        'COUNT(*)',
        'SUM(added) AS "Added"',
      ]);
    });

    it('#getAggregateOutputColumns', () => {
      expect(query.getAggregateOutputColumns()).toEqual(['EXPR$4', 'Added']);
    });

    it('#getEffectiveDirectionOfOutputColumn', () => {
      expect(String(query.getOrderByForOutputColumn('channel'))).toEqual('channel');
      expect(String(query.getOrderByForOutputColumn('s_namespace'))).toEqual('s_namespace Desc');
      expect(String(query.getOrderByForOutputColumn('Added'))).toEqual('undefined');
      expect(String(query.getOrderByForOutputColumn('lol'))).toEqual('undefined');
    });

    it('#getOrderedOutputColumns', () => {
      expect(query.getOrderedOutputColumns()).toEqual(['channel', 's_namespace', 'EXPR$4']);
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
          .addOrderBy(SqlColumn.create('col').toOrderByExpression('DESC'))
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        ORDER BY "col" DESC
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
          .addOrderBy(SqlColumn.create('colTwo').toOrderByExpression('ASC'))
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
          .addOrderBy(SqlColumn.create('colThree').toOrderByExpression())
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
          .addWhere(SqlExpression.parse(`col > 1`))
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
        WHERE col > 1
      `);
    });

    it('noop on TRUE', () => {
      expect(
        SqlQuery.parse(
          sane`
            SELECT *
            FROM sys."github"
          `,
        )
          .addWhere(SqlExpression.parse(`TRUE`))
          .toString(),
      ).toEqual(sane`
        SELECT *
        FROM sys."github"
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
          .addWhere(SqlExpression.parse(`colTwo > 2`))
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
          .addWhere(SqlExpression.parse(`colTwo > 2`))
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
          .addWhere(SqlExpression.parse(`colTwo > 2`))
          .addWhere()
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
        GROUP BY 1, 2.2, 4
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
        GROUP BY 1, 2.2
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

  describe('addGroupBy', () => {
    it('add simple expression to group by', () => {
      const sql = SqlQuery.parse(sane`
        select Count(*) from tbl
      `);

      expect(sql.addGroupBy(SqlColumn.create('col')).toString()).toEqual(sane`
        select Count(*) from tbl
        GROUP BY "col"
      `);
    });

    it('existing group by', () => {
      const sql = SqlQuery.parse(sane`
        select col1, min(col1) AS aliasName
        from tbl
        GROUP BY 2
      `);

      expect(sql.addGroupBy(SqlExpression.parse(`reverse(col2)`)).toString()).toEqual(sane`
        select col1, min(col1) AS aliasName
        from tbl
        GROUP BY 2, reverse(col2)
      `);
    });
  });

  describe('prettify', () => {
    it('misc query 1', () => {
      const sql = sane`
        Select
          Distinct col1    ||    lol
        From tbl
        Where col1 > 1 OR col2 > 2 AND col3 > 3
      `;

      expect(SqlQuery.parse(sql).prettify().toString()).toEqual(sane`
        SELECT DISTINCT col1 || lol
        FROM tbl
        WHERE col1 > 1 OR (col2 > 2 AND col3 > 3)
      `);

      expect(
        SqlQuery.parse(sql)
          .prettify({ keywordCasing: 'preserve', clarifyingParens: 'disable' })
          .toString(),
      ).toEqual(sane`
        Select Distinct col1 || lol
        From tbl
        Where col1 > 1 OR col2 > 2 AND col3 > 3
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

      expect(SqlQuery.parse(sql).prettify().toString()).toEqual(sane`
        SELECT
          col1 || lol,
          (MIN(col1) + SUM(kl)) AS aliasName,
          CONCAT(a, b, c),
          CASE A WHEN B THEN C WHEN D THEN E END AS m
        FROM tbl
        WHERE
          __time BETWEEN TIMESTAMP '2020-01-01' AND TIMESTAMP '2020-01-02' AND goo IS NOT NULL AND NOT TRUE
        GROUP BY 1
        ORDER BY 2 DESC, 3 ASC
        LIMIT 12
      `);

      expect(SqlQuery.parse(sql).prettify({ keywordCasing: 'preserve' }).toString()).toEqual(sane`
        Select
          col1 || lol,
          (Min(col1) + Sum(kl)) AS aliasName,
          Concat(a, b, c),
          Case A When B Then C WheN D Then E End As m
        From tbl
        Where
          __time Between Timestamp '2020-01-01' And Timestamp '2020-01-02' AND goo is not Null AND NoT True
        Group By 1
        Order By 2 Desc, 3 asC
        LimIT 12
      `);
    });

    it('nested query', () => {
      const sql = sane`
        WITH
        "kttm" AS (SELECT *
        FROM "kttm-1"),
        "kttm2" AS (SELECT *
        FROM "kttm-2")
        SELECT
          NULLIF("b"."browser", '__NULL__') AS "browser",
          "b"."cnt" AS "cnt",
          "n0_0"."DAU" AS "DAU",
          "n1_0"."DAU over 2DAU" / "n1_1"."DAU over 2DAU" AS "DAU over 2DAU"
        FROM (
          SELECT
            NVL(t."browser", '__NULL__') AS "browser",
            COUNT(*) AS "cnt"
          FROM "kttm" AS "t"
          WHERE t."adblock_list" = 'NoAdblock'
          GROUP BY 1
          ORDER BY 2
          LIMIT 10) AS "b"
        INNER JOIN (
          SELECT
          "t"."browser",
          AVG(a1) AS "DAU"
        FROM (
          SELECT
            NVL(t."browser", '__NULL__') AS "browser",
            COUNT(DISTINCT t."forwarded_for") AS "a1"
          FROM "kttm" AS "t"
          WHERE t."adblock_list" = 'NoAdblock'
          GROUP BY 1, TIME_FLOOR(t.__time, 'P1D')
        ) AS "t"
        GROUP BY 1) AS "n0_0" ON "b"."browser" = "n0_0"."browser"
        INNER JOIN (SELECT
          "t"."browser",
          AVG(a1) AS "DAU over 2DAU"
        FROM (SELECT
          NVL(t."browser", '__NULL__') AS "browser",
          COUNT(DISTINCT t."forwarded_for") AS "a1"
        FROM "kttm" AS "t"
        WHERE t."adblock_list" = 'NoAdblock'
        GROUP BY 1, TIME_FLOOR(t.__time, 'P1D')) AS "t"
        GROUP BY 1) AS "n1_0" ON "b"."browser" = "n1_0"."browser"
        INNER JOIN (SELECT
          "t"."browser",
          AVG(a1) AS "DAU over 2DAU"
        FROM (SELECT
          NVL(t."browser", '__NULL__') AS "browser",
          COUNT(DISTINCT t."forwarded_for") AS "a1"
        FROM "kttm" AS "t"
        WHERE t."adblock_list" = 'NoAdblock'
        GROUP BY 1, TIME_FLOOR(t.__time, 'P2D')) AS "t"
        GROUP BY 1) AS "n1_1" ON "b"."browser" = "n1_1"."browser"
      `;

      expect(SqlQuery.parse(sql).prettify().toString()).toEqual(sane`
        WITH
        "kttm" AS (
          SELECT *
          FROM "kttm-1"
        ),
        "kttm2" AS (
          SELECT *
          FROM "kttm-2"
        )
        SELECT
          NULLIF("b"."browser", '__NULL__') AS "browser",
          "b"."cnt" AS "cnt",
          "n0_0"."DAU" AS "DAU",
          "n1_0"."DAU over 2DAU" / "n1_1"."DAU over 2DAU" AS "DAU over 2DAU"
        FROM (
          SELECT
            NVL(t."browser", '__NULL__') AS "browser",
            COUNT(*) AS "cnt"
          FROM "kttm" AS "t"
          WHERE t."adblock_list" = 'NoAdblock'
          GROUP BY 1
          ORDER BY 2
          LIMIT 10
        ) AS "b"
        INNER JOIN (
          SELECT
            "t"."browser",
            AVG(a1) AS "DAU"
          FROM (
            SELECT
              NVL(t."browser", '__NULL__') AS "browser",
              COUNT(DISTINCT t."forwarded_for") AS "a1"
            FROM "kttm" AS "t"
            WHERE t."adblock_list" = 'NoAdblock'
            GROUP BY 1, TIME_FLOOR(t.__time, 'P1D')
          ) AS "t"
          GROUP BY 1
        ) AS "n0_0" ON "b"."browser" = "n0_0"."browser"
        INNER JOIN (
          SELECT
            "t"."browser",
            AVG(a1) AS "DAU over 2DAU"
          FROM (
            SELECT
              NVL(t."browser", '__NULL__') AS "browser",
              COUNT(DISTINCT t."forwarded_for") AS "a1"
            FROM "kttm" AS "t"
            WHERE t."adblock_list" = 'NoAdblock'
            GROUP BY 1, TIME_FLOOR(t.__time, 'P1D')
          ) AS "t"
          GROUP BY 1
        ) AS "n1_0" ON "b"."browser" = "n1_0"."browser"
        INNER JOIN (
          SELECT
            "t"."browser",
            AVG(a1) AS "DAU over 2DAU"
          FROM (
            SELECT
              NVL(t."browser", '__NULL__') AS "browser",
              COUNT(DISTINCT t."forwarded_for") AS "a1"
            FROM "kttm" AS "t"
            WHERE t."adblock_list" = 'NoAdblock'
            GROUP BY 1, TIME_FLOOR(t.__time, 'P2D')
          ) AS "t"
          GROUP BY 1
        ) AS "n1_1" ON "b"."browser" = "n1_1"."browser"
      `);
    });
  });
});
