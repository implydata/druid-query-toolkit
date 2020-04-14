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

import { SqlMulti, sqlParserFactory, SqlRef } from '../..';
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('parse join with lookup', () => {
  it('parsers a basic math expression', () => {
    expect(
      parser(`SELECT countryName from wikipedia
LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName`).toString(),
    ).toMatchInlineSnapshot(`
      "SELECT countryName from wikipedia
      LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName"
    `);
  });
});

describe('Add Join', () => {
  it('Add left join', () => {
    expect(
      parser(`SELECT countryName from wikipedia`)
        .addJoin(
          'LEFT',
          SqlRef.fromString('country', 'lookup'),
          SqlMulti.sqlMultiFactory('=', [
            SqlRef.fromString('v', 'country', 'lookup'),
            SqlRef.fromString('countryName', 'wikipedia'),
          ]),
        )
        .toString(),
    ).toMatchInlineSnapshot(`
      "SELECT countryName from wikipedia
      LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName"
    `);
  });
  it('Add inner join', () => {
    expect(
      parser(`SELECT countryName from wikipedia`)
        .addJoin(
          'INNER',
          SqlRef.fromString('country', 'lookup'),
          SqlMulti.sqlMultiFactory('=', [
            SqlRef.fromString('v', 'country', 'lookup'),
            SqlRef.fromString('countryName', 'wikipedia'),
          ]),
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
      parser(`SELECT countryName from wikipedia
      LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName`)
        .removeJoin()
        .toString(),
    ).toMatchInlineSnapshot(`"SELECT countryName from wikipedia"`);
  });
});

describe('Check if column is in On expression', () => {
  it('is contained', () => {
    expect(
      parser(`SELECT countryName from wikipedia
      LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName`).onExpression.containsColumn(
        'v',
      ),
    ).toEqual(true);
  });
  it('is contained', () => {
    expect(
      parser(`SELECT countryName from wikipedia
      LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName`).onExpression.containsColumn(
        'countryName',
      ),
    ).toEqual(true);
  });
  it('is not contained', () => {
    expect(
      parser(`SELECT countryName from wikipedia
      LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName`).onExpression.containsColumn(
        'k',
      ),
    ).toEqual(false);
  });
});
