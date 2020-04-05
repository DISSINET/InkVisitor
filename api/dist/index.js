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
})({"index.ts":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var neo4j_graphql_js_1 = require("neo4j-graphql-js");

var apollo_server_1 = require("apollo-server");

var neo4j_driver_1 = __importDefault(require("neo4j-driver"));

var driver = neo4j_driver_1.default.driver("bolt://0.0.0.0:7687", neo4j_driver_1.default.auth.basic("neo4j", "test")); //@cypher(statement: "MATCH (this)-[:HAS_ACTANT]-(a) RETURN a")
// Initialize a GraphQL schema

var typeDefs = "\n  union Actant = P | C\n\n  type HasActants @relation(name: \"HAS_ACTANT\") {\n    from: A\n    data: String\n    to: P!\n  }\n\n  interface Node {\n    id: String!\n    label: String\n    entity: String\n    data: String\n    actantOf: [A]\n  }\n  \n  type A {\n    id: String!\n    label: String\n    entity: String\n    data: String\n    actantOf: [A]\n    actantR: [HasActants]\n  }\n\n  type P  {\n    id: String!\n    label: String\n    entity: String\n    data: String\n    actantOf: [A]\n  }\n\n  type C  {\n    id: String!\n    label: String\n    entity: String\n    data: String\n    actantOf: [A]\n  }\n";
/*

type E implements Entity {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }
  type G implements Entity {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }
  type L implements Entity {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }
  type O implements Entity {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }

  type R implements Entity {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }
  type T implements Entity {
    id: String!
    label: String
    entity: String
    data: String
    actions: [A] @cypher(statement: "MATCH (this)-[:ORIGINATES_IN]-(s:A) RETURN s")
    texts: [T] @relation(name: "IS_PART_OF", direction:"OUT")
    actantOf: [A]
  }
  type V implements Entity {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }
  type Query {
    ActionsByTextId(textId: ID): [A] @cypher(statement: "MATCH (a:A)-[:ORIGINATES_IN]-(t:T) WHERE t.id = $textId RETURN a")
    }
*/

var resolvers = {// root entry point to GraphQL service

  /*
  Query: {
    async ActionsByTextId(object, params, ctx, resolveInfo) {
      const rawResults = await neo4jgraphql(
        object,
        params,
        ctx,
        resolveInfo,
        true
      );
  
      const results = rawResults.map(record => {
        try {
          record.data = JSON.parse(replaceAll(record.data, ["'"], '"'));
        } catch (e) {}
        return record;
      });
  
      return results;
    }
  }
  */
};
var schema = neo4j_graphql_js_1.makeAugmentedSchema({
  typeDefs: typeDefs,
  resolvers: resolvers
});
var server = new apollo_server_1.ApolloServer({
  context: {
    driver: driver
  },
  schema: schema,
  resolvers: resolvers,
  tracing: true,
  engine: true
});
server.listen(3003, "0.0.0.0").then(function (_a) {
  var url = _a.url;
  console.log("\uD83D\uDE80 Server ready at " + url);
});
},{}]},{},["index.ts"], null)