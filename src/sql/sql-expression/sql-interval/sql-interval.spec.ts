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

import { parseSql } from '../../..';
import { backAndForth } from '../../../test-utils';

describe('SqlInterval', () => {
  it('Simple function', () => {
    const sql = `INTERVAL '1' DAY`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlInterval {
        "innerSpacing": Object {
          "postIntervalKeyword": " ",
          "postIntervalValue": " ",
        },
        "intervalKeyword": "INTERVAL",
        "intervalValue": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "'1'",
          "type": "literal",
          "value": "1",
        },
        "type": "interval",
        "unitKeyword": "DAY",
      }
    `);
  });

  it('YEAR TO MONTH interval', () => {
    const sql = `INTERVAL '1-2' YEAR TO MONTH`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlInterval {
        "innerSpacing": Object {
          "postIntervalKeyword": " ",
          "postIntervalValue": " ",
        },
        "intervalKeyword": "INTERVAL",
        "intervalValue": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "'1-2'",
          "type": "literal",
          "value": "1-2",
        },
        "type": "interval",
        "unitKeyword": "YEAR TO MONTH",
      }
    `);
  });

  it('YEAR TO MONTH interval', () => {
    const sql = `INTERVAL '1-2' YEAR_MONTH`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlInterval {
        "innerSpacing": Object {
          "postIntervalKeyword": " ",
          "postIntervalValue": " ",
        },
        "intervalKeyword": "INTERVAL",
        "intervalValue": SqlLiteral {
          "innerSpacing": Object {},
          "keyword": undefined,
          "stringValue": "'1-2'",
          "type": "literal",
          "value": "1-2",
        },
        "type": "interval",
        "unitKeyword": "YEAR_MONTH",
      }
    `);
  });
});