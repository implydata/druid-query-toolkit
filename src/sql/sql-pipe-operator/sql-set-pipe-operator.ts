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

import { NEWLINE_INDENT, SeparatedArray, Separator, SPACE } from '../helpers';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';

import type { SqlColumnAssignment } from './sql-column-assignment';
import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlSetPipeOperatorValue extends SqlPipeOperatorValue {
  assignments: SeparatedArray<SqlColumnAssignment>;
}

/**
 * The \`|> SET\` pipe operator, which replaces the values of existing columns.
 */
export class SqlSetPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'setPipeOperator';

  static DEFAULT_SET_KEYWORD = 'SET';

  static create(
    assignments: SeparatedArray<SqlColumnAssignment> | SqlColumnAssignment[],
  ): SqlSetPipeOperator {
    return new SqlSetPipeOperator({
      assignments: SeparatedArray.fromArray(assignments),
    });
  }

  public readonly assignments: SeparatedArray<SqlColumnAssignment>;

  constructor(options: SqlSetPipeOperatorValue) {
    super(options, SqlSetPipeOperator.type);
    this.assignments = options.assignments;
  }

  public valueOf(): SqlSetPipeOperatorValue {
    const value = super.valueOf() as SqlSetPipeOperatorValue;
    value.assignments = this.assignments;
    return value;
  }

  protected _toRawOperatorString(): string {
    const indentSpace = this.assignments.length() > 1 ? NEWLINE_INDENT : SPACE;
    return [
      this.getKeyword('set', SqlSetPipeOperator.DEFAULT_SET_KEYWORD),
      this.getSpace('postSet', indentSpace),
      this.assignments.toString(new Separator({ separator: ',', right: indentSpace })),
    ].join('');
  }

  public changeAssignments(
    assignments: SeparatedArray<SqlColumnAssignment> | SqlColumnAssignment[],
  ): this {
    const value = this.valueOf();
    value.assignments = SeparatedArray.fromArray(assignments);
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    const assignments = SqlBase.walkSeparatedArray(this.assignments, nextStack, fn, postorder);
    if (!assignments) return;
    if (assignments !== this.assignments) {
      ret = ret.changeAssignments(assignments);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.assignments = this.assignments.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlSetPipeOperator);
