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

import { Column, Introspect, QueryResult } from '..';

describe('Introspect', () => {
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
      const emptyQueryResult = new QueryResult({
        header: [],
        rows: [],
      });

      expect(Introspect.decodeTableIntrospectionResult(emptyQueryResult)).toEqual([]);
    });
  });

  describe('.decodeQueryColumnIntrospectionResult', () => {
    /*
    The response from doing SELECT * on:

    INSERT INTO "wiki_reshape"
    SELECT
      "__time",
      "channel",
      "added",
      "cityName" = 'San Francisco' AS "is_sf",
      APPROX_COUNT_DISTINCT("user") AS "unique_user_hll",
      DS_HLL("user") AS "unique_user_ds_hll",
      DS_THETA("page") AS "theta_page",
      DS_QUANTILES_SKETCH("commentLength") AS "comment_length_quantile"
    FROM "wikipedia"
    GROUP BY 1, 2, 3, 4
    PARTITIONED BY DAY
     */

    it('works with all types', () => {
      const data = [
        [
          '__time',
          'channel',
          'added',
          'is_sf',
          'comment_length_quantile',
          'theta_page',
          'unique_user_ds_hll',
          'unique_user_hll',
        ],
        [
          'LONG',
          'STRING',
          'LONG',
          'LONG',
          'COMPLEX<quantilesDoublesSketch>',
          'COMPLEX<thetaSketch>',
          'COMPLEX<HLLSketch>',
          'COMPLEX<hyperUnique>',
        ],
        ['TIMESTAMP', 'VARCHAR', 'BIGINT', 'BIGINT', 'OTHER', 'OTHER', 'OTHER', 'OTHER'],
      ];

      const queryResult = QueryResult.fromRawResult(data, true, true, true, true);

      expect(Introspect.decodeQueryColumnIntrospectionResult(queryResult)).toEqual([
        {
          name: '__time',
          nativeType: 'LONG',
          sqlType: 'TIMESTAMP',
        },
        {
          name: 'channel',
          nativeType: 'STRING',
          sqlType: 'VARCHAR',
        },
        {
          name: 'added',
          nativeType: 'LONG',
          sqlType: 'BIGINT',
        },
        {
          name: 'is_sf',
          nativeType: 'LONG',
          sqlType: 'BIGINT',
        },
        {
          name: 'comment_length_quantile',
          nativeType: 'COMPLEX<quantilesDoublesSketch>',
          sqlType: 'OTHER',
        },
        {
          name: 'theta_page',
          nativeType: 'COMPLEX<thetaSketch>',
          sqlType: 'OTHER',
        },
        {
          name: 'unique_user_ds_hll',
          nativeType: 'COMPLEX<HLLSketch>',
          sqlType: 'OTHER',
        },
        {
          name: 'unique_user_hll',
          nativeType: 'COMPLEX<hyperUnique>',
          sqlType: 'OTHER',
        },
      ]);
    });
  });
});
