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

import { RefName, sane, SqlColumn, SqlExpression, SqlLabeledExpression, SqlLiteral } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlLabeledExpression', () => {
  describe('.create', () => {
    it('creates a labeled expression from a string label and an expression', () => {
      const label = 'myLabel';
      const expression = SqlLiteral.create(123);

      const labeledExpression = SqlLabeledExpression.create(label, expression);

      expect(labeledExpression).toBeInstanceOf(SqlLabeledExpression);
      expect(labeledExpression.getLabelName()).toBe(label);
      expect(labeledExpression.getUnderlyingExpression()).toBe(expression);
      expect(labeledExpression.toString()).toEqual(`"myLabel" => 123`);
    });

    it('creates a labeled expression from a RefName label and an expression', () => {
      const label = RefName.create('myLabel', false);
      const expression = SqlLiteral.create(123);

      const labeledExpression = SqlLabeledExpression.create(label, expression);

      expect(labeledExpression).toBeInstanceOf(SqlLabeledExpression);
      expect(labeledExpression.getLabelName()).toBe('myLabel');
      expect(labeledExpression.getUnderlyingExpression()).toBe(expression);
      expect(labeledExpression.toString()).toEqual(`myLabel => 123`);
    });

    it('handles forced quoting when specified', () => {
      const label = 'myLabel';
      const expression = SqlLiteral.create(123);
      const forceQuotes = true;

      const labeledExpression = SqlLabeledExpression.create(label, expression, forceQuotes);

      expect(labeledExpression).toBeInstanceOf(SqlLabeledExpression);
      expect(labeledExpression.label.quotes).toBe(true);
      expect(labeledExpression.toString()).toEqual(`"myLabel" => 123`);
    });

    it('quotes reserved words automatically', () => {
      const label = 'select'; // SQL reserved keyword
      const expression = SqlLiteral.create(123);

      const labeledExpression = SqlLabeledExpression.create(label, expression, false);

      expect(labeledExpression).toBeInstanceOf(SqlLabeledExpression);
      expect(labeledExpression.label.quotes).toBe(true);
      expect(labeledExpression.toString()).toEqual(`"select" => 123`);
    });

    it('changes the label when input is already a SqlLabeledExpression', () => {
      const originalLabel = 'originalLabel';
      const newLabel = 'newLabel';
      const expression = SqlLiteral.create(123);

      const original = SqlLabeledExpression.create(originalLabel, expression);
      const modified = SqlLabeledExpression.create(newLabel, original);

      expect(modified).toBeInstanceOf(SqlLabeledExpression);
      expect(modified.getLabelName()).toBe(newLabel);
      expect(modified.getUnderlyingExpression()).toBe(expression);
      expect(modified.toString()).toEqual(`"newLabel" => 123`);
      expect(modified).not.toBe(original);
    });

    it('preserves the expression when changing label of existing SqlLabeledExpression', () => {
      const originalLabel = 'originalLabel';
      const newLabel = 'newLabel';
      const column = SqlColumn.create('x');

      const original = SqlLabeledExpression.create(originalLabel, column);
      const modified = SqlLabeledExpression.create(newLabel, original);

      expect(modified.getUnderlyingExpression()).toBe(column);
    });
  });

  describe('parses', () => {
    it('works in no alias case', () => {
      const sql = sane`
        Foo(
          "a" => "lol",
          b => hello + 1
        )
      `;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlFunction {
          "args": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": "
          ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlLabeledExpression {
                "expression": SqlColumn {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "lol",
                    "quotes": true,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
                "keywords": Object {},
                "label": RefName {
                  "name": "a",
                  "quotes": true,
                },
                "parens": undefined,
                "spacing": Object {
                  "postArrow": " ",
                  "preArrow": " ",
                },
                "type": "labeledExpression",
              },
              SqlLabeledExpression {
                "expression": SqlMulti {
                  "args": SeparatedArray {
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "+",
                      },
                    ],
                    "values": Array [
                      SqlColumn {
                        "keywords": Object {},
                        "parens": undefined,
                        "refName": RefName {
                          "name": "hello",
                          "quotes": false,
                        },
                        "spacing": Object {},
                        "table": undefined,
                        "type": "column",
                      },
                      SqlLiteral {
                        "keywords": Object {},
                        "parens": undefined,
                        "spacing": Object {},
                        "stringValue": "1",
                        "type": "literal",
                        "value": 1,
                      },
                    ],
                  },
                  "keywords": Object {},
                  "op": "+",
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "multi",
                },
                "keywords": Object {},
                "label": RefName {
                  "name": "b",
                  "quotes": false,
                },
                "parens": undefined,
                "spacing": Object {
                  "postArrow": " ",
                  "preArrow": " ",
                },
                "type": "labeledExpression",
              },
            ],
          },
          "decorator": undefined,
          "extendClause": undefined,
          "functionName": RefName {
            "name": "Foo",
            "quotes": false,
          },
          "keywords": Object {},
          "namespace": undefined,
          "parens": undefined,
          "spacing": Object {
            "postArguments": "
        ",
            "postLeftParen": "
          ",
            "preLeftParen": "",
          },
          "specialParen": undefined,
          "type": "function",
          "whereClause": undefined,
          "windowSpec": undefined,
        }
      `);
    });
  });

  describe('#changeLabel', () => {
    it('returns a new instance with updated label', () => {
      const original = SqlLabeledExpression.create('originalLabel', SqlLiteral.create(123));

      const result = original.changeLabel('newLabel');

      expect(result).toBeInstanceOf(SqlLabeledExpression);
      expect(result.getLabelName()).toBe('newLabel');
      expect(result.getUnderlyingExpression()).toBe(original.getUnderlyingExpression());
      expect(result).not.toBe(original);
    });
  });

  describe('#changeExpression', () => {
    it('returns a new instance with updated expression', () => {
      const label = 'myLabel';
      const originalExpression = SqlLiteral.create(123);
      const newExpression = SqlLiteral.create(456);

      const original = SqlLabeledExpression.create(label, originalExpression);
      const result = original.changeExpression(newExpression);

      expect(result).toBeInstanceOf(SqlLabeledExpression);
      expect(result.getLabelName()).toBe(label);
      expect(result.getUnderlyingExpression()).toBe(newExpression);
      expect(result).not.toBe(original);
    });
  });

  describe('#changeUnderlyingExpression', () => {
    it('delegates to changeExpression', () => {
      const label = 'myLabel';
      const originalExpression = SqlLiteral.create(123);
      const newExpression = SqlLiteral.create(456);

      const original = SqlLabeledExpression.create(label, originalExpression);
      const result = original.changeUnderlyingExpression(newExpression) as SqlLabeledExpression;

      expect(result).toBeInstanceOf(SqlLabeledExpression);
      expect(result.getLabelName()).toBe(label);
      expect(result.getUnderlyingExpression()).toBe(newExpression);
      expect(result).not.toBe(original);
    });
  });
});
