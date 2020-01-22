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

describe('OR expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A OR B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' OR 'B'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "A",
          "type": "literal",
          "value": "A",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": SqlLiteral {
          "stringValue": "B",
          "type": "literal",
          "value": "B",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" OR "B"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
  });

  it('single expression with numbers', () => {
    const sql = `1 OR 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
  });

  it('brackets', () => {
    const sql = `(1 OR 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": "OR",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
  });

  it('strange spacing and brackets', () => {
    const sql = `1   OR 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": "   ",
        "operator": "OR",
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
  });

  it('strange spacing and brackets', () => {
    const sql = `( 1   OR 2 )`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": "   ",
        "operator": "OR",
        "parens": Array [
          Object {
            "leftSpacing": " ",
            "rightSpacing": " ",
          },
        ],
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
  });
});

describe('AND expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A AND B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "AND",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A AND B"`);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' AND 'B'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "A",
          "type": "literal",
          "value": "A",
        },
        "leftSpace": " ",
        "operator": "AND",
        "right": SqlLiteral {
          "stringValue": "B",
          "type": "literal",
          "value": "B",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"'A' AND 'B'"`);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" AND "B"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "AND",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"A\\" AND \\"B\\""`);
  });

  it('single expression with numbers', () => {
    const sql = `1 AND 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": "AND",
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 AND 2"`);
  });

  it('brackets', () => {
    const sql = `(1 AND 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": "AND",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(1 AND 2)"`);
  });
});

describe('Comparison expression', () => {
  it('single expression with unquoted string', () => {
    const sql = `A > B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": ">",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A > B"`);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' > 'B'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "A",
          "type": "literal",
          "value": "A",
        },
        "leftSpace": " ",
        "operator": ">",
        "right": SqlLiteral {
          "stringValue": "B",
          "type": "literal",
          "value": "B",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"'A' > 'B'"`);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" > "B"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": ">",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"A\\" > \\"B\\""`);
  });

  it('single expression with numbers', () => {
    const sql = `1 > 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": ">",
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 > 2"`);
  });

  it('brackets', () => {
    const sql = `(1 > 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": ">",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(1 > 2)"`);
  });

  it('Between expression', () => {
    const sql = `X BETWEEN Y AND Z`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "X",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "BETWEEN",
        "right": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "Y",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "Z",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"X BETWEEN Y AND Z"`);
  });

  it('Mixed Between expression', () => {
    const sql = `A OR B AND X BETWEEN Y AND Z`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "B",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": Expression {
            "left": SqlRef {
              "innerSpacing": Object {},
              "name": "X",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "leftSpace": " ",
            "operator": "BETWEEN",
            "right": Expression {
              "left": SqlRef {
                "innerSpacing": Object {},
                "name": "Y",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "leftSpace": " ",
              "operator": "AND",
              "right": SqlRef {
                "innerSpacing": Object {},
                "name": "Z",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "rightSpace": " ",
              "type": "expression",
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A OR B AND X BETWEEN Y AND Z"`);
  });

  it('Nested Between expression', () => {
    const sql = `X BETWEEN Y AND A BETWEEN B AND C`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "X",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "BETWEEN",
        "right": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "Y",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": Expression {
            "left": SqlRef {
              "innerSpacing": Object {},
              "name": "A",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "leftSpace": " ",
            "operator": "BETWEEN",
            "right": Expression {
              "left": SqlRef {
                "innerSpacing": Object {},
                "name": "B",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "leftSpace": " ",
              "operator": "AND",
              "right": SqlRef {
                "innerSpacing": Object {},
                "name": "C",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "rightSpace": " ",
              "type": "expression",
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"X BETWEEN Y AND A BETWEEN B AND C"`);
  });
});

describe('Math expression', () => {
  it('Addition', () => {
    const sql = `1 + 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 + 2"`);
  });

  it('Subtraction', () => {
    const sql = `1 - 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": "-",
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 - 2"`);
  });

  it('Multiplication', () => {
    const sql = `1 * 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": "*",
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 * 2"`);
  });

  it('Division', () => {
    const sql = `1 / 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": "/",
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 / 2"`);
  });

  it('single expression with unquoted string', () => {
    const sql = `A + B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "+",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A + B"`);
  });

  it('single expression with single quoted string', () => {
    const sql = `'A' + 'B'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "A",
          "type": "literal",
          "value": "A",
        },
        "leftSpace": " ",
        "operator": "+",
        "right": SqlLiteral {
          "stringValue": "B",
          "type": "literal",
          "value": "B",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"'A' + 'B'"`);
  });

  it('single expression with double quoted string', () => {
    const sql = `"A" + "B"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "+",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"A\\" + \\"B\\""`);
  });

  it('single expression with numbers', () => {
    const sql = `1 + 2`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
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
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1 + 2"`);
  });

  it('brackets', () => {
    const sql = `(1 + 2)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlLiteral {
          "stringValue": "1",
          "type": "literal",
          "value": 1,
        },
        "leftSpace": " ",
        "operator": "+",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "right": SqlLiteral {
          "stringValue": "2",
          "type": "literal",
          "value": 2,
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(1 + 2)"`);
  });
});

describe('Combined expression', () => {
  it('Every expression', () => {
    const sql = `A OR B AND C > D + E`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "B",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": Expression {
            "left": SqlRef {
              "innerSpacing": Object {},
              "name": "C",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "leftSpace": " ",
            "operator": ">",
            "right": Expression {
              "left": SqlRef {
                "innerSpacing": Object {},
                "name": "D",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "leftSpace": " ",
              "operator": "+",
              "right": SqlRef {
                "innerSpacing": Object {},
                "name": "E",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "rightSpace": " ",
              "type": "expression",
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A OR B AND C > D + E"`);
  });

  it('Every expression out of order', () => {
    const sql = `A + B > C AND D OR E`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Expression {
          "left": Expression {
            "left": Expression {
              "left": SqlRef {
                "innerSpacing": Object {},
                "name": "A",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "leftSpace": " ",
              "operator": "+",
              "right": SqlRef {
                "innerSpacing": Object {},
                "name": "B",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "rightSpace": " ",
              "type": "expression",
            },
            "leftSpace": " ",
            "operator": ">",
            "right": SqlRef {
              "innerSpacing": Object {},
              "name": "C",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "D",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "E",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A + B > C AND D OR E"`);
  });

  it('Every expression out of order', () => {
    const sql = `A AND B > C + D OR E`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "A",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": Expression {
            "left": SqlRef {
              "innerSpacing": Object {},
              "name": "B",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "leftSpace": " ",
            "operator": ">",
            "right": Expression {
              "left": SqlRef {
                "innerSpacing": Object {},
                "name": "C",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "leftSpace": " ",
              "operator": "+",
              "right": SqlRef {
                "innerSpacing": Object {},
                "name": "D",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "rightSpace": " ",
              "type": "expression",
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "E",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A AND B > C + D OR E"`);
  });
});

describe('Multiple expressions', () => {
  it('Multiple Or ', () => {
    const sql = `A OR B OR C`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": SqlRef {
          "innerSpacing": Object {},
          "name": "A",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "B",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "OR",
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "C",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A OR B OR C"`);
  });

  it('Multiple ANDs and ORs', () => {
    const sql = `A AND B OR C AND D OR E`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "A",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "B",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": Expression {
          "left": Expression {
            "left": SqlRef {
              "innerSpacing": Object {},
              "name": "C",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "leftSpace": " ",
            "operator": "AND",
            "right": SqlRef {
              "innerSpacing": Object {},
              "name": "D",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "leftSpace": " ",
          "operator": "OR",
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "E",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"A AND B OR C AND D OR E"`);
  });
});

describe('Not expression', () => {
  it('single not expression', () => {
    const sql = `NOT B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": undefined,
        "leftSpace": "",
        "operator": "NOT",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "B",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT B"`);
  });

  it('multiple not expressions', () => {
    const sql = `NOT A AND NOT B AND NOT C`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Expression {
          "left": undefined,
          "leftSpace": "",
          "operator": "NOT",
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "A",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "leftSpace": " ",
        "operator": "AND",
        "right": Expression {
          "left": Expression {
            "left": undefined,
            "leftSpace": "",
            "operator": "NOT",
            "right": SqlRef {
              "innerSpacing": Object {},
              "name": "B",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "leftSpace": " ",
          "operator": "AND",
          "right": Expression {
            "left": undefined,
            "leftSpace": "",
            "operator": "NOT",
            "right": SqlRef {
              "innerSpacing": Object {},
              "name": "C",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT A AND NOT B AND NOT C"`);
  });

  it('Not containing an expression', () => {
    const sql = `NOT A > B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": undefined,
        "leftSpace": "",
        "operator": "NOT",
        "right": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "A",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": ">",
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "B",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT A > B"`);
  });

  it('Multiple Not expressions containing an expression', () => {
    const sql = `NOT A > B OR Not C = 'D'`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Expression {
          "left": undefined,
          "leftSpace": "",
          "operator": "NOT",
          "right": Expression {
            "left": SqlRef {
              "innerSpacing": Object {},
              "name": "A",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "leftSpace": " ",
            "operator": ">",
            "right": SqlRef {
              "innerSpacing": Object {},
              "name": "B",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": Expression {
          "left": undefined,
          "leftSpace": "",
          "operator": "Not",
          "right": Expression {
            "left": SqlRef {
              "innerSpacing": Object {},
              "name": "C",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "leftSpace": " ",
            "operator": "=",
            "right": SqlLiteral {
              "stringValue": "D",
              "type": "literal",
              "value": "D",
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT A > B OR Not C = 'D'"`);
  });

  it('Nested Not Expressions', () => {
    const sql = `NOT NOT A > B`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": undefined,
        "leftSpace": "",
        "operator": "NOT",
        "right": Expression {
          "left": undefined,
          "leftSpace": "",
          "operator": "NOT",
          "right": Expression {
            "left": SqlRef {
              "innerSpacing": Object {},
              "name": "A",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "leftSpace": " ",
            "operator": ">",
            "right": SqlRef {
              "innerSpacing": Object {},
              "name": "B",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
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
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT NOT A > B"`);
  });
});

describe('Brackets', () => {
  it('Changing order of operations', () => {
    const sql = `(A AND b) OR c`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "A",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "AND",
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "b",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "c",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(A AND b) OR c"`);
  });

  it('Wrapping Expression', () => {
    const sql = `((A + b) OR c)`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Expression {
          "left": SqlRef {
            "innerSpacing": Object {},
            "name": "A",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "leftSpace": " ",
          "operator": "+",
          "parens": Array [
            Object {
              "leftSpacing": "",
              "rightSpacing": "",
            },
          ],
          "right": SqlRef {
            "innerSpacing": Object {},
            "name": "b",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "leftSpace": " ",
        "operator": "OR",
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "c",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"((A + b) OR c)"`);
  });

  it('Changing order of operations', () => {
    const sql = `NOT NOT (A + b) OR c`;

    expect(parser(sql)).toMatchInlineSnapshot(`
      Expression {
        "left": Expression {
          "left": undefined,
          "leftSpace": "",
          "operator": "NOT",
          "right": Expression {
            "left": undefined,
            "leftSpace": "",
            "operator": "NOT",
            "right": Expression {
              "left": SqlRef {
                "innerSpacing": Object {},
                "name": "A",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "leftSpace": " ",
              "operator": "+",
              "parens": Array [
                Object {
                  "leftSpacing": "",
                  "rightSpacing": "",
                },
              ],
              "right": SqlRef {
                "innerSpacing": Object {},
                "name": "b",
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "type": "ref",
              },
              "rightSpace": " ",
              "type": "expression",
            },
            "rightSpace": " ",
            "type": "expression",
          },
          "rightSpace": " ",
          "type": "expression",
        },
        "leftSpace": " ",
        "operator": "OR",
        "right": SqlRef {
          "innerSpacing": Object {},
          "name": "c",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        },
        "rightSpace": " ",
        "type": "expression",
      }
    `);
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NOT NOT (A + b) OR c"`);
  });
});
