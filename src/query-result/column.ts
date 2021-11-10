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

export interface ColumnOptions {
  name: string;
  sqlType?: string;
  nativeType?: string;
}

export class Column {
  static fromName(name: unknown): Column {
    return new Column({ name: String(name) });
  }

  static fromColumnNames(names: readonly unknown[]): Column[] {
    return names.map(Column.fromName);
  }

  static fromColumnNamesAndSqlTypes(names: readonly unknown[], sqlTypes: string[]): Column[] {
    return names.map((name, i) => new Column({ name: String(name), sqlType: sqlTypes[i] }));
  }

  public readonly name: string;
  public readonly sqlType?: string;
  public readonly nativeType?: string;

  constructor(options: ColumnOptions) {
    this.name = options.name;
    this.sqlType = options.sqlType;
    this.nativeType = options.nativeType;
  }

  public isTimeColumn(): boolean {
    const { name, sqlType } = this;
    return name === '__time' && sqlType === 'TIMESTAMP';
  }
}
