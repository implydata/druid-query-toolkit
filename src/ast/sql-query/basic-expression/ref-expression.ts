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
import { StringType } from '../../index';

export interface RefExpressionValue {
  quote: string;
  quoteSpacing: string[];
  namespace: string | StringType;
  name: string | StringType;
}

export class RefExpression {
  public namespace: string | StringType;
  public name: string | StringType;
  public quote: string;
  public quoteSpacing: string[];

  constructor(options: RefExpressionValue) {
    this.namespace = options.namespace;
    this.name = options.name;
    this.quote = options.quote;
    this.quoteSpacing = options.quoteSpacing;
  }

  toString(): string {
    if (this.namespace) {
      return (
        (this.quote ? this.quote + this.quoteSpacing[0] : '') +
        (this.namespace instanceof StringType ? this.namespace.toString() : this.namespace) +
        '.' +
        (this.name instanceof StringType ? this.name.toString() : this.name) +
        (this.quote ? this.quote + this.quoteSpacing[1] : '')
      );
    }
    return (
      (this.quote ? this.quote + this.quoteSpacing[0] : '') +
      (this.name instanceof StringType ? this.name.toString() : this.name) +
      (this.quote ? this.quote + this.quoteSpacing[1] : '')
    );
  }

  getBasicValue(): string {
    return (
      (this.namespace
        ? (this.namespace instanceof StringType ? this.namespace.chars : this.quoteSpacing) + '.'
        : '') + (this.name instanceof StringType ? this.name.chars : this.name)
    );
  }

  addQuote(quote: string, spacing: string[]) {
    this.quote = quote;
    this.quoteSpacing = spacing;
  }
}
