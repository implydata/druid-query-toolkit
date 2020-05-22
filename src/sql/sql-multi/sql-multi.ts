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
  expressionType: string;
  arguments: SqlBase[];
  separators?: Separator[];
}

export class SqlMulti extends SqlBase {
  static type = 'multi';

  static sqlMultiFactory(separator: string, argumentsArray: SqlBase[]) {
    return new SqlMulti({
      type: SqlMulti.type,
      expressionType: separator,
      arguments: argumentsArray,
      separators: Separator.fillBetween([], arguments.length, Separator.bothSeparator(separator)),
    } as SqlMultiValue);
  }

  public readonly expressionType: string;
  public readonly arguments: SqlBase[];
  public readonly separators?: Separator[];

  constructor(options: SqlMultiValue) {
    super(options, SqlMulti.type);

    this.expressionType = options.expressionType;
    if (!this.expressionType) throw new Error(`must have expressionType`);

    this.arguments = options.arguments;
    if (!this.arguments) throw new Error(`must have arguments`);

    this.separators = options.separators;
  }

  public valueOf(): SqlMultiValue {
    const value = super.valueOf() as SqlMultiValue;
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
    return value.arguments.some(
      arg =>
        SqlRef.equalsString(arg, column) || (arg instanceof SqlMulti && arg.containsColumn(column)),
    );
  }

  public removeColumn(column: string): SqlMulti | undefined {
    const filteredList = Separator.filterStringFromList(column, this.arguments, this.separators);
    if (!filteredList) return;

    const value = this.valueOf();
    value.separators = filteredList.separators;
    value.arguments = filteredList.values;

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
  }

  addOrReplaceColumn(column: string | SqlRef, filter: SqlMulti | SqlUnary): SqlMulti | SqlUnary {
    const value = this.valueOf();
    if (!value.arguments) return this;
    const columnString = typeof column === 'string' ? column : column.column;
    switch (value.expressionType) {
      case 'AND':
        value.arguments = value.arguments.map(argument => {
          if (
            columnString &&
            (argument instanceof SqlMulti || argument instanceof SqlMulti) &&
            argument.containsColumn(columnString)
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
        return SqlMulti.sqlMultiFactory('AND', [this.addParens('', ''), filter]);

      default:
        if (columnString && this.containsColumn(columnString)) {
          return filter;
        }
        return SqlMulti.sqlMultiFactory('AND', [this, filter]);
    }
  }
}

SqlBase.register(SqlMulti.type, SqlMulti);
