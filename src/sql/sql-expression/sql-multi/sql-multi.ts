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

import { SqlUnary } from '..';
import { SqlBase, SqlBaseValue } from '../../sql-base';
import { SeparatedArray, Separator } from '../../utils';
import { SqlExpression } from '../sql-expression';

export interface SqlMultiValue extends SqlBaseValue {
  expressionType: string;
  arguments: SeparatedArray<SqlExpression>;
}

export class SqlMulti extends SqlExpression {
  static type = 'multi';

  static sqlMultiFactory(separator: string, argumentsArray: SqlExpression[]) {
    return new SqlMulti({
      expressionType: separator,
      arguments: SeparatedArray.fromArray(argumentsArray, Separator.bothSeparator(separator)),
    });
  }

  public readonly expressionType: string;
  public readonly arguments: SeparatedArray<SqlExpression>;

  constructor(options: SqlMultiValue) {
    super(options, SqlMulti.type);

    this.expressionType = options.expressionType;
    if (!this.expressionType) throw new Error(`must have expressionType`);

    this.arguments = options.arguments;
    if (!this.arguments) throw new Error(`must have arguments`);
  }

  public valueOf(): SqlMultiValue {
    const value = super.valueOf() as SqlMultiValue;
    value.expressionType = this.expressionType;
    value.arguments = this.arguments;
    return value;
  }

  public toRawString(): string {
    return this.arguments.toString();
  }

  public walkInner(
    nextStack: SqlBase[],
    fn: (t: SqlBase, stack: SqlBase[]) => void,
    postorder: boolean,
  ): void {
    SqlBase.walkSeparatedArray(this.arguments, nextStack, fn, postorder);
  }

  public isType(type: string) {
    return type === this.expressionType;
  }

  public removeColumnFromAnd(column: string): SqlExpression | undefined {
    if (this.expressionType !== 'AND') {
      return super.removeColumnFromAnd(column);
    }

    const newArguments = this.arguments.filter(a => !a.containsColumn(column));
    if (!newArguments) return;

    if (newArguments.length() === 1) {
      return newArguments.first();
    }

    const value = this.valueOf();
    value.arguments = newArguments;
    return new SqlMulti(value);
  }

  public addOrReplaceColumn(column: string, filter: SqlMulti | SqlUnary): SqlMulti | SqlUnary {
    const value = this.valueOf();
    if (!value.arguments) return this;
    switch (value.expressionType) {
      case 'AND':
        // value.arguments = value.arguments.map(argument => {
        //   if (
        //     column &&
        //     (argument instanceof SqlMulti || argument instanceof SqlMulti) &&
        //     argument.containsColumn(column)
        //   ) {
        //     return filter;
        //   } else {
        //     return argument;
        //   }
        // });
        // value.arguments.concat([filter]);
        // value.separators = Separator.fillBetween(
        //   value.separators || [],
        //   value.arguments.length,
        //   Separator.bothSeparator('AND'),
        // );
        return new SqlMulti(value);

      case 'OR':
        // value.arguments = value.arguments.map(argument => {
        //   if (argument instanceof SqlMulti || argument instanceof SqlMulti) {
        //     return argument.addOrReplaceColumn(column, filter);
        //   } else {
        //     return argument;
        //   }
        // });
        return SqlMulti.sqlMultiFactory('AND', [this.addParens('', ''), filter]);

      default:
        if (column && this.containsColumn(column)) {
          return filter;
        }
        return SqlMulti.sqlMultiFactory('AND', [this, filter]);
    }
  }
}

SqlBase.register(SqlMulti.type, SqlMulti);
