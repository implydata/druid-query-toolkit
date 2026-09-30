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

import { SqlExpression, SqlInterval } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlInterval', () => {
  describe('parses', () => {
    it('simple interval', () => {
      const sql = `INTERVAL '2' DAYS`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlInterval {
        "intervalValue": SqlLiteral {
          "keywords": Object {},
          "parens": undefined,
          "spacing": Object {},
          "stringValue": "'2'",
          "type": "literal",
          "value": "2",
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
        "unit": "DAYS",
      }
    `);
    });

    it('YEAR TO MONTH interval', () => {
      const sql = `INTERVAL '1-2' YEAR TO MONTH`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlInterval {
        "intervalValue": SqlLiteral {
          "keywords": Object {},
          "parens": undefined,
          "spacing": Object {},
          "stringValue": "'1-2'",
          "type": "literal",
          "value": "1-2",
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
        "unit": "YEAR TO MONTH",
      }
    `);
    });

    it('YEAR_MONTH interval', () => {
      const sql = `INTERVAL '1-2' YEAR_MONTH`;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlInterval {
        "intervalValue": SqlLiteral {
          "keywords": Object {},
          "parens": undefined,
          "spacing": Object {},
          "stringValue": "'1-2'",
          "type": "literal",
          "value": "1-2",
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
        "unit": "YEAR_MONTH",
      }
    `);
    });
  });

  describe('.create', () => {
    it('creates an interval from a unit and a number', () => {
      const interval = SqlInterval.create('DAY', 2);

      expect(interval.toString()).toEqual(`INTERVAL '2' DAY`);
      expect(interval.unit).toEqual('DAY');
      expect(interval.intervalValue?.value).toEqual('2');
    });
  });

  describe('#valueOf', () => {
    it('carries the interval value and unit into changed copies', () => {
      const interval = SqlExpression.parse(`interval  '3'  HOUR`) as SqlInterval;
      const reset = interval.resetOwnSpacing().resetOwnKeywords();

      expect(reset).toBeInstanceOf(SqlInterval);
      expect(reset.unit).toEqual('HOUR');
      expect(reset.intervalValue).toBe(interval.intervalValue);
      expect(reset.toString()).toEqual(`INTERVAL '3' HOUR`);
    });
  });
});
