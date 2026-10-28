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

import { SeparatedArray } from '../helpers';
import type { SqlAlias } from '../sql-alias/sql-alias';
import type { SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlRenamePipeOperatorValue extends SqlPipeOperatorValue {
  renames: SeparatedArray<SqlAlias>;
}

/**
 * The \`|> RENAME a AS b\` pipe operator, which renames columns of the input and keeps the rest
 * as they are. Each rename is a SqlAlias of a SqlColumn (the AS is optional).
 */
export class SqlRenamePipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'renamePipeOperator';

  static DEFAULT_RENAME_KEYWORD = 'RENAME';

  static create(renames: SeparatedArray<SqlAlias> | SqlAlias[]): SqlRenamePipeOperator {
    return new SqlRenamePipeOperator({
      renames: SeparatedArray.fromArray(renames),
    });
  }

  public readonly renames: SeparatedArray<SqlAlias>;

  constructor(options: SqlRenamePipeOperatorValue) {
    super(options, SqlRenamePipeOperator.type);
    this.renames = options.renames;
  }

  public valueOf(): SqlRenamePipeOperatorValue {
    const value = super.valueOf() as SqlRenamePipeOperatorValue;
    value.renames = this.renames;
    return value;
  }

  protected _toRawOperatorString(): string {
    return [
      this.getKeyword('rename', SqlRenamePipeOperator.DEFAULT_RENAME_KEYWORD),
      this.getSpace('postRename'),
      this.renames.toString(),
    ].join('');
  }

  public changeRenames(renames: SeparatedArray<SqlAlias> | SqlAlias[]): this {
    const value = this.valueOf();
    value.renames = SeparatedArray.fromArray(renames);
    return SqlBase.fromValue(value);
  }

  /**
   * The new name of each renamed column, by its old name
   */
  public getNewNames(): Record<string, string> {
    const newNames: Record<string, string> = {};
    for (const rename of this.renames.values) {
      const name = rename.expression.getOutputName();
      if (name) newNames[name] = rename.alias.name;
    }
    return newNames;
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlPipeOperator | undefined {
    let ret = this;

    const renames = SqlBase.walkSeparatedArray(this.renames, nextStack, fn, postorder);
    if (!renames) return;
    if (renames !== this.renames) {
      ret = ret.changeRenames(renames);
    }

    return ret;
  }

  public clearOwnSeparators(): this {
    const value = this.valueOf();
    value.renames = this.renames.clearSeparators();
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(SqlRenamePipeOperator);
