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

import { Column, Introspect, QueryResult, SqlQuery } from '..';
import { sane } from '../utils';

describe('Introspect', () => {
  const emptyQueryResult = new QueryResult({
    header: [],
    rows: [],
  });

  describe('.decodeTableIntrospectionResult', () => {
    it('works', () => {
      const queryResult = new QueryResult({
        header: Column.fromColumnNames(['TABLE_NAME']),
        rows: [['wikipedia'], ['github']],
      });

      expect(Introspect.decodeTableIntrospectionResult(queryResult)).toEqual([
        {
          name: 'wikipedia',
        },
        {
          name: 'github',
        },
      ]);
    });

    it('works with empty result', () => {
      expect(Introspect.decodeTableIntrospectionResult(emptyQueryResult)).toEqual([]);
    });
  });

  describe('.decodeTableColumnIntrospectionResult', () => {
    it('works', () => {
      const queryResult = new QueryResult({
        header: Column.fromColumnNames(['COLUMN_NAME', 'DATA_TYPE']),
        rows: [
          ['__time', 'TIMESTAMP'],
          ['channel', 'VARCHAR'],
          ['cityName', 'VARCHAR'],
          ['comment', 'VARCHAR'],
          ['count', 'BIGINT'],
          ['sum_delta', 'BIGINT'],
          ['sum_deltaBucket', 'BIGINT'],
          ['user', 'VARCHAR'],
        ],
      });

      expect(Introspect.decodeTableColumnIntrospectionResult(queryResult)).toEqual([
        {
          name: '__time',
          type: 'TIMESTAMP',
        },
        {
          name: 'channel',
          type: 'VARCHAR',
        },
        {
          name: 'cityName',
          type: 'VARCHAR',
        },
        {
          name: 'comment',
          type: 'VARCHAR',
        },
        {
          name: 'count',
          type: 'BIGINT',
        },
        {
          name: 'sum_delta',
          type: 'BIGINT',
        },
        {
          name: 'sum_deltaBucket',
          type: 'BIGINT',
        },
        {
          name: 'user',
          type: 'VARCHAR',
        },
      ]);
    });

    it('works with empty result', () => {
      expect(Introspect.decodeTableColumnIntrospectionResult(emptyQueryResult)).toEqual([]);
    });
  });

  describe('.decodeColumnTypesFromPlan', () => {
    it('works when there is only a PLAN', () => {
      const queryPlanResult = new QueryResult({
        header: Column.fromColumnNames(['PLAN']),
        rows: [['DruidQueryRel(query=[...\n...], signature=[{d0:STRING, a0:LONG}])\n']],
      });

      expect(Introspect.decodeColumnTypesFromPlan(queryPlanResult)).toEqual(['STRING', 'LONG']);
    });

    it('works when there is more than a PLAN', () => {
      const queryPlanResult = new QueryResult({
        header: Column.fromColumnNames(['PLAN', 'RESOURCES']),
        rows: [
          [
            'DruidQueryRel(query=[...\n...], signature=[{d0:STRING, a0:LONG}])\n',
            '[{"name":"wikipedia","type":"DATASOURCE"}]',
          ],
        ],
      });

      expect(Introspect.decodeColumnTypesFromPlan(queryPlanResult)).toEqual(['STRING', 'LONG']);
    });

    it('works with empty result', () => {
      expect(Introspect.decodeColumnTypesFromPlan(emptyQueryResult)).toEqual([]);
    });
  });

  describe('.getQueryColumnSampleQuery', () => {
    expect(
      String(
        Introspect.getQueryColumnSampleQuery(
          SqlQuery.parse(sane`
            SELECT added + 1, * FROM "wikipedia"
            Union All
            SELECT * FROM "wiki"
          `),
        ),
      ),
    ).toEqual(sane`
      SELECT added + 1, * FROM "wikipedia"
      Union All
      SELECT * FROM "wiki"
      LIMIT 1
    `);
  });

  describe('.decodeQueryColumnIntrospectionResult', () => {
    it('works with empty result', () => {
      expect(Introspect.decodeQueryColumnIntrospectionResult(emptyQueryResult)).toEqual([]);
    });

    it('works with all columns having good names', () => {
      const query = SqlQuery.parse(sane`
        SELECT
          __time,
          cityName,
          COUNT(*) AS "Count"
        FROM wikipedia
        GROUP BY 1
        ORDER BY 2 DESC
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: Column.fromColumnNames(['PLAN']),
        rows: [['DruidQueryRel(query=[...\n...], signature=[{d0:LONG, d1:STRING, a0:LONG}])\n']],
      });

      expect(Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult)).toEqual([
        {
          name: '__time',
          type: 'TIMESTAMP',
        },
        {
          name: 'cityName',
          type: 'STRING',
        },
        {
          name: 'Count',
          type: 'LONG',
        },
      ]);
    });

    it('works with some column not having good names', () => {
      const query = SqlQuery.parse(sane`
        SELECT
          cityName,
          COUNT(*)
        FROM wikipedia
        GROUP BY 1
        ORDER BY 2 DESC
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: Column.fromColumnNames(['PLAN']),
        rows: [['DruidQueryRel(query=[...\n...], signature=[{d0:STRING, a0:LONG}])\n']],
      });

      expect(Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult)).toEqual([
        {
          name: 'cityName',
          type: 'STRING',
        },
      ]);
    });

    it('fails with star without sample', () => {
      const query = SqlQuery.parse(sane`
        SELECT cityName, * FROM wikipedia
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: Column.fromColumnNames(['PLAN']),
        rows: [['DruidQueryRel(query=[...\n...], signature=[{d0:STRING, a0:LONG, a1:LONG}])\n']],
      });

      expect(() => Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult)).toThrow(
        'a query with a star must have sampleRowResult set',
      );
    });

    it('works with star', () => {
      const query = SqlQuery.parse(sane`
        SELECT "time", cityName, added + 1, * FROM wikipedia
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: Column.fromColumnNames(['PLAN']),
        rows: [
          [
            'DruidQueryRel(query=[...\n...], signature=[{d0:LONG, d1:STRING, a0:LONG, a1:LONG, a1:LONG}])\n',
          ],
        ],
      });

      const sampleResult = new QueryResult({
        header: Column.fromColumnNames(['time', 'cityName', 'EXPR$0', 'delta', 'deleted']),
        rows: [[new Date('2020-01-01T00:00:00'), 'SF', 1, 4, true]],
      });

      expect(
        Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult, sampleResult),
      ).toEqual([
        {
          name: 'time',
          type: 'TIMESTAMP',
        },
        {
          name: 'cityName',
          type: 'STRING',
        },
        {
          name: 'delta',
          type: 'LONG',
        },
        {
          name: 'deleted',
          type: 'BOOLEAN',
        },
      ]);
    });

    it('works with star with fancy names', () => {
      const query = SqlQuery.parse(sane`
        SELECT "time", cityName, added + 1, * FROM wikipedia
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: Column.fromColumnNames(['PLAN']),
        rows: [
          [
            'DruidQueryRel(query=[...\n...], signature=[{Hello World:LONG, A-B:STRING, Россия:LONG, ö:LONG, hello, world:LONG}])\n',
          ],
        ],
      });

      const sampleResult = new QueryResult({
        header: Column.fromColumnNames(['time', 'cityName', 'EXPR$0', 'delta', 'deleted']),
        rows: [[new Date('2020-01-01T00:00:00'), 'SF', 1, 4, true]],
      });

      expect(
        Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult, sampleResult),
      ).toEqual([
        {
          name: 'time',
          type: 'TIMESTAMP',
        },
        {
          name: 'cityName',
          type: 'STRING',
        },
        {
          name: 'delta',
          type: 'LONG',
        },
        {
          name: 'deleted',
          type: 'BOOLEAN',
        },
      ]);
    });

    it('works with a JOIN query', () => {
      const query = SqlQuery.parse(sane`
        SELECT
          browser,
          lookup.browser_maker.v AS "maker",
          COUNT(*) AS "Count"
        FROM kttm
        LEFT JOIN lookup.browser_maker ON lookup.browser_maker.k = kttm.browser
        GROUP BY 1, 2
        ORDER BY 3 DESC
      `);

      const queryPlanResult = new QueryResult({
        sqlQuery: Introspect.getQueryColumnIntrospectionQuery(query),
        header: Column.fromColumnNames(['PLAN']),
        rows: [
          [
            '\nDruidJoinQueryRel(condition=[=($4, $29)], joinType=[left], query=[{ ... }], signature=[{d0:STRING, d1:STRING, a0:LONG}]) DruidQueryRel(query=[{ ... }], signature=[{__time:LONG, adblock_list:STRING, agent_category:STRING, agent_type:STRING, browser:STRING, browser_version:STRING, city:STRING, continent:STRING, country:STRING, event_subtype:STRING, event_type:STRING, forwarded_for:STRING, language:STRING, loaded_image:STRING, number:LONG, os:STRING, path:STRING, platform:STRING, referrer:STRING, referrer_host:STRING, region:STRING, remote_address:STRING, screen:STRING, session:STRING, session_length:LONG, timezone:STRING, timezone_offset:LONG, version:STRING, window:STRING}]) DruidQueryRel(query=[{ ... }], signature=[{k:STRING, v:STRING}])\n',
          ],
        ],
      });

      expect(Introspect.decodeQueryColumnIntrospectionResult(queryPlanResult)).toEqual([
        {
          name: 'browser',
          type: 'STRING',
        },
        {
          name: 'maker',
          type: 'STRING',
        },
        {
          name: 'Count',
          type: 'LONG',
        },
      ]);
    });
  });
});
