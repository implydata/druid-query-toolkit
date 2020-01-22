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

describe('Functions', () => {
  it('Simple function', () => {
    const sql = `SUM(A)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Function {
        "argument": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "fn": "SUM",
        "leftSpacing": "",
        "rightSpacing": "",
        "type": "function",
      }
    `);
  });

  it('function in brackets', () => {
    const sql = `(  SUM(A))`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Function {
        "argument": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "fn": "SUM",
        "leftSpacing": "",
        "parens": Array [
          Object {
            "leftSpacing": "  ",
            "rightSpacing": "",
          },
        ],
        "rightSpacing": "",
        "type": "function",
      }
    `);
  });

  it('function with expression', () => {
    const sql = `SUM( 1 + 2 AND 3 + 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Function {
        "argument": Expression {
          "left": Expression {
            "left": SqlLiteral {
              "stringValue": "1",
              "type": "literal",
              "value": 1,
            },
            "leftSpace": " ",
            "operator": "+",
            "right": SqlLiteral {
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": Expression {
            "left": SqlLiteral {
              "stringValue": "3",
              "type": "literal",
              "value": 3,
            },
            "leftSpace": " ",
            "operator": "+",
            "right": SqlLiteral {
              "stringValue": "2",
              "type": "literal",
              "value": 2,
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "fn": "SUM",
        "leftSpacing": " ",
        "rightSpacing": "",
        "type": "function",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"SUM( 1 + 2 AND 3 + 2)"`);
  });

  it('function with weird spacing ', () => {
    const sql = `SUM( A      )`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Function {
        "argument": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "fn": "SUM",
        "leftSpacing": " ",
        "rightSpacing": "      ",
        "type": "function",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"SUM( A      )"`);
  });

  it('function in expression', () => {
    const sql = `Sum(A) OR SUM(B) AND SUM(c) * 4`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Function {
          "argument": SqlRef {
            "innerSpacing": Object {},
            "name": "A",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "fn": "Sum",
          "leftSpacing": "",
          "rightSpacing": "",
          "type": "function",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": Expression {
          "left": Function {
            "argument": SqlRef {
              "innerSpacing": Object {},
              "name": "B",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "fn": "SUM",
            "leftSpacing": "",
            "rightSpacing": "",
            "type": "function",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": Expression {
            "left": Function {
              "argument": SqlRef {
                "innerSpacing": Object {},
                "name": "c",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "fn": "SUM",
              "leftSpacing": "",
              "rightSpacing": "",
              "type": "function",
            },
            "leftSpace": " ",
            "operator": "*",
            "right": SqlLiteral {
              "stringValue": "4",
              "type": "literal",
              "value": 4,
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"Sum(A) OR SUM(B) AND SUM(c) * 4"`);
  });
});
