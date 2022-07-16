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

export interface SeparatorValue {
  left?: string;
  right?: string;
  separator: string;
}

export class Separator {
  public left?: string;
  public right?: string;
  public separator: string;

  static COMMA: Separator;
  static COMMA_NEW_LINE: Separator;

  static symmetricSpace(separator: string) {
    return new Separator({ left: ' ', separator: separator, right: ' ' });
  }

  static rightSpace(separator: string) {
    return new Separator({ separator: separator, right: ' ' });
  }

  constructor(options: SeparatorValue) {
    this.left = options.left || '';
    this.right = options.right || '';
    this.separator = options.separator;
  }

  public toString(): string {
    return [this.left, this.separator, this.right].join('');
  }
}

Separator.COMMA = Separator.rightSpace(',');
Separator.COMMA_NEW_LINE = new Separator({ separator: ',', right: '\n' });
