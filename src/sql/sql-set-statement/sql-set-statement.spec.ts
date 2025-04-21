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

import { sane } from '../../utils';

import { SqlSetStatement } from './sql-set-statement';

describe('SqlSetStatement', () => {
  describe('.parseStatementsOnly', () => {
    it('parses nothing with an error', () => {
      expect(
        SqlSetStatement.parseStatementsOnly(sane`
          -- Comment
          sdfsdf
          dsfdsf
          sdfsdf
        `),
      ).toMatchInlineSnapshot(`
        Object {
          "rest": "sdfsdf
        dsfdsf
        sdfsdf",
          "spaceBefore": "-- Comment
        ",
        }
      `);
    });

    it('parses single statement', () => {
      expect(
        SqlSetStatement.parseStatementsOnly(sane`
          -- Comment
          Set Hello = 1;
          sdfsdf
          dsfdsf
          sdfsdf
        `),
      ).toMatchInlineSnapshot(`
        Object {
          "contextStatements": SeparatedArray {
            "separators": Array [],
            "values": Array [
              SqlSetStatement {
                "key": RefName {
                  "name": "Hello",
                  "quotes": false,
                },
                "keywords": Object {
                  "set": "Set",
                },
                "parens": undefined,
                "spacing": Object {
                  "postKey": " ",
                  "postSet": " ",
                  "postValue": "",
                },
                "type": "setStatement",
                "value": SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              },
            ],
          },
          "rest": "sdfsdf
        dsfdsf
        sdfsdf",
          "spaceAfter": "
        ",
          "spaceBefore": "-- Comment
        ",
        }
      `);
    });

    it('parses multiple statements', () => {
      expect(
        SqlSetStatement.parseStatementsOnly(sane`
          -- Comment
          Set Hello = 1;
          SET "moon" = 'lol';

          SELECT * FROM tbl
          sdfsdf
          dsfdsf
          sdfsdf
        `),
      ).toMatchInlineSnapshot(`
        Object {
          "contextStatements": SeparatedArray {
            "separators": Array [
              "
        ",
            ],
            "values": Array [
              SqlSetStatement {
                "key": RefName {
                  "name": "Hello",
                  "quotes": false,
                },
                "keywords": Object {
                  "set": "Set",
                },
                "parens": undefined,
                "spacing": Object {
                  "postKey": " ",
                  "postSet": " ",
                  "postValue": "",
                },
                "type": "setStatement",
                "value": SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "1",
                  "type": "literal",
                  "value": 1,
                },
              },
              SqlSetStatement {
                "key": RefName {
                  "name": "moon",
                  "quotes": true,
                },
                "keywords": Object {
                  "set": "SET",
                },
                "parens": undefined,
                "spacing": Object {
                  "postKey": " ",
                  "postSet": " ",
                  "postValue": "",
                },
                "type": "setStatement",
                "value": SqlLiteral {
                  "keywords": Object {},
                  "parens": undefined,
                  "spacing": Object {},
                  "stringValue": "'lol'",
                  "type": "literal",
                  "value": "lol",
                },
              },
            ],
          },
          "rest": "SELECT * FROM tbl
        sdfsdf
        dsfdsf
        sdfsdf",
          "spaceAfter": "

        ",
          "spaceBefore": "-- Comment
        ",
        }
      `);
    });
  });

  describe('.partitionSetStatements', () => {
    it('works when there is nothing to parse', () => {
      const text = sane`
        -- Comment
        sdfsdf
        dsfdsf
        sdfsdf
      `;

      expect(SqlSetStatement.partitionSetStatements(text)).toEqual([
        '',
        sane`
          -- Comment
          sdfsdf
          dsfdsf
          sdfsdf
        `,
      ]);

      expect(SqlSetStatement.partitionSetStatements(text, true)).toEqual([
        sane`
          -- Comment

        `,
        sane`
          sdfsdf
          dsfdsf
          sdfsdf
        `,
      ]);
    });

    it('works when there is something to parse', () => {
      const text = sane`
        -- Comment
        Set Hello = 1;
        SET "moon" = 'lol';

        SELECT * FROM tbl
        sdfsdf
        dsfdsf
        sdfsdf
      `;

      console.log(text);

      expect(SqlSetStatement.partitionSetStatements(text)).toEqual([
        sane`
          -- Comment
          Set Hello = 1;
          SET "moon" = 'lol';
        `,
        sane`


          SELECT * FROM tbl
          sdfsdf
          dsfdsf
          sdfsdf
        `,
      ]);

      expect(SqlSetStatement.partitionSetStatements(text, true)).toEqual([
        sane`
          -- Comment
          Set Hello = 1;
          SET "moon" = 'lol';


        `,
        sane`
          SELECT * FROM tbl
          sdfsdf
          dsfdsf
          sdfsdf
        `,
      ]);
    });
  });

  describe('.getContextFromText', () => {
    it('works when there is nothing to parse', () => {
      expect(
        SqlSetStatement.getContextFromText(sane`
          -- SQL Haiku

          Database language,
          Queries dancing through tables,
          Data reveals truth.
        `),
      ).toEqual({});
    });

    it('works when there is some SQL but no context', () => {
      expect(
        SqlSetStatement.getContextFromText(sane`
          -- SQL Haiku

          SELECT * FROM haihu

          Database language,
          Queries dancing through tables,
          Data reveals truth.
        `),
      ).toEqual({});
    });

    it('works when there is context', () => {
      expect(
        SqlSetStatement.getContextFromText(sane`
          -- SQL Haiku

          SET "moon" = 'lol';
          set "one" = 1;

          Database language,
          Queries dancing through tables,
          Data reveals truth.
        `),
      ).toEqual({
        moon: 'lol',
        one: 1,
      });
    });
  });

  describe('.setContextInText', () => {
    it('works when there is nothing to parse', () => {
      expect(
        SqlSetStatement.setContextInText(
          sane`
            -- SQL Haiku

            Database language,
            Queries dancing through tables,
            Data reveals truth.
          `,
          { hello: 'world', x: 1 },
        ),
      ).toEqual(sane`
        -- SQL Haiku

        SET hello = 'world';
        SET x = 1;
        Database language,
        Queries dancing through tables,
        Data reveals truth.
      `);
    });

    it('works when there is some SQL but no context', () => {
      expect(
        SqlSetStatement.setContextInText(
          sane`
            -- SQL Haiku

            SELECT * FROM haihu

            Database language,
            Queries dancing through tables,
            Data reveals truth.
          `,
          { hello: 'world', x: 1 },
        ),
      ).toEqual(sane`
        -- SQL Haiku

        SET hello = 'world';
        SET x = 1;
        SELECT * FROM haihu

        Database language,
        Queries dancing through tables,
        Data reveals truth.
      `);
    });

    it('works when there is context', () => {
      expect(
        SqlSetStatement.setContextInText(
          sane`
            -- SQL Haiku

            SET "moon" = 'lol';
            set "one" = 1;

            Database language,
            Queries dancing through tables,
            Data reveals truth.
          `,
          { hello: 'world', x: 1 },
        ),
      ).toEqual(sane`
        -- SQL Haiku

        SET hello = 'world';
        SET x = 1;

        Database language,
        Queries dancing through tables,
        Data reveals truth.
      `);
    });
  });

  describe('#changeKey', () => {
    it('works', () => {
      expect(SqlSetStatement.create('x', 'lol').changeKey('y').toString()).toEqual(
        `SET y = 'lol';`,
      );
    });
  });
});
