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
  RefName,
  SqlCase,
  SqlColumn,
  SqlColumnList,
  SqlExpression,
  SqlFunction,
  SqlLiteral,
  SqlQuery,
  SqlTable,
} from '../..';
import { backAndForth } from '../../test-utils';
import { sane } from '../../utils';

describe('SqlQuery', () => {
  it('things that work', () => {
    const queries: string[] = [
      `Select nottingham from tbl`,
      `Select 3; ; ;`,
      `Select PI as "pi"`,
      `Select * from tbl`,
      `Select * from tbl Limit 10`,
      `Select * from tbl Limit 10 offset 5`,
      `(Select * from tbl)`,
      `Select count(*) As sums from tbl`,
      `Select count(*) As sums from tbl GROUP BY ( )`,
      `SELECT comment, page, COUNT(*) AS "Count" FROM wikipedia GROUP BY (comment, page) ORDER BY 3 DESC`,
      `SELECT comment, page, COUNT(*) AS "Count" FROM wikipedia GROUP BY ROLLUP (comment, page) ORDER BY 3 DESC`,
      `SELECT distinct dim1 FROM druid.foo`,
      `SET a = 1;set B = 'lol';SELECT distinct dim1 FROM druid.foo`,
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
          flags, channel, user, "timestamp",
          SUM(sum_added) AS Added
        FROM wikipedia
        GROUP BY 1, 2, 3, 4
        ORDER BY 4 DESC
      `,
      `SELECT w1."channel" FROM "wikipedia" w1 JOIN "wikipedia2" w2 ON w1."channel" = w2."channel"`,
      `SELECT w1."channel" FROM "wikipedia" w1 NATURAL JOIN "wikipedia2" w2`,
      `SELECT w1."channel" FROM "wikipedia" w1 NATURAL LEFT JOIN "wikipedia2" w2`,
      sane`
        Explain Plan For
        SELECT * FROM wikipedia t
      `,
      sane`
        Insert Into "new_table"
        SELECT * FROM wikipedia t
      `,
      sane`
        Explain Plan For
        Insert Into "new_table"
        SELECT * FROM wikipedia t
      `,
      sane`
        INSERT INTO "tbl2"
        SELECT *
        FROM tbl
        PARTITIONED  BY   ALL
      `,
      sane`
        INSERT INTO "tbl2"
        SELECT *
        FROM tbl
        LIMIT 100
        PARTITIONED  BY   ALL    TIME
        CLUSTERED BY  "hello"
      `,
      sane`
        Replace Into "tbl2"  Overwrite  All
        SELECT *
        FROM tbl
        PARTITIONED  BY   ALL
      `,
      sane`
        Replace Into "tbl2"  Overwrite  Where  TIME_FLOOR(__time) = TIMESTAMP '2020-01-01'
        SELECT *
        FROM tbl
        LIMIT 100
        PARTITIONED  BY   ALL    TIME
        CLUSTERED BY  "hello"
      `,
      sane`
        INSERT INTO
          EXTERN(
            S3(bucket => 'your_bucket', "prefix"=>'prefix/to/files')
          )
        AS CSV
        SELECT *
        FROM tbl
        LIMIT 100
      `,
      sane`
        SELECT
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
        UNION ALL
        SELECT
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
      `,
      sane`
        SET a = 1;
        set B = 'lol';
        SELECT 1 + 1
      `,
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql, SqlQuery);
      } catch (e) {
        console.log(`Problem with: \`${sql}\``);
        throw e;
      }
    }
  });

  it('things that do not work', () => {
    const queries: string[] = [
      `Select nottingham from table`,
      `Selec 3`,
      `(Select * from tbl`,
      `Select count(*) As count from tbl`,
      `Select * from tbl SELECT`,
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

  it('errors on parse if there are INSERT and REPLACE clauses', () => {
    expect(() => {
      SqlQuery.parse(sane`
        INSERT Into "tbl2"
        Replace Into "tbl2"  Overwrite  Where  TIME_FLOOR(__time) = TIMESTAMP '2020-01-01'
        SELECT *
        FROM tbl
        LIMIT 100
        PARTITIONED  BY   ALL    TIME
        CLUSTERED BY  "hello"
    `);
    }).toThrowError('Can not have both an INSERT and a REPLACE clause');
  });

  describe('.create', () => {
    it('works', () => {
      expect(String(SqlQuery.create(SqlTable.create('lol')))).toEqual(sane`
        SELECT *
        FROM "lol"
      `);
    });

    it('works in advanced case', () => {
      const query = SqlQuery.create(SqlQuery.create(SqlTable.create('lol')))
        .changeSelectExpressions([
          SqlColumn.create('channel'),
          SqlColumn.create('page'),
          SqlColumn.create('user'),
          SqlColumn.create('as'),
        ])
        .changeWhereExpression(SqlExpression.parse(`channel  =  '#en.wikipedia'`));

      expect(String(query)).toEqual(sane`
        SELECT
          "channel",
          "page",
          "user",
          "as"
        FROM (
          SELECT *
          FROM "lol"
        )
        WHERE channel  =  '#en.wikipedia'
      `);
    });
  });

  describe('.from', () => {
    it('works', () => {
      expect(String(SqlQuery.from(SqlTable.optionalQuotes('lol')))).toEqual(sane`
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
            if (x instanceof SqlColumn) {
              return x.changeName(x.getName() + '_lol');
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
        "WHERE datasource IN ('moon', 'beam') AND 'druid' = schema",
        "datasource IN ('moon', 'beam') AND 'druid' = schema",
        "datasource IN ('moon', 'beam')",
        'datasource',
        "('moon', 'beam')",
        "'moon'",
        "'beam'",
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
        'FROM sys.segments',
        'datasource',
        "'moon'",
        "'beam'",
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
        if (x instanceof SqlColumn) {
          return x.changeName(`_${x.getName()}_`);
        }
        if (x instanceof SqlLiteral && x.getStringValue()) {
          return SqlLiteral.create(`[${x.getStringValue()}]`);
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
        'FROM sys.segments',
        'datasource',
        "'moon'",
        "'beam'",
        "('[moon]', '[beam]')",
        "_datasource_ IN ('[moon]', '[beam]')",
        "'druid'",
        'schema',
        "'[druid]' = _schema_",
        "_datasource_ IN ('[moon]', '[beam]') AND '[druid]' = _schema_",
        "WHERE _datasource_ IN ('[moon]', '[beam]') AND '[druid]' = _schema_",
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
        'SELECT\n  _datasource_ d,\n  SUM("_size_") AS total_size,\n  CASE WHEN SUM("_size_") = 0 THEN 0 ELSE SUM("_size_") END AS avg_size,\n  CASE WHEN SUM(_num_rows_) = 0 THEN 0 ELSE SUM("_num_rows_") END AS avg_num_rows,\n  COUNT(*) AS num_segments\nFROM sys.segments\nWHERE _datasource_ IN (\'[moon]\', \'[beam]\') AND \'[druid]\' = _schema_\nGROUP BY _datasource_\nHAVING _total_size_ > 100\nORDER BY _datasource_ DESC, 2 ASC\nLIMIT 100',
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

  describe('#changeInsertIntoTable', () => {
    const sql = SqlQuery.parse(`SELECT * FROM wikipedia t`);

    it('works', () => {
      const insertSql = sql.changeInsertIntoTable('hello');

      expect(insertSql.insertClause).toMatchInlineSnapshot(`
        SqlInsertClause {
          "columns": undefined,
          "format": undefined,
          "keywords": Object {},
          "parens": undefined,
          "spacing": Object {},
          "table": SqlTable {
            "keywords": Object {},
            "namespace": undefined,
            "parens": undefined,
            "refName": RefName {
              "name": "hello",
              "quotes": true,
            },
            "spacing": Object {},
            "type": "table",
          },
          "type": "insertClause",
        }
      `);

      expect(String(insertSql.changeInsertIntoTable('"lol"').insertClause)).toEqual(
        `INSERT INTO """lol"""`,
      );
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
      const select = SqlExpression.parse(`"new_column" AS "New column"`);
      expect(sql.addSelect(select).toString()).toEqual(sane`
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
      const select = SqlExpression.parse(`"new_column" AS "New column"`);
      expect(sql.addSelect(select, { insertIndex: 0 }).toString()).toEqual(sane`
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
      const select = SqlExpression.parse(`UPPER(city) AS City`);
      expect(
        sql.addSelect(select, { insertIndex: 'last-grouping', addToGroupBy: 'end' }).toString(),
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

    it('adds grouped with expression', () => {
      const select = SqlExpression.parse(`UPPER(city) AS City`);
      expect(
        sql
          .addSelect(select, {
            insertIndex: 'last-grouping',
            groupByExpression: SqlExpression.parse(`SUBSTR(city, 1, 2)`),
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
        GROUP BY 1, 2, 3, SUBSTR(city, 1, 2)
        ORDER BY 5 DESC
      `);
    });

    it('adds sorted', () => {
      const select = SqlExpression.parse(`COUNT(DISTINCT "user") AS unique_users`);
      expect(
        sql
          .addSelect(select, {
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
      const select = SqlExpression.parse(`UPPER(city) AS City`);
      expect(
        sql
          .addSelect(select, {
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

    it('works when there is a UNION ALL', () => {
      const sql = SqlQuery.parse(sane`
        SELECT
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
        UNION ALL
        SELECT
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
      `);

      const select = SqlExpression.parse(`UPPER(city) AS City`);
      expect(
        sql
          .addSelect(select, {
            insertIndex: 'last-grouping',
            addToGroupBy: 'end',
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
        UNION ALL
        SELECT
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
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
      const select = SqlExpression.parse(`"new_column" AS "New column"`);
      expect(sql.changeSelect(2, select).toString()).toEqual(sane`
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

  describe('#changeDecorator', () => {
    it('works', () => {
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
      expect(sql.changeDecorator('ALL').toString()).toEqual(sane`
        SELECT
          ALL
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
        ORDER BY 4 DESC
      `);
      expect(sql.changeDecorator('DISTINCT').toString()).toEqual(sane`
        SELECT
          DISTINCT
          isAnonymous,
          cityName,
          flags,
          COUNT(*) AS "Count",
          SUM(added) AS "sum_added"
        FROM wikipedia
        GROUP BY 1, 2, 3
        ORDER BY 4 DESC
      `);
    });
    it('can remove an existing decorator', () => {
      const sql = SqlQuery.parse(sane`
      SELECT
      ALL
        isAnonymous,
        cityName,
        flags,
        COUNT(*) AS "Count",
        SUM(added) AS "sum_added"
      FROM (
        SELECT * FROM wikipedia
      ) t
      GROUP BY 1, 2, 3
      ORDER BY 4 DESC
    `);
      expect(sql.changeDecorator(undefined).toString()).toEqual(sane`
      SELECT
      isAnonymous,
        cityName,
        flags,
        COUNT(*) AS "Count",
        SUM(added) AS "sum_added"
      FROM (
        SELECT * FROM wikipedia
      ) t
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

  describe('#hasStarInSelect', () => {
    it('works when there is no star', () => {
      const sql = SqlQuery.parse(sane`
        SELECT
          isAnonymous,
          cityName
        FROM wikipedia
      `);

      expect(sql.hasStarInSelect()).toBe(false);
    });

    it('works when there is a star', () => {
      const sql = SqlQuery.parse(sane`
        SELECT
          *,
          cityName
        FROM wikipedia
      `);

      expect(sql.hasStarInSelect()).toBe(true);
    });

    it('works when there is a star from a table', () => {
      const sql = SqlQuery.parse(sane`
        SELECT
          t.*,
          cityName
        FROM wikipedia AS t
      `);

      expect(sql.hasStarInSelect()).toBe(true);
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
          if (x instanceof SqlColumn) {
            if (x.getTableName() === 't') {
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
        "clusteredByClause": undefined,
        "contextStatements": undefined,
        "decorator": undefined,
        "explain": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlQuery {
                "clusteredByClause": undefined,
                "contextStatements": undefined,
                "decorator": undefined,
                "explain": undefined,
                "fromClause": SqlFromClause {
                  "expressions": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlTable {
                        "keywords": Object {},
                        "namespace": SqlNamespace {
                          "keywords": Object {},
                          "parens": undefined,
                          "refName": RefName {
                            "name": "druid",
                            "quotes": false,
                          },
                          "spacing": Object {},
                          "type": "namespace",
                        },
                        "parens": undefined,
                        "refName": RefName {
                          "name": "foo",
                          "quotes": false,
                        },
                        "spacing": Object {
                          "postDot": "",
                          "postNamespace": "",
                        },
                        "type": "table",
                      },
                    ],
                  },
                  "joinParts": undefined,
                  "keywords": Object {
                    "from": "FROM",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postFrom": " ",
                  },
                  "type": "fromClause",
                },
                "groupByClause": undefined,
                "havingClause": undefined,
                "insertClause": undefined,
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
                        "expression": SqlColumn {
                          "keywords": Object {},
                          "parens": undefined,
                          "refName": RefName {
                            "name": "__time",
                            "quotes": false,
                          },
                          "spacing": Object {},
                          "table": undefined,
                          "type": "column",
                        },
                        "keywords": Object {
                          "direction": "DESC",
                        },
                        "parens": undefined,
                        "spacing": Object {
                          "preDirection": " ",
                        },
                        "type": "orderByExpression",
                      },
                    ],
                  },
                  "keywords": Object {
                    "orderBy": "ORDER BY",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postOrderBy": " ",
                  },
                  "type": "orderByClause",
                },
                "parens": Array [
                  Object {
                    "leftSpacing": "",
                    "rightSpacing": "",
                  },
                ],
                "partitionedByClause": undefined,
                "replaceClause": undefined,
                "selectExpressions": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "dim1",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                  ],
                },
                "spacing": Object {
                  "postSelect": " ",
                  "preFromClause": " ",
                  "preOrderByClause": " ",
                },
                "type": "query",
                "unionQuery": undefined,
                "whereClause": undefined,
                "withClause": undefined,
              },
            ],
          },
          "joinParts": undefined,
          "keywords": Object {
            "from": "FROM",
          },
          "parens": undefined,
          "spacing": Object {
            "postFrom": " ",
          },
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "insertClause": undefined,
        "keywords": Object {
          "select": "SELECT",
        },
        "limitClause": SqlLimitClause {
          "keywords": Object {
            "limit": "LIMIT",
          },
          "limit": SqlLiteral {
            "keywords": Object {},
            "parens": undefined,
            "spacing": Object {},
            "stringValue": "2",
            "type": "literal",
            "value": 2,
          },
          "parens": undefined,
          "spacing": Object {
            "postLimit": " ",
          },
          "type": "limitClause",
        },
        "offsetClause": undefined,
        "orderByClause": undefined,
        "parens": undefined,
        "partitionedByClause": undefined,
        "replaceClause": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlStar {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "table": undefined,
              "type": "star",
            },
          ],
        },
        "spacing": Object {
          "postSelect": " ",
          "preFromClause": " ",
          "preLimitClause": " ",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
        "withClause": undefined,
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
        "clusteredByClause": undefined,
        "contextStatements": undefined,
        "decorator": undefined,
        "explain": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlTable {
                "keywords": Object {},
                "namespace": SqlNamespace {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "sys",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "namespace",
                },
                "parens": undefined,
                "refName": RefName {
                  "name": "segments",
                  "quotes": false,
                },
                "spacing": Object {
                  "postDot": "",
                  "postNamespace": "",
                },
                "type": "table",
              },
            ],
          },
          "joinParts": undefined,
          "keywords": Object {
            "from": "FROM",
          },
          "parens": undefined,
          "spacing": Object {
            "postFrom": " ",
          },
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "insertClause": undefined,
        "keywords": Object {
          "select": "SELECT",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "parens": undefined,
        "partitionedByClause": undefined,
        "replaceClause": undefined,
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
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "datasource",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
            SqlAlias {
              "alias": RefName {
                "name": "total_size",
                "quotes": false,
              },
              "columns": undefined,
              "expression": SqlFunction {
                "args": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "size",
                        "quotes": true,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                  ],
                },
                "decorator": undefined,
                "extendClause": undefined,
                "functionName": RefName {
                  "name": "SUM",
                  "quotes": false,
                },
                "keywords": Object {},
                "namespace": undefined,
                "parens": undefined,
                "spacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "specialParen": undefined,
                "type": "function",
                "whereClause": undefined,
                "windowSpec": undefined,
              },
              "keywords": Object {
                "as": "AS",
              },
              "parens": undefined,
              "spacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
              "type": "alias",
            },
            SqlAlias {
              "alias": RefName {
                "name": "num_segments",
                "quotes": false,
              },
              "columns": undefined,
              "expression": SqlFunction {
                "args": SeparatedArray {
                  "separators": Array [],
                  "values": Array [
                    SqlStar {
                      "keywords": Object {},
                      "parens": undefined,
                      "spacing": Object {},
                      "table": undefined,
                      "type": "star",
                    },
                  ],
                },
                "decorator": undefined,
                "extendClause": undefined,
                "functionName": RefName {
                  "name": "COUNT",
                  "quotes": false,
                },
                "keywords": Object {},
                "namespace": undefined,
                "parens": undefined,
                "spacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "specialParen": undefined,
                "type": "function",
                "whereClause": undefined,
                "windowSpec": undefined,
              },
              "keywords": Object {
                "as": "AS",
              },
              "parens": undefined,
              "spacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
              "type": "alias",
            },
          ],
        },
        "spacing": Object {
          "postSelect": "
        ",
          "preFromClause": "
      ",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
        "withClause": undefined,
      }
    `);
  });

  it('Simple select with Explain', () => {
    const sql = `Explain plan for Select * from tbl`;

    backAndForth(sql);

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "clusteredByClause": undefined,
        "contextStatements": undefined,
        "decorator": undefined,
        "explain": true,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlTable {
                "keywords": Object {},
                "namespace": undefined,
                "parens": undefined,
                "refName": RefName {
                  "name": "tbl",
                  "quotes": false,
                },
                "spacing": Object {},
                "type": "table",
              },
            ],
          },
          "joinParts": undefined,
          "keywords": Object {
            "from": "from",
          },
          "parens": undefined,
          "spacing": Object {
            "postFrom": " ",
          },
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "insertClause": undefined,
        "keywords": Object {
          "explainPlanFor": "Explain plan for",
          "select": "Select",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "parens": undefined,
        "partitionedByClause": undefined,
        "replaceClause": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlStar {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "table": undefined,
              "type": "star",
            },
          ],
        },
        "spacing": Object {
          "postExplainPlanFor": " ",
          "postSelect": " ",
          "preFromClause": " ",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
        "withClause": undefined,
      }
    `);
  });

  it('Simple select with With', () => {
    const sql = sane`
      WITH dept_count AS (
        SELECT deptno
        FROM   emp)
      Select * from tbl As t
    `;

    backAndForth(sql);

    expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "clusteredByClause": undefined,
        "contextStatements": undefined,
        "decorator": undefined,
        "explain": undefined,
        "fromClause": SqlFromClause {
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlAlias {
                "alias": RefName {
                  "name": "t",
                  "quotes": false,
                },
                "columns": undefined,
                "expression": SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
                "keywords": Object {
                  "as": "As",
                },
                "parens": undefined,
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "joinParts": undefined,
          "keywords": Object {
            "from": "from",
          },
          "parens": undefined,
          "spacing": Object {
            "postFrom": " ",
          },
          "type": "fromClause",
        },
        "groupByClause": undefined,
        "havingClause": undefined,
        "insertClause": undefined,
        "keywords": Object {
          "select": "Select",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "parens": undefined,
        "partitionedByClause": undefined,
        "replaceClause": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlStar {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "table": undefined,
              "type": "star",
            },
          ],
        },
        "spacing": Object {
          "postSelect": " ",
          "postWithClause": "
      ",
          "preFromClause": " ",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
        "withClause": SqlWithClause {
          "keywords": Object {
            "with": "WITH",
          },
          "parens": undefined,
          "spacing": Object {
            "postWith": " ",
          },
          "type": "withClause",
          "withParts": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlWithPart {
                "columns": undefined,
                "keywords": Object {
                  "as": "AS",
                },
                "parens": undefined,
                "query": SqlQuery {
                  "clusteredByClause": undefined,
                  "contextStatements": undefined,
                  "decorator": undefined,
                  "explain": undefined,
                  "fromClause": SqlFromClause {
                    "expressions": SeparatedArray {
                      "separators": Array [],
                      "values": Array [
                        SqlTable {
                          "keywords": Object {},
                          "namespace": undefined,
                          "parens": undefined,
                          "refName": RefName {
                            "name": "emp",
                            "quotes": false,
                          },
                          "spacing": Object {},
                          "type": "table",
                        },
                      ],
                    },
                    "joinParts": undefined,
                    "keywords": Object {
                      "from": "FROM",
                    },
                    "parens": undefined,
                    "spacing": Object {
                      "postFrom": "   ",
                    },
                    "type": "fromClause",
                  },
                  "groupByClause": undefined,
                  "havingClause": undefined,
                  "insertClause": undefined,
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
                  "partitionedByClause": undefined,
                  "replaceClause": undefined,
                  "selectExpressions": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlColumn {
                        "keywords": Object {},
                        "parens": undefined,
                        "refName": RefName {
                          "name": "deptno",
                          "quotes": false,
                        },
                        "spacing": Object {},
                        "table": undefined,
                        "type": "column",
                      },
                    ],
                  },
                  "spacing": Object {
                    "postSelect": " ",
                    "preFromClause": "
        ",
                  },
                  "type": "query",
                  "unionQuery": undefined,
                  "whereClause": undefined,
                  "withClause": undefined,
                },
                "spacing": Object {
                  "postAs": " ",
                  "postTable": " ",
                },
                "table": RefName {
                  "name": "dept_count",
                  "quotes": false,
                },
                "type": "withPart",
              },
            ],
          },
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preWhereClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": SqlWhereClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": ">",
              },
              "lhs": SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              "op": ">",
              "parens": undefined,
              "rhs": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
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
            "parens": undefined,
            "spacing": Object {
              "postWhere": " ",
            },
            "type": "whereClause",
          },
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with equals', () => {
      const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": SqlNamespace {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "sys",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "namespace",
                  },
                  "parens": undefined,
                  "refName": RefName {
                    "name": "supervisors",
                    "quotes": false,
                  },
                  "spacing": Object {
                    "postDot": "",
                    "postNamespace": "",
                  },
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preWhereClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": SqlWhereClause {
            "expression": SqlComparison {
              "decorator": undefined,
              "keywords": Object {
                "op": "=",
              },
              "lhs": SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "healthy",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              "op": "=",
              "parens": undefined,
              "rhs": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
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
            "parens": undefined,
            "spacing": Object {
              "postWhere": " ",
            },
            "type": "whereClause",
          },
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with many', () => {
      const sql = `SELECT * FROM sys.supervisors WHERE healthy = 0 and col > 100 or otherColumn = 'value'`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": SqlNamespace {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "sys",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "namespace",
                  },
                  "parens": undefined,
                  "refName": RefName {
                    "name": "supervisors",
                    "quotes": false,
                  },
                  "spacing": Object {
                    "postDot": "",
                    "postNamespace": "",
                  },
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preWhereClause": " ",
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
                          "lhs": SqlColumn {
                            "keywords": Object {},
                            "parens": undefined,
                            "refName": RefName {
                              "name": "healthy",
                              "quotes": false,
                            },
                            "spacing": Object {},
                            "table": undefined,
                            "type": "column",
                          },
                          "op": "=",
                          "parens": undefined,
                          "rhs": SqlLiteral {
                            "keywords": Object {},
                            "parens": undefined,
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
                          "lhs": SqlColumn {
                            "keywords": Object {},
                            "parens": undefined,
                            "refName": RefName {
                              "name": "col",
                              "quotes": false,
                            },
                            "spacing": Object {},
                            "table": undefined,
                            "type": "column",
                          },
                          "op": ">",
                          "parens": undefined,
                          "rhs": SqlLiteral {
                            "keywords": Object {},
                            "parens": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "otherColumn",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": "=",
                    "parens": undefined,
                    "rhs": SqlLiteral {
                      "keywords": Object {},
                      "parens": undefined,
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
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
            "keywords": Object {
              "where": "WHERE",
            },
            "parens": undefined,
            "spacing": Object {
              "postWhere": " ",
            },
            "type": "whereClause",
          },
          "withClause": undefined,
        }
      `);
    });
  });

  describe('expressions with group by clause', () => {
    it('works with group by on empty', () => {
      const sql = `Select * from tbl group by (  )`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).groupByClause).toMatchInlineSnapshot(`
        SqlGroupByClause {
          "decorator": undefined,
          "expressions": undefined,
          "innerParens": false,
          "keywords": Object {
            "groupBy": "group by",
          },
          "parens": undefined,
          "spacing": Object {
            "postGroupBy": " ",
            "postLeftParen": "  ",
          },
          "type": "groupByClause",
        }
      `);
    });

    it('works with group by on single expression', () => {
      const sql = `Select * from tbl group by col`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).groupByClause).toMatchInlineSnapshot(`
        SqlGroupByClause {
          "decorator": undefined,
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "innerParens": false,
          "keywords": Object {
            "groupBy": "group by",
          },
          "parens": undefined,
          "spacing": Object {
            "postGroupBy": " ",
          },
          "type": "groupByClause",
        }
      `);
    });

    it('works with group by on single expression in parens', () => {
      const sql = `Select * from tbl group by (  col   )`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).groupByClause).toMatchInlineSnapshot(`
        SqlGroupByClause {
          "decorator": undefined,
          "expressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "innerParens": true,
          "keywords": Object {
            "groupBy": "group by",
          },
          "parens": undefined,
          "spacing": Object {
            "postExpressions": "   ",
            "postGroupBy": " ",
            "postLeftParen": "  ",
          },
          "type": "groupByClause",
        }
      `);
    });

    it('works with multiple group by expressions', () => {
      const sql = `Select * from tbl group by col, colTwo`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).groupByClause).toMatchInlineSnapshot(`
        SqlGroupByClause {
          "decorator": undefined,
          "expressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "colTwo",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "innerParens": false,
          "keywords": Object {
            "groupBy": "group by",
          },
          "parens": undefined,
          "spacing": Object {
            "postGroupBy": " ",
          },
          "type": "groupByClause",
        }
      `);
    });

    it('works with multiple group by expressions in parens', () => {
      const sql = `Select * from tbl group by (  col, colTwo   )`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).groupByClause).toMatchInlineSnapshot(`
        SqlGroupByClause {
          "decorator": undefined,
          "expressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "colTwo",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "innerParens": true,
          "keywords": Object {
            "groupBy": "group by",
          },
          "parens": undefined,
          "spacing": Object {
            "postExpressions": "   ",
            "postGroupBy": " ",
            "postLeftParen": "  ",
          },
          "type": "groupByClause",
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
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
              "lhs": SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              "op": ">",
              "parens": undefined,
              "rhs": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
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
            "parens": undefined,
            "spacing": Object {
              "postHaving": " ",
            },
            "type": "havingClause",
          },
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preHavingClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with equals', () => {
      const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": SqlNamespace {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "sys",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "namespace",
                  },
                  "parens": undefined,
                  "refName": RefName {
                    "name": "supervisors",
                    "quotes": false,
                  },
                  "spacing": Object {
                    "postDot": "",
                    "postNamespace": "",
                  },
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
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
              "lhs": SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "healthy",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              "op": "=",
              "parens": undefined,
              "rhs": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
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
            "parens": undefined,
            "spacing": Object {
              "postHaving": " ",
            },
            "type": "havingClause",
          },
          "insertClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preHavingClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with many', () => {
      const sql = `SELECT * FROM sys.supervisors HAVING healthy = 0 and col > 100 or otherColumn = 'value'`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": SqlNamespace {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "sys",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "namespace",
                  },
                  "parens": undefined,
                  "refName": RefName {
                    "name": "supervisors",
                    "quotes": false,
                  },
                  "spacing": Object {
                    "postDot": "",
                    "postNamespace": "",
                  },
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
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
                          "lhs": SqlColumn {
                            "keywords": Object {},
                            "parens": undefined,
                            "refName": RefName {
                              "name": "healthy",
                              "quotes": false,
                            },
                            "spacing": Object {},
                            "table": undefined,
                            "type": "column",
                          },
                          "op": "=",
                          "parens": undefined,
                          "rhs": SqlLiteral {
                            "keywords": Object {},
                            "parens": undefined,
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
                          "lhs": SqlColumn {
                            "keywords": Object {},
                            "parens": undefined,
                            "refName": RefName {
                              "name": "col",
                              "quotes": false,
                            },
                            "spacing": Object {},
                            "table": undefined,
                            "type": "column",
                          },
                          "op": ">",
                          "parens": undefined,
                          "rhs": SqlLiteral {
                            "keywords": Object {},
                            "parens": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "type": "multi",
                  },
                  SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "otherColumn",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": "=",
                    "parens": undefined,
                    "rhs": SqlLiteral {
                      "keywords": Object {},
                      "parens": undefined,
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
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
            "keywords": Object {
              "having": "HAVING",
            },
            "parens": undefined,
            "spacing": Object {
              "postHaving": " ",
            },
            "type": "havingClause",
          },
          "insertClause": undefined,
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preHavingClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "order by",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preOrderByClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with ref order by', () => {
      const sql = `Select col from tbl order by col`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
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
                  "expression": SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "col",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "order by",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preOrderByClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with number order by and direction', () => {
      const sql = `Select col from tbl order by 1 Asc`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "keywords": Object {
                    "direction": "Asc",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "order by",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preOrderByClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with group by with parens', () => {
      const sql = sane`
        SELECT
          comment,
          page,
          COUNT(*) AS "Count"
        FROM wikipedia
        GROUP BY (comment, page)
        ORDER BY 3 DESC
      `;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "wikipedia",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "decorator": undefined,
            "expressions": SeparatedArray {
              "separators": Array [
                Separator {
                  "left": "",
                  "right": " ",
                  "separator": ",",
                },
              ],
              "values": Array [
                SqlColumn {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "comment",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
                SqlColumn {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "page",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
              ],
            },
            "innerParens": true,
            "keywords": Object {
              "groupBy": "GROUP BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postExpressions": "",
              "postGroupBy": " ",
              "postLeftParen": "",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "insertClause": undefined,
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
                  "expression": SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "3",
                    "type": "literal",
                    "value": 3,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "ORDER BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
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
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "comment",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "page",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlAlias {
                "alias": RefName {
                  "name": "Count",
                  "quotes": true,
                },
                "columns": undefined,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlStar {
                        "keywords": Object {},
                        "parens": undefined,
                        "spacing": Object {},
                        "table": undefined,
                        "type": "star",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "extendClause": undefined,
                  "functionName": RefName {
                    "name": "COUNT",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                  "windowSpec": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "parens": undefined,
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
            "postSelect": "
          ",
            "preFromClause": "
        ",
            "preGroupByClause": "
        ",
            "preOrderByClause": "
        ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with group by grouping sets', () => {
      const sql = sane`
        SELECT
          comment,
          page,
          COUNT(*) AS "Count",
          GROUPING(comment, page)
        FROM wikipedia
        GROUP BY GROUPING SETS ( (comment, page), (comment), (page), ( ) )
        ORDER BY 3 DESC
      `;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "wikipedia",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "decorator": "GROUPING SETS",
            "expressions": SeparatedArray {
              "separators": Array [
                Separator {
                  "left": "",
                  "right": " ",
                  "separator": ",",
                },
                Separator {
                  "left": "",
                  "right": " ",
                  "separator": ",",
                },
                Separator {
                  "left": "",
                  "right": " ",
                  "separator": ",",
                },
              ],
              "values": Array [
                SqlRecord {
                  "expressions": SeparatedArray {
                    "separators": Array [
                      Separator {
                        "left": "",
                        "right": " ",
                        "separator": ",",
                      },
                    ],
                    "values": Array [
                      SqlColumn {
                        "keywords": Object {},
                        "parens": undefined,
                        "refName": RefName {
                          "name": "comment",
                          "quotes": false,
                        },
                        "spacing": Object {},
                        "table": undefined,
                        "type": "column",
                      },
                      SqlColumn {
                        "keywords": Object {},
                        "parens": undefined,
                        "refName": RefName {
                          "name": "page",
                          "quotes": false,
                        },
                        "spacing": Object {},
                        "table": undefined,
                        "type": "column",
                      },
                    ],
                  },
                  "keywords": Object {
                    "row": "",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postExpressions": "",
                    "postLeftParen": "",
                  },
                  "type": "record",
                },
                SqlColumn {
                  "keywords": Object {},
                  "parens": Array [
                    Object {
                      "leftSpacing": "",
                      "rightSpacing": "",
                    },
                  ],
                  "refName": RefName {
                    "name": "comment",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
                SqlColumn {
                  "keywords": Object {},
                  "parens": Array [
                    Object {
                      "leftSpacing": "",
                      "rightSpacing": "",
                    },
                  ],
                  "refName": RefName {
                    "name": "page",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
                SqlRecord {
                  "expressions": undefined,
                  "keywords": Object {
                    "row": "",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postLeftParen": " ",
                  },
                  "type": "record",
                },
              ],
            },
            "innerParens": true,
            "keywords": Object {
              "decorator": "GROUPING SETS",
              "groupBy": "GROUP BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postDecorator": " ",
              "postExpressions": " ",
              "postGroupBy": " ",
              "postLeftParen": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "insertClause": undefined,
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
                  "expression": SqlLiteral {
                    "keywords": Object {},
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "3",
                    "type": "literal",
                    "value": 3,
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "ORDER BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
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
              Separator {
                "left": "",
                "right": "
          ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "comment",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "page",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlAlias {
                "alias": RefName {
                  "name": "Count",
                  "quotes": true,
                },
                "columns": undefined,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlStar {
                        "keywords": Object {},
                        "parens": undefined,
                        "spacing": Object {},
                        "table": undefined,
                        "type": "star",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "extendClause": undefined,
                  "functionName": RefName {
                    "name": "COUNT",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                  "windowSpec": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "parens": undefined,
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
              SqlFunction {
                "args": SeparatedArray {
                  "separators": Array [
                    Separator {
                      "left": "",
                      "right": " ",
                      "separator": ",",
                    },
                  ],
                  "values": Array [
                    SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "comment",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "page",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                  ],
                },
                "decorator": undefined,
                "extendClause": undefined,
                "functionName": RefName {
                  "name": "GROUPING",
                  "quotes": false,
                },
                "keywords": Object {},
                "namespace": undefined,
                "parens": undefined,
                "spacing": Object {
                  "postArguments": "",
                  "postLeftParen": "",
                  "preLeftParen": "",
                },
                "specialParen": undefined,
                "type": "function",
                "whereClause": undefined,
                "windowSpec": undefined,
              },
            ],
          },
          "spacing": Object {
            "postSelect": "
          ",
            "preFromClause": "
        ",
            "preGroupByClause": "
        ",
            "preOrderByClause": "
        ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select with ref order by and direction', () => {
      const sql = `Select col, colTwo from tbl order by col DESC`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
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
                  "expression": SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "col",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "order by",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "colTwo",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preOrderByClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select ordered on multiple cols 1', () => {
      const sql = `Select col from tbl order by 1 ASC, col`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "keywords": Object {
                    "direction": "ASC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
                SqlOrderByExpression {
                  "direction": undefined,
                  "expression": SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "col",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "order by",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preOrderByClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Simple select ordered on multiple cols 2', () => {
      const sql = `Select col, colTwo from tbl order by 1 ASC, col DESC`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
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
                    "parens": undefined,
                    "spacing": Object {},
                    "stringValue": "1",
                    "type": "literal",
                    "value": 1,
                  },
                  "keywords": Object {
                    "direction": "ASC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
                SqlOrderByExpression {
                  "direction": "DESC",
                  "expression": SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "col",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "order by",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": " ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "colTwo",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preOrderByClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": SqlLimitClause {
            "keywords": Object {
              "limit": "limit",
            },
            "limit": SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "parens": undefined,
            "spacing": Object {
              "postLimit": " ",
            },
            "type": "limitClause",
          },
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
            "preLimitClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
            "union": "union all",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "postUnion": " ",
            "preFromClause": " ",
            "preUnion": " ",
          },
          "type": "query",
          "unionQuery": SqlQuery {
            "clusteredByClause": undefined,
            "contextStatements": undefined,
            "decorator": undefined,
            "explain": undefined,
            "fromClause": SqlFromClause {
              "expressions": SeparatedArray {
                "separators": Array [],
                "values": Array [
                  SqlTable {
                    "keywords": Object {},
                    "namespace": undefined,
                    "parens": undefined,
                    "refName": RefName {
                      "name": "otherTable",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "table",
                  },
                ],
              },
              "joinParts": undefined,
              "keywords": Object {
                "from": "from",
              },
              "parens": undefined,
              "spacing": Object {
                "postFrom": " ",
              },
              "type": "fromClause",
            },
            "groupByClause": undefined,
            "havingClause": undefined,
            "insertClause": undefined,
            "keywords": Object {
              "select": "select",
            },
            "limitClause": undefined,
            "offsetClause": undefined,
            "orderByClause": undefined,
            "parens": undefined,
            "partitionedByClause": undefined,
            "replaceClause": undefined,
            "selectExpressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlStar {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "table": undefined,
                  "type": "star",
                },
              ],
            },
            "spacing": Object {
              "postSelect": " ",
              "preFromClause": " ",
            },
            "type": "query",
            "unionQuery": undefined,
            "whereClause": undefined,
            "withClause": undefined,
          },
          "whereClause": undefined,
          "withClause": undefined,
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
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
                  "natural": undefined,
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": "=",
                    "parens": undefined,
                    "rhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlTable {
                    "keywords": Object {},
                    "namespace": undefined,
                    "parens": undefined,
                    "refName": RefName {
                      "name": "anotherTable",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "table",
                  },
                  "type": "joinPart",
                  "usingColumns": undefined,
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Left join', () => {
      const sql = 'Select * from tbl Left Join anotherTable ON col = col';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
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
                  "natural": undefined,
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": "=",
                    "parens": undefined,
                    "rhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlTable {
                    "keywords": Object {},
                    "namespace": undefined,
                    "parens": undefined,
                    "refName": RefName {
                      "name": "anotherTable",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "table",
                  },
                  "type": "joinPart",
                  "usingColumns": undefined,
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Right join', () => {
      const sql = 'Select * from tbl RIGHT Join anotherTable ON col = col';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
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
                  "natural": undefined,
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": "=",
                    "parens": undefined,
                    "rhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlTable {
                    "keywords": Object {},
                    "namespace": undefined,
                    "parens": undefined,
                    "refName": RefName {
                      "name": "anotherTable",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "table",
                  },
                  "type": "joinPart",
                  "usingColumns": undefined,
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Full join', () => {
      const sql = 'Select * from tbl FULL Join anotherTable ON col = col';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
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
                  "natural": undefined,
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": "=",
                    "parens": undefined,
                    "rhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlTable {
                    "keywords": Object {},
                    "namespace": undefined,
                    "parens": undefined,
                    "refName": RefName {
                      "name": "anotherTable",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "table",
                  },
                  "type": "joinPart",
                  "usingColumns": undefined,
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Full Outer join', () => {
      const sql = 'Select * from tbl FULL OUTER Join anotherTable ON col = col';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
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
                  "natural": undefined,
                  "onExpression": SqlComparison {
                    "decorator": undefined,
                    "keywords": Object {
                      "op": "=",
                    },
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": "=",
                    "parens": undefined,
                    "rhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "col",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "spacing": Object {
                      "postOp": " ",
                      "preOp": " ",
                    },
                    "type": "comparison",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postOn": " ",
                    "preOn": " ",
                  },
                  "table": SqlTable {
                    "keywords": Object {},
                    "namespace": undefined,
                    "parens": undefined,
                    "refName": RefName {
                      "name": "anotherTable",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "table",
                  },
                  "type": "joinPart",
                  "usingColumns": undefined,
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Join with using', () => {
      const sql = 'Select * from tbl INNER Join anotherTable Using (col1, col2)';

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
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
                    "using": "Using",
                  },
                  "natural": undefined,
                  "onExpression": undefined,
                  "parens": undefined,
                  "spacing": Object {
                    "postJoin": " ",
                    "postJoinType": " ",
                    "postUsing": " ",
                    "preUsing": " ",
                  },
                  "table": SqlTable {
                    "keywords": Object {},
                    "namespace": undefined,
                    "parens": undefined,
                    "refName": RefName {
                      "name": "anotherTable",
                      "quotes": false,
                    },
                    "spacing": Object {},
                    "type": "table",
                  },
                  "type": "joinPart",
                  "usingColumns": SqlColumnList {
                    "columns": SeparatedArray {
                      "separators": Array [
                        Separator {
                          "left": "",
                          "right": " ",
                          "separator": ",",
                        },
                      ],
                      "values": Array [
                        RefName {
                          "name": "col1",
                          "quotes": false,
                        },
                        RefName {
                          "name": "col2",
                          "quotes": false,
                        },
                      ],
                    },
                    "keywords": Object {},
                    "parens": Array [
                      Object {
                        "leftSpacing": "",
                        "rightSpacing": "",
                      },
                    ],
                    "spacing": Object {},
                    "type": "columnList",
                  },
                },
              ],
            },
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
              "preJoin": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " ",
            "preFromClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });

    it('Join with manipulated joinConditionExpression', () => {
      const sqlWithUsingString = 'Select * from tbl INNER Join anotherTable USING (col1, col2)';
      const sqlWithOnString = 'Select * from tbl INNER Join anotherTable ON col = col';
      backAndForth(sqlWithUsingString);
      backAndForth(sqlWithOnString);

      const sqlWithUsing = SqlQuery.parse(sqlWithUsingString);

      const sqlWithOn = SqlQuery.parse(sqlWithOnString);
      const columnList = SqlColumnList.create([
        RefName.create('col1', false),
        RefName.create('col2', false),
      ]).ensureParens('', '');

      expect(sqlWithOn.getJoins()[0]?.changeUsingColumns(columnList).toString()).toEqual(
        sqlWithUsing.getJoins()[0]?.toString(),
      );
      expect(
        sqlWithOn.getJoins()[0]?.changeOnExpression(SqlExpression.parse(`col = col`)).toString(),
      ).toEqual(SqlQuery.parse(sqlWithOnString).getJoins()[0]?.toString());
      expect(
        sqlWithUsing.getJoins()[0]?.changeOnExpression(SqlExpression.parse(`col = col`)).toString(),
      ).toEqual(sqlWithOn.getJoins()[0]?.toString());
      expect(sqlWithUsing.getJoins()[0]?.changeUsingColumns(columnList).toString()).toEqual(
        SqlQuery.parse(sqlWithUsingString).getJoins()[0]?.toString(),
      );
    });

    it('Join with invalid USING syntax', () => {
      const invalidSql = 'Select * from tbl INNER Join anotherTable Using col1 = col2';
      expect(() => SqlQuery.parse(invalidSql)).toThrowError();
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "from",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": undefined,
          "keywords": Object {
            "select": "Select",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "col",
                  "quotes": false,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
            ],
          },
          "spacing": Object {
            "postSelect": " -- some comment
        ",
            "preFromClause": " ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "wiki",
                    "quotes": true,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": "",
            },
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "decorator": undefined,
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlColumn {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "channel",
                    "quotes": true,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
              ],
            },
            "innerParens": false,
            "keywords": Object {
              "groupBy": "GROUP BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postGroupBy": "",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "insertClause": undefined,
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
                  "expression": SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "Count",
                      "quotes": true,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": "",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "ORDER BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": "",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
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
              SqlColumn {
                "keywords": Object {},
                "parens": undefined,
                "refName": RefName {
                  "name": "channel",
                  "quotes": true,
                },
                "spacing": Object {},
                "table": undefined,
                "type": "column",
              },
              SqlAlias {
                "alias": RefName {
                  "name": "Count",
                  "quotes": true,
                },
                "columns": undefined,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlStar {
                        "keywords": Object {},
                        "parens": undefined,
                        "spacing": Object {},
                        "table": undefined,
                        "type": "star",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "extendClause": undefined,
                  "functionName": RefName {
                    "name": "COUNT",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                  "windowSpec": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "parens": undefined,
                "spacing": Object {
                  "preAlias": "",
                  "preAs": "",
                },
                "type": "alias",
              },
              SqlAlias {
                "alias": RefName {
                  "name": "dist_cityName",
                  "quotes": true,
                },
                "columns": undefined,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlColumn {
                        "keywords": Object {},
                        "parens": undefined,
                        "refName": RefName {
                          "name": "cityName",
                          "quotes": true,
                        },
                        "spacing": Object {},
                        "table": undefined,
                        "type": "column",
                      },
                    ],
                  },
                  "decorator": "DISTINCT",
                  "extendClause": undefined,
                  "functionName": RefName {
                    "name": "COUNT",
                    "quotes": false,
                  },
                  "keywords": Object {
                    "decorator": "DISTINCT",
                  },
                  "namespace": undefined,
                  "parens": undefined,
                  "spacing": Object {
                    "postArguments": "",
                    "postDecorator": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                  "windowSpec": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "parens": undefined,
                "spacing": Object {
                  "preAlias": "",
                  "preAs": "",
                },
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
            "postSelect": "",
            "preFromClause": "",
            "preGroupByClause": "",
            "preOrderByClause": "",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
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
          "clusteredByClause": undefined,
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "wikipedia",
                    "quotes": true,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": SqlGroupByClause {
            "decorator": undefined,
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              ],
            },
            "innerParens": false,
            "keywords": Object {
              "groupBy": "GROUP BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postGroupBy": " ",
            },
            "type": "groupByClause",
          },
          "havingClause": undefined,
          "insertClause": undefined,
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
                  "expression": SqlColumn {
                    "keywords": Object {},
                    "parens": undefined,
                    "refName": RefName {
                      "name": "Count",
                      "quotes": true,
                    },
                    "spacing": Object {},
                    "table": undefined,
                    "type": "column",
                  },
                  "keywords": Object {
                    "direction": "DESC",
                  },
                  "parens": undefined,
                  "spacing": Object {
                    "preDirection": " ",
                  },
                  "type": "orderByExpression",
                },
              ],
            },
            "keywords": Object {
              "orderBy": "ORDER BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postOrderBy": " ",
            },
            "type": "orderByClause",
          },
          "parens": undefined,
          "partitionedByClause": undefined,
          "replaceClause": undefined,
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
                "alias": RefName {
                  "name": "channel",
                  "quotes": true,
                },
                "columns": undefined,
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
                      SqlColumn {
                        "keywords": Object {},
                        "parens": undefined,
                        "refName": RefName {
                          "name": "channel",
                          "quotes": true,
                        },
                        "spacing": Object {},
                        "table": undefined,
                        "type": "column",
                      },
                      SqlType {
                        "keywords": Object {},
                        "parens": undefined,
                        "spacing": Object {},
                        "type": "type",
                        "value": "VARCHAR",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "extendClause": undefined,
                  "functionName": RefName {
                    "name": "CAST",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                  "windowSpec": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "parens": undefined,
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
              SqlAlias {
                "alias": RefName {
                  "name": "Count",
                  "quotes": true,
                },
                "columns": undefined,
                "expression": SqlFunction {
                  "args": SeparatedArray {
                    "separators": Array [],
                    "values": Array [
                      SqlStar {
                        "keywords": Object {},
                        "parens": undefined,
                        "spacing": Object {},
                        "table": undefined,
                        "type": "star",
                      },
                    ],
                  },
                  "decorator": undefined,
                  "extendClause": undefined,
                  "functionName": RefName {
                    "name": "COUNT",
                    "quotes": false,
                  },
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "spacing": Object {
                    "postArguments": "",
                    "postLeftParen": "",
                    "preLeftParen": "",
                  },
                  "specialParen": undefined,
                  "type": "function",
                  "whereClause": undefined,
                  "windowSpec": undefined,
                },
                "keywords": Object {
                  "as": "AS",
                },
                "parens": undefined,
                "spacing": Object {
                  "preAlias": " ",
                  "preAs": " ",
                },
                "type": "alias",
              },
            ],
          },
          "spacing": Object {
            "postSelect": "
          ",
            "preFromClause": "
        ",
            "preGroupByClause": "
        ",
            "preOrderByClause": "
        ",
            "preWhereClause": "
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
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "__time",
                        "quotes": true,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": ">=",
                    "parens": undefined,
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
                            "extendClause": undefined,
                            "functionName": RefName {
                              "name": "CURRENT_TIMESTAMP",
                              "quotes": false,
                            },
                            "keywords": Object {},
                            "namespace": undefined,
                            "parens": undefined,
                            "spacing": Object {},
                            "specialParen": "none",
                            "type": "function",
                            "whereClause": undefined,
                            "windowSpec": undefined,
                          },
                          SqlInterval {
                            "intervalValue": SqlLiteral {
                              "keywords": Object {},
                              "parens": undefined,
                              "spacing": Object {},
                              "stringValue": "'1'",
                              "type": "literal",
                              "value": "1",
                            },
                            "keywords": Object {
                              "interval": "INTERVAL",
                            },
                            "parens": undefined,
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
                      "parens": undefined,
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
                    "lhs": SqlColumn {
                      "keywords": Object {},
                      "parens": undefined,
                      "refName": RefName {
                        "name": "cityName",
                        "quotes": false,
                      },
                      "spacing": Object {},
                      "table": undefined,
                      "type": "column",
                    },
                    "op": "=",
                    "parens": undefined,
                    "rhs": SqlPlaceholder {
                      "customPlaceholder": undefined,
                      "keywords": Object {},
                      "parens": undefined,
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
              "parens": undefined,
              "spacing": Object {},
              "type": "multi",
            },
            "keywords": Object {
              "where": "WHERE",
            },
            "parens": undefined,
            "spacing": Object {
              "postWhere": " ",
            },
            "type": "whereClause",
          },
          "withClause": undefined,
        }
      `);
    });
  });

  describe('expressions with partitioned and clustered clauses', () => {
    it('Simple select with where', () => {
      const sql = sane`
        INSERT INTO "tbl2"
        SELECT *
        FROM tbl
        PARTITIONED BY DAY
        CLUSTERED BY 2, blah
      `;

      backAndForth(sql);

      expect(SqlQuery.parse(sql)).toMatchInlineSnapshot(`
        SqlQuery {
          "clusteredByClause": SqlClusteredByClause {
            "expressions": SeparatedArray {
              "separators": Array [
                Separator {
                  "left": "",
                  "right": " ",
                  "separator": ",",
                },
              ],
              "values": Array [
                SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "2",
                  "type": "literal",
                  "value": 2,
                },
                SqlColumn {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "blah",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
              ],
            },
            "keywords": Object {
              "clusteredBy": "CLUSTERED BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postClusteredBy": " ",
            },
            "type": "clusteredByClause",
          },
          "contextStatements": undefined,
          "decorator": undefined,
          "explain": undefined,
          "fromClause": SqlFromClause {
            "expressions": SeparatedArray {
              "separators": Array [],
              "values": Array [
                SqlTable {
                  "keywords": Object {},
                  "namespace": undefined,
                  "parens": undefined,
                  "refName": RefName {
                    "name": "tbl",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "table",
                },
              ],
            },
            "joinParts": undefined,
            "keywords": Object {
              "from": "FROM",
            },
            "parens": undefined,
            "spacing": Object {
              "postFrom": " ",
            },
            "type": "fromClause",
          },
          "groupByClause": undefined,
          "havingClause": undefined,
          "insertClause": SqlInsertClause {
            "columns": undefined,
            "format": undefined,
            "keywords": Object {
              "insert": "INSERT",
              "into": "INTO",
            },
            "parens": undefined,
            "spacing": Object {
              "postInsert": " ",
              "postInto": " ",
            },
            "table": SqlTable {
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "refName": RefName {
                "name": "tbl2",
                "quotes": true,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "insertClause",
          },
          "keywords": Object {
            "select": "SELECT",
          },
          "limitClause": undefined,
          "offsetClause": undefined,
          "orderByClause": undefined,
          "parens": undefined,
          "partitionedByClause": SqlPartitionedByClause {
            "expression": SqlLiteral {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {},
              "stringValue": "DAY",
              "type": "literal",
              "value": "DAY",
            },
            "keywords": Object {
              "partitionedBy": "PARTITIONED BY",
            },
            "parens": undefined,
            "spacing": Object {
              "postPartitionedBy": " ",
            },
            "type": "partitionedByClause",
          },
          "replaceClause": undefined,
          "selectExpressions": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlStar {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "table": undefined,
                "type": "star",
              },
            ],
          },
          "spacing": Object {
            "postInsertClause": "
        ",
            "postSelect": " ",
            "preClusteredByClause": "
        ",
            "preFromClause": "
        ",
            "prePartitionedByClause": "
        ",
          },
          "type": "query",
          "unionQuery": undefined,
          "whereClause": undefined,
          "withClause": undefined,
        }
      `);
    });
  });
});
