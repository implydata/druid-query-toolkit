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
          SqlRef.fromName('country', 'lookup'),
          SqlMulti.sqlMultiFactory('=', [
            SqlRef.fromName(SqlRef.fromName('v', 'country'), 'lookup'),
            SqlRef.fromName('countryName', 'wikipedia'),
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
          SqlRef.fromName('country', 'lookup'),
          SqlMulti.sqlMultiFactory('=', [
            SqlRef.fromName(SqlRef.fromName('v', 'country'), 'lookup'),
            SqlRef.fromName('countryName', 'wikipedia'),
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
