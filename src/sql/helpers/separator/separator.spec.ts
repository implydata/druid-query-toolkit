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

import { NEWLINE_INDENT, SPACE } from '../general/general';

import { Separator } from './separator';

describe('Separator', () => {
  describe('constructor', () => {
    it('creates a separator with provided options', () => {
      const separator = new Separator({ left: 'left', separator: 'SEP', right: 'right' });
      expect(separator.left).toBe('left');
      expect(separator.separator).toBe('SEP');
      expect(separator.right).toBe('right');
    });

    it('defaults to empty strings for left and right if not provided', () => {
      const separator = new Separator({ separator: 'SEP' });
      expect(separator.left).toBe('');
      expect(separator.separator).toBe('SEP');
      expect(separator.right).toBe('');
    });
  });

  describe('toString', () => {
    it('joins left, separator, and right values', () => {
      const separator = new Separator({ left: 'left', separator: 'SEP', right: 'right' });
      expect(separator.toString()).toBe('leftSEPright');
    });

    it('handles empty left and right values', () => {
      const separator = new Separator({ separator: 'SEP' });
      expect(separator.toString()).toBe('SEP');
    });
  });

  describe('static methods', () => {
    describe('symmetricSpace', () => {
      it('creates a separator with spaces on both sides', () => {
        const separator = Separator.symmetricSpace('AND');
        expect(separator.left).toBe(SPACE);
        expect(separator.separator).toBe('AND');
        expect(separator.right).toBe(SPACE);
        expect(separator.toString()).toBe(' AND ');
      });
    });

    describe('rightSpace', () => {
      it('creates a separator with space only on the right', () => {
        const separator = Separator.rightSpace('AND');
        expect(separator.left).toBe('');
        expect(separator.separator).toBe('AND');
        expect(separator.right).toBe(SPACE);
        expect(separator.toString()).toBe('AND ');
      });
    });

    describe('indentSpace', () => {
      it('creates a separator with space on left and newline+indent on right', () => {
        const separator = Separator.indentSpace('AND');
        expect(separator.left).toBe(SPACE);
        expect(separator.separator).toBe('AND');
        expect(separator.right).toBe(NEWLINE_INDENT);
        expect(separator.toString()).toBe(' AND\n  ');
      });
    });

    describe('newlineFirst', () => {
      it('creates a separator with newline+indent on left and space on right', () => {
        const separator = Separator.newlineFirst('AND');
        expect(separator.left).toBe(NEWLINE_INDENT);
        expect(separator.separator).toBe('AND');
        expect(separator.right).toBe(SPACE);
        expect(separator.toString()).toBe('\n  AND ');
      });
    });
  });

  describe('static properties', () => {
    it('COMMA is a comma with right space', () => {
      expect(Separator.COMMA.toString()).toBe(', ');
    });

    it('COMMA_NEWLINE is a comma with newline on right', () => {
      expect(Separator.COMMA_NEWLINE.toString()).toBe(',\n');
    });
  });
});
