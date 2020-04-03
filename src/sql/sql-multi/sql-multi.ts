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

import { Separator, SqlRef, SqlUnary } from '../index';
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlMultiValue extends SqlBaseValue {
  expressionType?: string;
  separators?: Separator[];
  arguments?: SqlBase[];
}

export class SqlMulti extends SqlBase {
  static type = 'multi';

  static sqlMultiFactory(separator: string, argumentsArray: SqlBase[]) {
    return new SqlMulti({
      arguments: argumentsArray,
      separators: Separator.fillBetween([], arguments.length, Separator.bothSeparator(separator)),
      expressionType: separator,
      type: SqlMulti.type,
    } as SqlMultiValue);
  }

  public expressionType?: string;
  public separators?: Separator[];
  public arguments: SqlBase[];

  constructor(options: SqlMultiValue) {
    super(options, SqlMulti.type);
    this.arguments = options.arguments || [];
    this.separators = options.separators;
    this.expressionType = options.expressionType;
  }

  public valueOf() {
    const value: SqlMultiValue = super.valueOf();
    value.expressionType = this.expressionType;
    value.separators = this.separators;
    value.arguments = this.arguments;
    return value;
  }

  public toRawString(): string {
    if (!this.separators || !this.arguments) {
      throw new Error('Invalid options');
    }
    return Separator.spacilator(this.arguments, this.separators);
  }

  public isType(type: string) {
    return type === this.expressionType;
  }

  public containsColumn(column: string): boolean {
    const value = this.valueOf();
    if (!value.arguments) throw Error('expression has no arguments');
    return !!value.arguments.filter(
      arg =>
        SqlRef.equalsString(arg, column) || (arg instanceof SqlMulti && arg.containsColumn(column)),
    ).length;
  }

  public removeColumn(column: string) {
    const value = this.valueOf();
    if (!value.arguments) throw Error('expression has no arguments');

    const filteredList = Separator.filterStringFromList(column, value.arguments, value.separators);
    value.separators = filteredList ? filteredList.separators : undefined;
    value.arguments = filteredList ? filteredList.values : undefined;

    return value.arguments && value.arguments.length ? new SqlMulti(value) : undefined;
  }

  public getSqlRefs(): SqlRef[] {
    return this.arguments.flatMap(argument => {
      if (argument instanceof SqlRef) return [argument];
      if (argument instanceof SqlMulti || argument instanceof SqlUnary) {
        return argument.getSqlRefs();
      }
      return [];
    });
    return [];
  }

  addOrReplaceColumn(column: string | SqlRef, filter: SqlMulti | SqlUnary): SqlMulti | SqlUnary {
    const value = this.valueOf();
    const currentFilter = new SqlMulti(value);
    if (!value.arguments) return currentFilter;

    switch (value.expressionType) {
      case 'AND':
        value.arguments = value.arguments.map(argument => {
          if (
            (argument instanceof SqlMulti || argument instanceof SqlMulti) &&
            argument.containsColumn(column instanceof SqlRef ? column.getName() : column)
          ) {
            return filter;
          } else {
            return argument;
          }
        });
        value.arguments.concat([filter]);
        value.separators = Separator.fillBetween(
          value.separators || [],
          value.arguments.length,
          Separator.bothSeparator('AND'),
        );
        return new SqlMulti(value);

      case 'OR':
        value.arguments = value.arguments.map(argument => {
          if (argument instanceof SqlMulti || argument instanceof SqlMulti) {
            return argument.addOrReplaceColumn(column, filter);
          } else {
            return argument;
          }
        });
        return SqlMulti.sqlMultiFactory('AND', [currentFilter.addParens('', ''), filter]);

      default:
        if (currentFilter.containsColumn(column instanceof SqlRef ? column.getName() : column)) {
          return filter;
        }
        return SqlMulti.sqlMultiFactory('AND', [currentFilter, filter]);
    }
  }
}

SqlBase.register(SqlMulti.type, SqlMulti);
