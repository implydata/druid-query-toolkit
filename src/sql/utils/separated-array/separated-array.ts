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

import { Separator } from '..';

export type SeparatorOrString = Separator | string;

export class SeparatedArray<T> {
  static fromArray<T>(xs: T[] | SeparatedArray<T>, sep: SeparatorOrString): SeparatedArray<T> {
    if (xs instanceof SeparatedArray) return xs;
    const separators: SeparatorOrString[] = [];
    for (let i = 1; i < xs.length; i++) {
      separators.push(sep);
    }
    return new SeparatedArray<T>(xs, separators);
  }

  static fromSingleValue<T>(x: T): SeparatedArray<T> {
    return new SeparatedArray<T>([x], []);
  }

  public readonly values: T[];
  public readonly separators: SeparatorOrString[];

  constructor(values: T[], separators: SeparatorOrString[]) {
    if (values.length - separators.length !== 1) {
      throw new Error(
        `invalid values (${values.length}) or separator length (${separators.length})`,
      );
    }

    this.values = values;
    this.separators = separators;
  }

  public toString(): string {
    const { values, separators } = this;
    const rawParts = separators.map((separator, i) => String(values[i]) + String(separator));
    rawParts.push(String(values[values.length - 1]));
    return rawParts.join('');
  }

  public length(): number {
    return this.values.length;
  }

  public get(i: number): T {
    return this.values[i];
  }

  public first(): T {
    return this.values[0];
  }

  public map<U>(callbackfn: (value: T, index: number) => U): SeparatedArray<U> {
    return new SeparatedArray<U>(this.values.map(callbackfn), this.separators);
  }

  public filter(fn: (value: T, index: number) => any): SeparatedArray<T> | undefined {
    const { values, separators } = this;
    const filteredValues: T[] = [];
    const filteredSeparators: SeparatorOrString[] = [];
    for (let i = 0; i < filteredValues.length; i++) {
      const value = values[i];
      if (fn(value, i)) {
        filteredValues.push(value);
        if (i > 0) filteredSeparators.push(separators[i - 1]);
      }
    }
    if (!filteredValues.length) return;
    return new SeparatedArray<T>(filteredValues, filteredSeparators);
  }

  public filterMap<U>(
    callbackfn: (value: T, index: number) => U | undefined,
  ): SeparatedArray<U> | undefined {
    // Technically the intermediate array here will not be valid because it might have an `undefined` in it which is not walkable
    return this.map(callbackfn as any).filter(Boolean) as SeparatedArray<U> | undefined;
  }

  public deleteByIndex(index: number): SeparatedArray<T> | undefined {
    return this.filter((_x, i) => i === index);
  }

  public addFirst(value: T, defaultSeparator: SeparatorOrString): SeparatedArray<T> {
    const { values, separators } = this;
    const separator = separators[0] || defaultSeparator;
    return new SeparatedArray<T>([value].concat(values), [separator].concat(separators));
  }

  public addLast(value: T, defaultSeparator: SeparatorOrString): SeparatedArray<T> {
    const { values, separators } = this;
    const separator = separators[separators.length - 1] || defaultSeparator;
    return new SeparatedArray<T>(values.concat([value]), separators.concat(separator));
  }
}
