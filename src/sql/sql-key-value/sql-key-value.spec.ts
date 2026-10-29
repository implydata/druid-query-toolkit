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

import { SqlColonAccess, SqlColumn, SqlExpression, SqlKeyValue, SqlLiteral } from '../..';
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

    it('adds parens to a key that would not parse back', () => {
      const access = SqlColonAccess.create(SqlColumn.optionalQuotes('v'), ['a']);

      expect(SqlKeyValue.short(access, 1).toString()).toEqual('(v:a):1');
      expect(SqlKeyValue.short(SqlExpression.parse('a + b'), 1).toString()).toEqual('(a + b):1');
      expect(SqlKeyValue.short(SqlExpression.parse("'a' || v:b"), 1).toString()).toEqual(
        "('a' || v:b):1",
      );
      expect(SqlKeyValue.short(SqlExpression.parse("'a' || b"), 1).toString()).toEqual(
        "'a' || b:1",
      );
    });
  });

  describe('.ensureShortKey', () => {
    it('keeps a key that parses back as a short key', () => {
      const key = SqlExpression.parse("'a' || F(b) || (v:c)");
      expect(SqlKeyValue.ensureShortKey(key)).toBe(key);

      const castKey = SqlExpression.parse("'a' || b::VARCHAR || (v:c)::VARCHAR");
      expect(SqlKeyValue.ensureShortKey(castKey)).toBe(castKey);
    });

    it('adds parens to any other key', () => {
      expect(SqlKeyValue.ensureShortKey(SqlExpression.parse('v:a')).toString()).toEqual('(v:a)');
      expect(SqlKeyValue.ensureShortKey(SqlExpression.parse('v:a::VARCHAR')).toString()).toEqual(
        '(v:a::VARCHAR)',
      );
      expect(SqlKeyValue.ensureShortKey(SqlExpression.parse('a = b')).toString()).toEqual(
        '(a = b)',
      );
    });
  });

  describe('#changeKey', () => {
    it('changes the key', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      const changed = keyValue.changeKey(SqlLiteral.create('z'));
      expect(changed.toString()).toEqual("KEY 'z' VALUE 'y'");
    });

    it('adds parens to a short key that would not parse back', () => {
      const keyValue = SqlKeyValue.short(SqlLiteral.create('x'), SqlLiteral.create('y'));

      expect(keyValue.changeKey(SqlExpression.parse('v:a')).toString()).toEqual("(v:a):'y'");
      expect(keyValue.changeShort(false).changeKey(SqlExpression.parse('v:a')).toString()).toEqual(
        "KEY v:a VALUE 'y'",
      );
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

    it('returns the same instance when the flag does not change', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      expect(keyValue.changeShort(false)).toBe(keyValue);
      expect(keyValue.changeShort(true).changeShort(true).toString()).toEqual("'x':'y'");
    });

    it('adds parens to a key that would not parse back in short form', () => {
      const keyValue = SqlKeyValue.create(SqlExpression.parse('v:a'), SqlLiteral.create('y'));

      expect(keyValue.changeShort(true).toString()).toEqual("(v:a):'y'");
    });

    it('switches back to longhand and resets the spacing', () => {
      const keyValue = SqlKeyValue.short(
        SqlLiteral.create('x'),
        SqlLiteral.create('y'),
      ).changeSpaces({ postKeyExpression: ' ', preValueExpression: '  ' });
      expect(keyValue.toString()).toEqual("'x' :  'y'");

      const changed = keyValue.changeShort(false);
      expect(changed.short).toBeUndefined();
      expect(changed.toString()).toEqual("KEY 'x' VALUE 'y'");
    });
  });

  describe('#walk', () => {
    it('substitutes the key and the value', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      expect(
        keyValue
          .walk(ex =>
            ex instanceof SqlLiteral ? SqlLiteral.create(String(ex.value).toUpperCase()) : ex,
          )
          .toString(),
      ).toEqual("KEY 'X' VALUE 'Y'");
    });

    it('keeps the same instance when nothing changes', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      expect(keyValue.walk(ex => ex)).toBe(keyValue);
    });

    it('stops the walk when the callback returns nothing for the key or the value', () => {
      const keyValue = SqlKeyValue.create(SqlLiteral.create('x'), SqlLiteral.create('y'));

      const seen: string[] = [];
      keyValue.walk(ex => {
        seen.push(ex.toString());
        return ex instanceof SqlLiteral && ex.value === 'x' ? undefined : ex;
      });
      expect(seen).toEqual(["KEY 'x' VALUE 'y'", "'x'"]);

      seen.length = 0;
      keyValue.walk(ex => {
        seen.push(ex.toString());
        return ex instanceof SqlLiteral && ex.value === 'y' ? undefined : ex;
      });
      expect(seen).toEqual(["KEY 'x' VALUE 'y'", "'x'", "'y'"]);
    });
  });
});
