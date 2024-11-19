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

module.exports = {
  extends: ["@awesome-code-style", "plugin:react/jsx-runtime"],
  plugins: ["header", "unused-imports", "react", "react-hooks"],
  parserOptions: {
    project: "tsconfig.json",
  },
  ignorePatterns: [
    "**/generated/**/*.ts",
    "packages/query/src/sql/parser/**/*.{js,ts}",
  ],
  rules: {
    "no-loss-of-precision": "off", // Covered by @typescript-eslint rule
    "@typescript-eslint/array-type": ["warn"],
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          arguments: false,
          attributes: false,
          properties: false,
        },
      },
    ],
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@stitches/react",
            message: "Import from @implydata/canopus-styles instead.",
            allowTypeImports: false,
          },
        ],
      },
    ],
    "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
    "header/header": [
      2,
      "block",
      [
        "",
        ' * Licensed under the Apache License, Version 2.0 (the "License");',
        " * you may not use this file except in compliance with the License.",
        " * You may obtain a copy of the License at",
        " *",
        " *     http://www.apache.org/licenses/LICENSE-2.0",
        " *",
        " * Unless required by applicable law or agreed to in writing, software",
        ' * distributed under the License is distributed on an "AS IS" BASIS,',
        " * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
        " * See the License for the specific language governing permissions and",
        " * limitations under the License.",
        " ",
      ],
      1, // Number of required newlines after the header
    ],
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
  },
  overrides: [
    {
      files: ["*.js"],
      env: { node: true, es6: true },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      files: ["**/*.spec.ts*"],
      rules: {
        "@typescript-eslint/ban-types": [
          "error",
          {
            extendDefaults: true,
            types: {
              "{}": false,
            },
          },
        ],
        "@typescript-eslint/non-nullable-type-assertion-style": "off",
        "react/display-name": "off",
      },
    },
  ],
};
