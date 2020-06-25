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

  static symmetricSpace(separator: string) {
    return new Separator({ left: ' ', separator: separator, right: ' ' });
  }

  static rightSpace(separator: string) {
    return new Separator({ separator: separator, right: ' ' });
  }

  // return a list of separators with n-1 elements in them, filed with fillWith
  static fillBetween(existingSeparator: Separator[], listLength: number, fillWith: Separator) {
    for (let i = existingSeparator.length; i < listLength - 1; i++) {
      existingSeparator = existingSeparator.concat(fillWith);
    }
    return existingSeparator;
  }

  static filterStringFromInterfaceList<T>(
    units: T[],
    filter: (value: T) => boolean,
    separators?: Separator[],
  ) {
    let index = -1;
    const filteredUnits: T[] = [];
    for (let i = 0; i < units.length; i++) {
      const value = units[i];
      if (filter(value)) {
        index = i;
      } else {
        filteredUnits.push(value);
      }
    }

    // If removing the 1st column remove the 1st separator
    // i !== 0 && index === 0
    // otherwise remove the separator before it
    // index !== 0 && i !== index - 1
    const filteredSeparators = separators
      ? separators.filter(
          (_separator, i) => (index !== 0 && i !== index - 1) || (i !== 0 && index === 0),
        )
      : undefined;

    return {
      units: filteredUnits.length ? filteredUnits : undefined,
      separators: filteredSeparators,
    };
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
