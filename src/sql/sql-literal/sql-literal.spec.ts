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

import { sqlParserFactory } from '../..';
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('literal', () => {
  it('string literal', () => {
    const sql = `'word'`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"'word'"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "stringValue": "word",
        "type": "literal",
        "value": "word",
      }
    `);
  });

  it('number literal', () => {
    const sql = `1`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
    `);
  });

  it('number literal with brackets', () => {
    const sql = `(1)`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(1)"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
    `);
  });
  it('string literal with brackets', () => {
    const sql = `('word')`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"('word')"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "stringValue": "word",
        "type": "literal",
        "value": "word",
      }
    `);
  });
});
