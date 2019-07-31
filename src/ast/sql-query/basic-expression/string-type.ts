/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export interface StringValue {
  chars: string;
  quote: string;
  spacing: string[];
}

export class StringType {
  public chars: string;
  public quote: string;
  public spacing: string[];

  constructor(options: StringValue) {
    this.chars = options.chars;
    this.quote = options.quote;
    this.spacing = options.spacing;
  }

  toString(): string {
    return (
      this.quote +
      (this.spacing[0] ? this.spacing[0] : '') +
      this.chars +
      (this.spacing[0] ? this.spacing[1] : '') +
      this.quote
    );
  }

  getBasicValue(): string {
    return this.chars;
  }
}
