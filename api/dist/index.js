// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../../common/config/db.json":[function(require,module,exports) {
module.exports = {
  "local": {
    "host": "localhost",
    "port": 7687,
    "username": "neo4j",
    "password": "test"
  }
};
},{}],"../../common/util/db.js":[function(require,module,exports) {
var neo4j = require("neo4j-driver");

var db = require("./../../common/config/db.json").local; // setting the driver


var driver = false;

var getDriver = () => {
  if (!driver) {
    driver = neo4j.driver("bolt://" + db.host, neo4j.auth.basic(db.username, db.password), {
      disableLosslessIntegers: true
    });
  }

  return driver;
};

var newSession = (accessMode = "write") => {
  const sessionDriver = getDriver();
  const session = sessionDriver.session({
    defaultAccessMode: accessMode === "write" ? neo4j.session.WRITE : neo4j.session.READ
  });
  return session;
};

exports.close = function () {
  driver = getDriver();
  driver.close();
  driver = false;
};

const parseRecord = recordData => {
  if (recordData) {
    const props = recordData.properties;

    if (props) {
      return props;
    } else {
      return recordData;
    }
  }

  return false;
};
/*
 * take query and run it on db
 */


exports.runQuery = async function (query, params = {}) {
  const session = newSession();
  const result = await session.run(query, params).catch(e => {
    console.log(e);
  });

  if (!result || !result.records || result.records.length === 0) {
    return false;
  }

  return result.records.map(recordRaw => {
    const record = recordRaw.toObject();
    let recordOut = {};
    const keys = Object.keys(record);

    if (keys.length > 1) {
      keys.forEach(recordKey => {
        recordOut[recordKey] = parseRecord(record[recordKey]);
      });
    } else {
      recordOut = parseRecord(record[keys[0]]);
    }

    return recordOut;
  });
};
},{"./../../common/config/db.json":"../../common/config/db.json"}],"index.ts":[function(require,module,exports) {
"use strict";

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function () {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];

      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;

        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };

        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;

        case 7:
          op = _.ops.pop();

          _.trys.pop();

          continue;

        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }

          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }

          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }

          if (t && _.label < t[2]) {
            _.label = t[2];

            _.ops.push(op);

            break;
          }

          if (t[2]) _.ops.pop();

          _.trys.pop();

          continue;
      }

      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var express = require("express");

var db_1 = require("../../common/util/db");

var app = express();
var port = 3000;
app.get("/text/:textId", function (req, res) {
  return __awaiter(void 0, void 0, void 0, function () {
    var actions_actants, ations_resources, actions, actants, texts, _a;

    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          console.log(req.params.textId);
          return [4
          /*yield*/
          , db_1.runQuery("MATCH (text:T{id: '" + req.params.textId + "'})-[r_origin:ORIGINATES_IN]-(action:A)-[r_actant:HAS_ACTANT]-(actant) RETURN r_origin,action.id,r_actant,actant.id")];

        case 1:
          actions_actants = _b.sent();
          return [4
          /*yield*/
          , db_1.runQuery("MATCH (text:T{id: '" + req.params.textId + "'})-[:ORIGINATES_IN]-(action:A)-[r_reference:HAS_REFERENCE_IN]-(resource:R) RETURN action.id,r_reference,resource.id")];

        case 2:
          ations_resources = _b.sent();
          return [4
          /*yield*/
          , db_1.runQuery("MATCH (text:T{id: '" + req.params.textId + "'})-[:ORIGINATES_IN]-(action:A) RETURN action")];

        case 3:
          actions = _b.sent();
          return [4
          /*yield*/
          , db_1.runQuery("MATCH (text:T{id: '" + req.params.textId + "'})-[:ORIGINATES_IN]-(:A)-[:HAS_ACTANT]-(actant) RETURN actant")];

        case 4:
          actants = _b.sent();
          _a = {};
          return [4
          /*yield*/
          , db_1.runQuery("MATCH (:T{id: '" + req.params.textId + "'})-[r_part:IS_PART_OF]->(text:T) RETURN text, r_part")];

        case 5:
          _a.down = _b.sent();
          return [4
          /*yield*/
          , db_1.runQuery("MATCH (:T{id: '" + req.params.textId + "'})<-[r_part:IS_PART_OF]-(text:T) RETURN text, r_part")];

        case 6:
          texts = (_a.up = _b.sent(), _a);
          db_1.close();
          res.send({
            texts: texts,
            actions: actions,
            actants: actants,
            ations_resources: ations_resources,
            actions_actants: actions_actants
          });
          return [2
          /*return*/
          ];
      }
    });
  });
});
app.get("/", function (req, res) {
  return res.send("Hello!");
});
app.listen(port, function () {
  return console.log("Example app listening at http://localhost:" + port);
});
},{"../../common/util/db":"../../common/util/db.js"}]},{},["index.ts"], null)