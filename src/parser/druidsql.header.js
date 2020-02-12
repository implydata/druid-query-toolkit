{
  function makeListMap1(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t[1] }));
  }

  function makeListMapEmpty(tail) {
    return [].concat(tail.map(function(t) { return t[1] }));
  }

  function makeListMapEmpty0(tail) {
    return [].concat(tail.map(function(t) { return t[0] }));
  }

  function makeListMap3(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t[3] }));
  }

  function makeSeparatorsList(tail) {
    return (tail.map(t =>  { return {
      right: t[0],
      left: t[2],
      separator: t[1],
    } ;}));
  }

  let functions;
  functions = functions || ["COUNT", "FILTER",
    "SUM","MIN", "MAX","AVG","APPROX_COUNT_DISTINCT",
    "APPROX_COUNT_DISTINCT_DS_HLL", "APPROX_COUNT_DISTINCT_DS_THETA",
    "APPROX_QUANTILE", "APPROX_QUANTILE_DS", "APPROX_QUANTILE_FIXED_BUCKETS"];
}