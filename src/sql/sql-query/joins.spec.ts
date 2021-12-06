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

import { SqlExpression, SqlJoinPart, SqlQuery, SqlRef } from '../..';
import { backAndForth } from '../../test-utils';
import { sane } from '../../utils';

describe('joins', () => {
  describe('parse join with lookup', () => {
    it('parses a basic math expression', () => {
      const sql = sane`
        SELECT countryName from wikipedia
        Left JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `;

      backAndForth(sql);
      expect(SqlQuery.parse(sql).getJoins()[0].joinType).toEqual('LEFT');
    });

    it('parses a left outer join', () => {
      const sql = sane`
        SELECT countryName from wikipedia
        Left OUTER JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `;

      backAndForth(sql);
      expect(SqlQuery.parse(sql).getJoins()[0].joinType).toEqual('LEFT');
    });

    it('parses a right outer join', () => {
      const sql = sane`
        SELECT countryName from wikipedia
        Right OUTER JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `;

      backAndForth(sql);
      expect(SqlQuery.parse(sql).getJoins()[0].joinType).toEqual('RIGHT');
    });

    it('parses a full outer join', () => {
      const sql = sane`
        SELECT countryName from wikipedia
        FULL OUTER JOIN lookup.country ON lookup.country.v = wikipedia.countryName
      `;

      backAndForth(sql);
      expect(SqlQuery.parse(sql).getJoins()[0].joinType).toEqual('FULL');
    });

    it('parses CROSS JOIN', () => {
      const sql = sane`
        SELECT
          "channel", lookup.lang.v,
          COUNT(*) AS "Count"
        FROM "wikipedia_k" CROSS JOIN lookup.lang
        GROUP BY 1, 2
        ORDER BY "Count" DESC
      `;

      backAndForth(sql);
    });
  });

  describe('addJoin', () => {
    it('Add left join explicitly', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addJoin(
            SqlJoinPart.create(
              'LEFT',
              SqlRef.column('country', 'lookup'),
              SqlExpression.parse('lookup.country.v = wikipedia.countryName'),
            ),
          )
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName"
      `);
    });

    it('Add left join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addLeftJoin(
            SqlRef.column('country', 'lookup'),
            SqlExpression.parse('lookup.country.v = wikipedia.countryName'),
          )
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName"
      `);
    });

    it('Add inner join', () => {
      expect(
        SqlQuery.parse(`SELECT countryName from wikipedia`)
          .addInnerJoin(
            SqlRef.column('country', 'lookup'),
            SqlExpression.parse('lookup.country.v = wikipedia.countryName'),
          )
          .toString(),
      ).toMatchInlineSnapshot(`
        "SELECT countryName from wikipedia
        INNER JOIN lookup.country ON lookup.country.v = wikipedia.countryName"
      `);
    });
  });

  describe('Remove join', () => {
    it('Remove Join', () => {
      expect(
        SqlQuery.parse(
          sane`
          SELECT countryName from wikipedia
          LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName
        `,
        )
          .removeAllJoins()
          .toString(),
      ).toMatchInlineSnapshot(`"SELECT countryName from wikipedia"`);
    });
  });
});
