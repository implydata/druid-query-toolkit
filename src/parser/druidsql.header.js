{
  function makeListMap(tail, index, head) {
    if(head === undefined){
      head = [];
    } else {
      head = [head];
    }
    return head.concat(tail.map(function(t) { return t[index] }));
  }

  function makeSeparatorsList(tail) {
    return (tail.map(t =>  { return {
      left: t[0],
      right: t[2],
      separator: t[1],
    } ;}));
  }

  functions = functions || ["COUNT", "FILTER",
    "SUM","MIN", "MAX","AVG","APPROX_COUNT_DISTINCT",
    "APPROX_COUNT_DISTINCT_DS_HLL", "APPROX_COUNT_DISTINCT_DS_THETA",
    "APPROX_QUANTILE", "APPROX_QUANTILE_DS", "APPROX_QUANTILE_FIXED_BUCKETS"];
}