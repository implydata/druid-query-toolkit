const parse = require('../druidsql');
const stringify = require('../druidsqltostring');
const assert = require('assert');


Object.compare = function (obj1, obj2) {
  for (const p in obj1) {
    if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

    switch (typeof (obj1[p])) {
      case 'object':
        if (!Object.compare(obj1[p], obj2[p])) return false;
        break;
      case 'function':
        if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
        break;
      default:
        if (obj1[p] != obj2[p]) return false;
    }
  }

  //Check object 2 for any extra properties
  for (const p in obj2) {
    if (typeof (obj1[p]) == 'undefined') return false;
  }
  return true;
};

describe('Expression Tests', () =>
{
  it('basic expression', () => {
    ast = parse.parse('1 + 1');
    expected = {
      "type": "expressionOnly",
      "spacing": [],
      "expression": {
        "type": "expression",
        "operator": {
          "type": "operator",
          "spacing": [
            " "
          ],
          "operator": "+"
        },
        "lhs": {
          "type": "Integer",
          "value": "1",
          "spacing": []
        },
        "rhs": {
          "type": "Integer",
          "value": "1",
          "spacing": [
            " "
          ]
        },
        "spacing": []
      },
      "endSpacing": []
    }

    assert.equal(true,Object.compare(ast, expected));
  })
  it('expression with all operators', () => {
    ast = parse.parse('1 + 1 / 1 * 1 - 1');
    expected = {
      "type": "expressionOnly",
      "spacing": [],
      "expression": {
        "type": "expression",
        "operator": {
          "type": "operator",
          "spacing": [
            " "
          ],
          "operator": "+"
        },
        "lhs": {
          "type": "Integer",
          "value": "1",
          "spacing": []
        },
        "rhs": {
          "type": "expression",
          "operator": {
            "type": "operator",
            "spacing": [
              " "
            ],
            "operator": "/"
          },
          "lhs": {
            "type": "Integer",
            "value": "1",
            "spacing": []
          },
          "rhs": {
            "type": "expression",
            "operator": {
              "type": "operator",
              "spacing": [
                " "
              ],
              "operator": "*"
            },
            "lhs": {
              "type": "Integer",
              "value": "1",
              "spacing": []
            },
            "rhs": {
              "type": "expression",
              "operator": {
                "type": "operator",
                "spacing": [
                  " "
                ],
                "operator": "-"
              },
              "lhs": {
                "type": "Integer",
                "value": "1",
                "spacing": []
              },
              "rhs": {
                "type": "Integer",
                "value": "1",
                "spacing": [
                  " "
                ]
              },
              "spacing": [
                " "
              ]
            },
            "spacing": [
              " "
            ]
          },
          "spacing": [
            " "
          ]
        },
        "spacing": []
      },
      "endSpacing": []
    }
    assert.equal(true,Object.compare(ast, expected));
  })
  it('expression with brackets', () => {
    ast = parse.parse('2 * (3 + 4)');
    expected = {
      "type": "expressionOnly",
      "spacing": [],
      "expression": {
        "type": "expression",
        "operator": {
          "type": "operator",
          "spacing": [
            " "
          ],
          "operator": "*"
        },
        "lhs": {
          "type": "Integer",
          "value": "2",
          "spacing": []
        },
        "rhs": {
          "type": "expression",
          "operator": {
            "type": "operator",
            "spacing": [
              " "
            ],
            "operator": "+"
          },
          "lhs": {
            "type": "Integer",
            "value": "3",
            "spacing": []
          },
          "rhs": {
            "type": "Integer",
            "value": "4",
            "spacing": [
              " "
            ]
          },
          "spacing": [
            " ",
            "("
          ]
        },
        "spacing": []
      },
      "endSpacing": [
        ")"
      ]
    }

    assert.equal(true,Object.compare(ast, expected));
  })
  it('expression with string values', () => {
    ast = parse.parse('\'column\' = "value"');
    expected = {
      "type": "expressionOnly",
      "spacing": [],
      "expression": {
        "type": "expression",
        "operator": {
          "type": "operator",
          "spacing": [
            " "
          ],
          "operator": "="
        },
        "lhs": {
          "type": "variable",
          "value": "column",
          "spacing": [],
          "quote": "'"
        },
        "rhs": {
          "type": "variable",
          "value": "value",
          "spacing": [
            " "
          ],
          "quote": "\""
        },
        "spacing": []
      },
      "endSpacing": []
    }

    assert.equal(true,Object.compare(ast, expected));
  })
});

describe('Druid Query Tests', () =>
{
  it('data sources query', () => {
    ast = parse.parse('SELECT\n' +
      '  datasource,\n' +
      '  COUNT(*) AS num_segments,\n' +
      '  SUM(is_available) AS num_available_segments,\n' +
      '  SUM("size") AS size,\n' +
      '  SUM("num_rows") AS num_rows\n' +
      'FROM sys.segments\n' +
      'GROUP BY 1');
    expected = {
      "type": "query",
      "queryType": "SELECT",
      "selectParts": [
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "Constant",
            "value": "datasource",
            "spacing": []
          },
          "alias": null,
          "spacing": [
            "\n",
            " ",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "Constant",
            "value": "COUNT",
            "spacing": []
          },
          "alias": null,
          "spacing": [
            ",",
            "\n",
            " ",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "star"
          },
          "alias": {
            "type": "alias",
            "value": {
              "type": "Constant",
              "value": "num_segments",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              ")",
              " "
            ],
            "syntax": "AS"
          },
          "spacing": [
            "("
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "function",
            "functionCall": "SUM",
            "arguments": [
              {
                "type": "argument",
                "distinct": null,
                "argumentValue": {
                  "type": "argumentValue",
                  "spacing": [],
                  "argument": {
                    "type": "Constant",
                    "value": "is_available",
                    "spacing": []
                  }
                }
              }
            ],
            "spacing": []
          },
          "alias": {
            "type": "alias",
            "value": {
              "type": "Constant",
              "value": "num_available_segments",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              " "
            ],
            "syntax": "AS"
          },
          "spacing": [
            ",",
            "\n",
            " ",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "function",
            "functionCall": "SUM",
            "arguments": [
              {
                "type": "argument",
                "distinct": null,
                "argumentValue": {
                  "type": "argumentValue",
                  "spacing": [],
                  "argument": {
                    "type": "variable",
                    "value": "size",
                    "spacing": [],
                    "quote": "\""
                  }
                }
              }
            ],
            "spacing": []
          },
          "alias": {
            "type": "alias",
            "value": {
              "type": "Constant",
              "value": "size",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              " "
            ],
            "syntax": "AS"
          },
          "spacing": [
            ",",
            "\n",
            " ",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "function",
            "functionCall": "SUM",
            "arguments": [
              {
                "type": "argument",
                "distinct": null,
                "argumentValue": {
                  "type": "argumentValue",
                  "spacing": [],
                  "argument": {
                    "type": "variable",
                    "value": "num_rows",
                    "spacing": [],
                    "quote": "\""
                  }
                }
              }
            ],
            "spacing": []
          },
          "alias": {
            "type": "alias",
            "value": {
              "type": "Constant",
              "value": "num_rows",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              " "
            ],
            "syntax": "AS"
          },
          "spacing": [
            ",",
            "\n",
            " ",
            " "
          ]
        }
      ],
      "from": {
        "type": "from",
        "value": {
          "type": "table",
          "schema": "sys",
          "alias": null,
          "table": "segments",
          "spacing": [
            " "
          ]
        },
        "spacing": [
          "\n"
        ],
        "syntax": "FROM"
      },
      "where": null,
      "groupby": {
        "type": "groupBy",
        "groupByParts": [
          {
            "type": "Integer",
            "value": "1",
            "spacing": [
              " "
            ]
          }
        ],
        "spacing": [
          "\n"
        ],
        "syntax": "GROUP BY"
      },
      "having": null,
      "orderBy": null,
      "limit": null,
      "unionAll": null,
      "syntax": "SELECT",
      "spacing": [],
      "endSpacing": []
    }
    assert.equal(true,Object.compare(ast, expected));
  })
  it('segments query', () => {
    ast = parse.parse('SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
      'FROM sys.segments\n' +
      'ORDER BY "start" DESC\n' +
      'LIMIT 50');
    expected = {
      "type": "query",
      "queryType": "SELECT",
      "selectParts": [
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "segment_id",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "datasource",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "start",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "end",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "size",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "version",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "partition_num",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "num_replicas",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "num_rows",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "is_published",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "is_available",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "is_realtime",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "is_overshadowed",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "payload",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        }
      ],
      "from": {
        "type": "from",
        "value": {
          "type": "table",
          "schema": "sys",
          "alias": null,
          "table": "segments",
          "spacing": [
            " "
          ]
        },
        "spacing": [
          "\n"
        ],
        "syntax": "FROM"
      },
      "where": null,
      "groupby": null,
      "having": null,
      "orderBy": {
        "type": "orderBy",
        "orderByParts": [
          {
            "type": "orderByPart",
            "expr": [
              {
                "type": "exprPart",
                "value": {
                  "type": "variable",
                  "value": "start",
                  "spacing": [],
                  "quote": "\""
                },
                "spacing": []
              }
            ],
            "direction": {
              "type": "direction",
              "direction": "DESC",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              " "
            ]
          }
        ],
        "spacing": [
          "\n"
        ],
        "syntax": "ORDER BY"
      },
      "limit": {
        "type": "limit",
        "value": {
          "type": "Integer",
          "value": "50",
          "spacing": [
            " "
          ]
        },
        "spacing": [
          "\n"
        ],
        "syntax": "LIMIT"
      },
      "unionAll": null,
      "syntax": "SELECT",
      "spacing": [],
      "endSpacing": []
    }
    assert.equal(true,Object.compare(ast, expected));
  })
  it('task query', () => {
    ast = parse.parse('SELECT\n' +
      '  "task_id", "type", "datasource", "created_time", "location", "duration", "error_msg",\n' +
      '  CASE WHEN "status" = \'RUNNING\' THEN "runner_status" ELSE "status" END AS "status",\n' +
      '  (\n' +
      '    CASE WHEN "status" = \'RUNNING\' THEN\n' +
      '     (CASE "runner_status" WHEN \'RUNNING\' THEN 4 WHEN \'PENDING\' THEN 3 ELSE 2 END)\n' +
      '    ELSE 1\n' +
      '    END\n' +
      '  ) AS "rank"\n' +
      'FROM sys.tasks\n' +
      'ORDER BY "rank" DESC, "created_time" DESC');
    expected = {
      "type": "query",
      "queryType": "SELECT",
      "selectParts": [
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "task_id",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            "\n",
            " ",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "type",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "datasource",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "created_time",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "location",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "duration",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "error_msg",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "case",
            "caseValue": null,
            "when": [
              {
                "type": "when",
                "when": {
                  "type": "expression",
                  "operator": {
                    "type": "operator",
                    "spacing": [
                      " "
                    ],
                    "operator": "="
                  },
                  "lhs": {
                    "type": "variable",
                    "value": "status",
                    "spacing": [],
                    "quote": "\""
                  },
                  "rhs": {
                    "type": "variable",
                    "value": "RUNNING",
                    "spacing": [
                      " "
                    ],
                    "quote": "'"
                  },
                  "spacing": [
                    " "
                  ]
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "variable",
                    "value": "runner_status",
                    "spacing": [
                      " "
                    ],
                    "quote": "\""
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  " "
                ]
              }
            ],
            "elseValue": {
              "type": "elseValue",
              "elseValue": {
                "type": "variable",
                "value": "status",
                "spacing": [
                  " "
                ],
                "quote": "\""
              },
              "spacing": [
                " "
              ],
              "syntax": "ELSE"
            },
            "end": {
              "type": "end",
              "spacing": [
                " "
              ],
              "syntax": "END"
            },
            "spacing": [],
            "syntax": "CASE"
          },
          "alias": {
            "type": "alias",
            "value": {
              "type": "variable",
              "value": "status",
              "spacing": [
                " "
              ],
              "quote": "\""
            },
            "spacing": [
              " "
            ],
            "syntax": "AS"
          },
          "spacing": [
            ",",
            "\n",
            " ",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "case",
            "caseValue": null,
            "when": [
              {
                "type": "when",
                "when": {
                  "type": "expression",
                  "operator": {
                    "type": "operator",
                    "spacing": [
                      " "
                    ],
                    "operator": "="
                  },
                  "lhs": {
                    "type": "variable",
                    "value": "status",
                    "spacing": [],
                    "quote": "\""
                  },
                  "rhs": {
                    "type": "variable",
                    "value": "RUNNING",
                    "spacing": [
                      " "
                    ],
                    "quote": "'"
                  },
                  "spacing": [
                    " "
                  ]
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "case",
                    "caseValue": {
                      "type": "caseValue",
                      "caseValue": {
                        "type": "variable",
                        "value": "runner_status",
                        "spacing": [],
                        "quote": "\""
                      },
                      "spacing": [
                        " "
                      ]
                    },
                    "when": [
                      {
                        "type": "when",
                        "when": {
                          "type": "variable",
                          "value": "RUNNING",
                          "spacing": [
                            " "
                          ],
                          "quote": "'"
                        },
                        "then": {
                          "type": "then",
                          "syntax": "THEN",
                          "then": {
                            "type": "Integer",
                            "value": "4",
                            "spacing": [
                              " "
                            ]
                          },
                          "spacing": [
                            " "
                          ]
                        },
                        "syntax": "WHEN",
                        "spacing": [
                          " "
                        ]
                      },
                      {
                        "type": "when",
                        "when": {
                          "type": "variable",
                          "value": "PENDING",
                          "spacing": [
                            " "
                          ],
                          "quote": "'"
                        },
                        "then": {
                          "type": "then",
                          "syntax": "THEN",
                          "then": {
                            "type": "Integer",
                            "value": "3",
                            "spacing": [
                              " "
                            ]
                          },
                          "spacing": [
                            " "
                          ]
                        },
                        "syntax": "WHEN",
                        "spacing": [
                          " "
                        ]
                      }
                    ],
                    "elseValue": {
                      "type": "elseValue",
                      "elseValue": {
                        "type": "Integer",
                        "value": "2",
                        "spacing": [
                          " "
                        ]
                      },
                      "spacing": [
                        " "
                      ],
                      "syntax": "ELSE"
                    },
                    "end": {
                      "type": "end",
                      "spacing": [
                        " "
                      ],
                      "syntax": "END"
                    },
                    "spacing": [
                      "\n",
                      " ",
                      " ",
                      " ",
                      " ",
                      " ",
                      "("
                    ],
                    "syntax": "CASE"
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  " "
                ]
              }
            ],
            "elseValue": {
              "type": "elseValue",
              "elseValue": {
                "type": "Integer",
                "value": "1",
                "spacing": [
                  " "
                ]
              },
              "spacing": [
                ")",
                "\n",
                " ",
                " ",
                " ",
                " "
              ],
              "syntax": "ELSE"
            },
            "end": {
              "type": "end",
              "spacing": [
                "\n",
                " ",
                " ",
                " ",
                " "
              ],
              "syntax": "END"
            },
            "spacing": [],
            "syntax": "CASE"
          },
          "alias": {
            "type": "alias",
            "value": {
              "type": "variable",
              "value": "rank",
              "spacing": [
                " "
              ],
              "quote": "\""
            },
            "spacing": [
              "\n",
              " ",
              " ",
              ")",
              " "
            ],
            "syntax": "AS"
          },
          "spacing": [
            ",",
            "\n",
            " ",
            " ",
            "(",
            "\n",
            " ",
            " ",
            " ",
            " "
          ]
        }
      ],
      "from": {
        "type": "from",
        "value": {
          "type": "table",
          "schema": "sys",
          "alias": null,
          "table": "tasks",
          "spacing": [
            " "
          ]
        },
        "spacing": [
          "\n"
        ],
        "syntax": "FROM"
      },
      "where": null,
      "groupby": null,
      "having": null,
      "orderBy": {
        "type": "orderBy",
        "orderByParts": [
          {
            "type": "orderByPart",
            "expr": [
              {
                "type": "exprPart",
                "value": {
                  "type": "variable",
                  "value": "rank",
                  "spacing": [],
                  "quote": "\""
                },
                "spacing": []
              }
            ],
            "direction": {
              "type": "direction",
              "direction": "DESC",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              " "
            ]
          },
          {
            "type": "orderByPart",
            "expr": [
              {
                "type": "exprPart",
                "value": {
                  "type": "variable",
                  "value": "created_time",
                  "spacing": [],
                  "quote": "\""
                },
                "spacing": []
              }
            ],
            "direction": {
              "type": "direction",
              "direction": "DESC",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              ",",
              " "
            ]
          }
        ],
        "spacing": [
          "\n"
        ],
        "syntax": "ORDER BY"
      },
      "limit": null,
      "unionAll": null,
      "syntax": "SELECT",
      "spacing": [],
      "endSpacing": []
    }
    assert.equal(true,Object.compare(ast, expected));
  })
  it('servers query', () => {
    ast = parse.parse('SELECT\n' +
      '  "server", "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",\n' +
      '  (\n' +
      '    CASE "server_type"\n' +
      '    WHEN \'coordinator\' THEN 7\n' +
      '    WHEN \'overlord\' THEN 6\n' +
      '    WHEN \'router\' THEN 5\n' +
      '    WHEN \'broker\' THEN 4\n' +
      '    WHEN \'historical\' THEN 3\n' +
      '    WHEN \'middle_manager\' THEN 2\n' +
      '    WHEN \'peon\' THEN 1\n' +
      '    ELSE 0\n' +
      '    END\n' +
      '  ) AS "rank"\n' +
      'FROM sys.servers\n' +
      'ORDER BY "rank" DESC, "server" DESC');
    expected = {
      "type": "query",
      "queryType": "SELECT",
      "selectParts": [
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "server",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            "\n",
            " ",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "server_type",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "tier",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "host",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "plaintext_port",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "tls_port",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "curr_size",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "variable",
            "value": "max_size",
            "spacing": [],
            "quote": "\""
          },
          "alias": null,
          "spacing": [
            ",",
            " "
          ]
        },
        {
          "type": "selectPart",
          "distinct": null,
          "expr": {
            "type": "case",
            "caseValue": {
              "type": "caseValue",
              "caseValue": {
                "type": "variable",
                "value": "server_type",
                "spacing": [],
                "quote": "\""
              },
              "spacing": [
                " "
              ]
            },
            "when": [
              {
                "type": "when",
                "when": {
                  "type": "variable",
                  "value": "coordinator",
                  "spacing": [
                    " "
                  ],
                  "quote": "'"
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "Integer",
                    "value": "7",
                    "spacing": [
                      " "
                    ]
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  "\n",
                  " ",
                  " ",
                  " ",
                  " "
                ]
              },
              {
                "type": "when",
                "when": {
                  "type": "variable",
                  "value": "overlord",
                  "spacing": [
                    " "
                  ],
                  "quote": "'"
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "Integer",
                    "value": "6",
                    "spacing": [
                      " "
                    ]
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  "\n",
                  " ",
                  " ",
                  " ",
                  " "
                ]
              },
              {
                "type": "when",
                "when": {
                  "type": "variable",
                  "value": "router",
                  "spacing": [
                    " "
                  ],
                  "quote": "'"
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "Integer",
                    "value": "5",
                    "spacing": [
                      " "
                    ]
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  "\n",
                  " ",
                  " ",
                  " ",
                  " "
                ]
              },
              {
                "type": "when",
                "when": {
                  "type": "variable",
                  "value": "broker",
                  "spacing": [
                    " "
                  ],
                  "quote": "'"
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "Integer",
                    "value": "4",
                    "spacing": [
                      " "
                    ]
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  "\n",
                  " ",
                  " ",
                  " ",
                  " "
                ]
              },
              {
                "type": "when",
                "when": {
                  "type": "variable",
                  "value": "historical",
                  "spacing": [
                    " "
                  ],
                  "quote": "'"
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "Integer",
                    "value": "3",
                    "spacing": [
                      " "
                    ]
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  "\n",
                  " ",
                  " ",
                  " ",
                  " "
                ]
              },
              {
                "type": "when",
                "when": {
                  "type": "variable",
                  "value": "middle_manager",
                  "spacing": [
                    " "
                  ],
                  "quote": "'"
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "Integer",
                    "value": "2",
                    "spacing": [
                      " "
                    ]
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  "\n",
                  " ",
                  " ",
                  " ",
                  " "
                ]
              },
              {
                "type": "when",
                "when": {
                  "type": "variable",
                  "value": "peon",
                  "spacing": [
                    " "
                  ],
                  "quote": "'"
                },
                "then": {
                  "type": "then",
                  "syntax": "THEN",
                  "then": {
                    "type": "Integer",
                    "value": "1",
                    "spacing": [
                      " "
                    ]
                  },
                  "spacing": [
                    " "
                  ]
                },
                "syntax": "WHEN",
                "spacing": [
                  "\n",
                  " ",
                  " ",
                  " ",
                  " "
                ]
              }
            ],
            "elseValue": {
              "type": "elseValue",
              "elseValue": {
                "type": "Integer",
                "value": "0",
                "spacing": [
                  " "
                ]
              },
              "spacing": [
                "\n",
                " ",
                " ",
                " ",
                " "
              ],
              "syntax": "ELSE"
            },
            "end": {
              "type": "end",
              "spacing": [
                "\n",
                " ",
                " ",
                " ",
                " "
              ],
              "syntax": "END"
            },
            "spacing": [],
            "syntax": "CASE"
          },
          "alias": {
            "type": "alias",
            "value": {
              "type": "variable",
              "value": "rank",
              "spacing": [
                " "
              ],
              "quote": "\""
            },
            "spacing": [
              "\n",
              " ",
              " ",
              ")",
              " "
            ],
            "syntax": "AS"
          },
          "spacing": [
            ",",
            "\n",
            " ",
            " ",
            "(",
            "\n",
            " ",
            " ",
            " ",
            " "
          ]
        }
      ],
      "from": {
        "type": "from",
        "value": {
          "type": "table",
          "schema": "sys",
          "alias": null,
          "table": "servers",
          "spacing": [
            " "
          ]
        },
        "spacing": [
          "\n"
        ],
        "syntax": "FROM"
      },
      "where": null,
      "groupby": null,
      "having": null,
      "orderBy": {
        "type": "orderBy",
        "orderByParts": [
          {
            "type": "orderByPart",
            "expr": [
              {
                "type": "exprPart",
                "value": {
                  "type": "variable",
                  "value": "rank",
                  "spacing": [],
                  "quote": "\""
                },
                "spacing": []
              }
            ],
            "direction": {
              "type": "direction",
              "direction": "DESC",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              " "
            ]
          },
          {
            "type": "orderByPart",
            "expr": [
              {
                "type": "exprPart",
                "value": {
                  "type": "variable",
                  "value": "server",
                  "spacing": [],
                  "quote": "\""
                },
                "spacing": []
              }
            ],
            "direction": {
              "type": "direction",
              "direction": "DESC",
              "spacing": [
                " "
              ]
            },
            "spacing": [
              ",",
              " "
            ]
          }
        ],
        "spacing": [
          "\n"
        ],
        "syntax": "ORDER BY"
      },
      "limit": null,
      "unionAll": null,
      "syntax": "SELECT",
      "spacing": [],
      "endSpacing": []
    }
    assert.equal(true,Object.compare(ast, expected));
  })

});

describe('Stringify Expression Tests', () =>
{
  it('basic expression', () => {
    const expression = '1 + 1'
    const ast = parse.parse(expression);
    assert.equal(expression, stringify.toSQL(ast));
  })
  it('expression with all operators', () => {
    const expression = '1 + 1 / 1 * 1 - 1'
    const ast = parse.parse(expression);
    assert.equal(expression, stringify.toSQL(ast));
  })
  it('expression with brackets', () => {
    const expression = '2 * (3 + 4)';
    const ast = parse.parse(expression);
    assert.equal(expression, stringify.toSQL(ast));
  })
  it('expression with string values', () => {
    const expression = '\'column\' = "value"';
    const ast = parse.parse(expression);
    assert.equal(expression, stringify.toSQL(ast));
  })
});

describe('Stringify Druid Query Tests', () =>
{
  it('data sources query', () => {
    const expression = 'SELECT\n' +
      '  datasource,\n' +
      '  COUNT(*) AS num_segments,\n' +
      '  SUM(is_available) AS num_available_segments,\n' +
      '  SUM("size") AS size,\n' +
      '  SUM("num_rows") AS num_rows\n' +
      'FROM sys.segments\n' +
      'GROUP BY 1';
    const ast = parse.parse(expression);
    assert.equal(expression, stringify.toSQL(ast));
  })
  it('segments query', () => {
    const expression = 'SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"\n' +
      'FROM sys.segments\n' +
      'ORDER BY "start" DESC\n' +
      'LIMIT 50';
    const ast = parse.parse(expression);
    assert.equal(expression, stringify.toSQL(ast));
  })
  it('task query', () => {
    const expression = 'SELECT\n' +
      '  "task_id", "type", "datasource", "created_time", "location", "duration", "error_msg",\n' +
      '  CASE WHEN "status" = \'RUNNING\' THEN "runner_status" ELSE "status" END AS "status",\n' +
      '  (\n' +
      '    CASE WHEN "status" = \'RUNNING\' THEN\n' +
      '     (CASE "runner_status" WHEN \'RUNNING\' THEN 4 WHEN \'PENDING\' THEN 3 ELSE 2 END)\n' +
      '    ELSE 1\n' +
      '    END\n' +
      '  ) AS "rank"\n' +
      'FROM sys.tasks\n' +
      'ORDER BY "rank" DESC, "created_time" DESC';
    const ast = parse.parse(expression);
    assert.equal(expression, stringify.toSQL(ast));
  })
  it('servers query', () => {
    const expression = 'SELECT\n' +
      '  "server", "server_type", "tier", "host", "plaintext_port", "tls_port", "curr_size", "max_size",\n' +
      '  (\n' +
      '    CASE "server_type"\n' +
      '    WHEN \'coordinator\' THEN 7\n' +
      '    WHEN \'overlord\' THEN 6\n' +
      '    WHEN \'router\' THEN 5\n' +
      '    WHEN \'broker\' THEN 4\n' +
      '    WHEN \'historical\' THEN 3\n' +
      '    WHEN \'middle_manager\' THEN 2\n' +
      '    WHEN \'peon\' THEN 1\n' +
      '    ELSE 0\n' +
      '    END\n' +
      '  ) AS "rank"\n' +
      'FROM sys.servers\n' +
      'ORDER BY "rank" DESC, "server" DESC';
    const ast = parse.parse(expression);
    assert.equal(expression, stringify.toSQL(ast));
  })

});
