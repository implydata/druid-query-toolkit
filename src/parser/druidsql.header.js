{
  function makeListMap1(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t[1] }));
  }

  function makeListMap(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t }));
  }

  function makeListMap_1(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t[0][1] }));
  }

  function makeListMap_2(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t[0][2] }));
  }

  function makeListMapEmpty(tail) {
    return [].concat(tail.map(function(t) { return t[1] }));
  }

  function makeListMapEmpty0(tail) {
    return [].concat(tail.map(function(t) { return t[0] }));
  }

  function makeListMapEmpty0BookEnd(tail) {
    return [].concat(tail.map(function(t) { return [t[0][0],t[0][2]] })).flat();
  }

  function makeListMapEmpty0Joined(tail) {
    return [].concat(tail.map(function(t) { return t[0].join('') }));
  }

  function makeListMapEmptyConcat0(tail) {
    return tail.map(function(t) { return t[0].join('') });
  }

  function makeListMapEmpty01(tail) {
    return [].concat(tail.map(function(t) { return t[0][1] }));
  }

  function makeListCasesSpacing(caseValue) {
    caseValue.map(caseValue => {caseValue[1].spacing = makeListMap(caseValue[0], caseValue[1].spacing)});
    return makeListMapEmpty(caseValue);
  }

  functions = functions || ["COUNT", "FILTER",
    "SUM","MIN", "MAX","AVG","APPROX_COUNT_DISTINCT",
    "APPROX_COUNT_DISTINCT_DS_HLL", "APPROX_COUNT_DISTINCT_DS_THETA",
    "APPROX_QUANTILE", "APPROX_QUANTILE_DS", "APPROX_QUANTILE_FIXED_BUCKETS"];
}
