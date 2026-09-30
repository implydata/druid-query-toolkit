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

import { SqlExpression, SqlKeyValue, SqlLiteral } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlKeyValue', () => {
  describe('parses', () => {
    it('works inside JSON_OBJECT', () => {
      backAndForth("JSON_OBJECT(KEY 'x' VALUE 'y')", SqlExpression);
      backAndForth("JSON_OBJECT(KEY 'x' VALUE 'y', KEY 'z' VALUE 'w')", SqlExpression);
      backAndForth("JSON_OBJECT('x': 'y')", SqlExpression);
      backAndForth("JSON_OBJECT('x': 'y', 'z': 'w')", SqlExpression);
      backAndForth("JSON_OBJECT(KEY 'x' VALUE 'y', 'z': 'w')", SqlExpression);
    });
  });

  describe('.create', () => {
    it('creates a key-value pair with longhand syntax', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      expect(keyValue.toString()).toEqual("KEY 'x' VALUE 'y'");
    });
  });

  describe('.short', () => {
    it('creates a key-value pair with shorthand syntax', () => {
      const keyValue = SqlKeyValue.short(SqlLiteral.create('x'), SqlLiteral.create('y'));

      expect(keyValue.toString()).toEqual("'x':'y'");
    });
  });

  describe('#changeKey', () => {
    it('changes the key', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      const changed = keyValue.changeKey(SqlLiteral.create('z'));
      expect(changed.toString()).toEqual("KEY 'z' VALUE 'y'");
    });
  });

  describe('#changeValue', () => {
    it('changes the value', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      const changed = keyValue.changeValue(SqlLiteral.create('w'));
      expect(changed.toString()).toEqual("KEY 'x' VALUE 'w'");
    });
  });

  describe('#changeShort', () => {
    it('changes the shorthand flag', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      const changed = keyValue.changeShort(true);
      expect(changed.toString()).toEqual("'x':'y'");
    });
  });
});
