# druid-query-toolkit

## 1.1.2

### Patch Changes

- 77ba601: Fixing arguments of SqlFunction.timeShift

## 1.1.1

### Patch Changes

- 76d8d4d: Propogate context in case of an alias also

## 1.1.0

### Minor Changes

- 30dec4b: Allow parsing SET statements in an otherwise unparsable string and more integrations"

## 1.0.4

### Patch Changes

- 6e40a00: Added support for SET syntax"

## 1.0.3

### Patch Changes

- 6d71e89: Add `changeDecorator` method to SqlQuery

## 1.0.2

### Patch Changes

- e68c6a9: Do not unwrap AND in parens when not flattening

## 1.0.1

### Patch Changes

- 740a5f6: More filter patterns supported

## 1.0.0

### Major Changes

- 6704028: Promote to version 1.0.0

  Changes since 0.19.1:

  - Time relative pattern filter now accepts an origin and correctly handles timezones
  - Added docs and cleaned up names
  - Fixed handling of null values in values filter patterns
  - Added licenses
  - Added author to pachage.json
  - Added aggregator to segment metadata decoding
  - Fix package.json main/module/types fields
  - Make @druid-toolkit/query CJS only again
  - Improve indentation in formatting
  - Fix default spaces around EXTEND
  - Added support for IS NOT DISTINCT FROM
  - Mark spacing and keywords as readonly
  - Allow join clause to accept join conditions with either USING or ON syntax
  - Add support for array types
  - Added isArray and parsing
  - Fix type-o in the word double
  - Expanded addSelect
  - Better group by column detection
  - Switch to peggy+ts-pegjs to generate parser
  - fix location of UNION ALL in query stringification
  - Added `alwaysUseCurrentTimestamp` to WhereTimeClauseEditor and `inlineMaxDataTime` to SqlQuery
  - Don't try to convert nulls into dates
  - Rolled back prettier
  - better parsing of groupby clause
  - Allow anchor timestamp as part of a relative pattern
  - allow anchorTimestamp in filter pattern
  - Added startBound and endBound to time-relative filter patterns
  - Make it so that ROW does not show up in IN
  - support for flipped time ranges
  - Allow parsing of INSERT INTO EXTERN
  - Allow addWhere and addHaving to be called empty
  - Fixed issue with get by lobel
  - Parsing for JSON_VALUE(... RETURNING ...)
  - Parse PARTITION BY in window functions
  - Added setAlias route method
  - Better error message for truncated results
  - Make addWhere not change WHERE to TRUE
  - Add support for NATURAL keyword
  - Parse RANGE/ROWS in window functions
  - COUNT(\*) could have a window also
  - Added defaultQueryContext
  - Fix first table finder
  - Handle Infinity in changeLimitValue
