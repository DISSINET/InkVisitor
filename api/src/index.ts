import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import { buildSchema } from "graphql";
import { neo4jgraphql, makeAugmentedSchema } from "neo4j-graphql-js";
import { ApolloServer } from "apollo-server";
import neo4j from "neo4j-driver";

import { replaceAll } from "./../../util/base";

var driver = neo4j.driver(
  "bolt://0.0.0.0:7687",
  neo4j.auth.basic("neo4j", "test")
);

//@cypher(statement: "MATCH (this)-[:HAS_ACTANT]-(a) RETURN a")

// Initialize a GraphQL schema
var typeDefs = `
  union Actant = P | C

  type HasActants @relation(name: "HAS_ACTANT") {
    from: A
    data: String
    to: Actant
  }

  interface Node {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }
  
  type A {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
    actantR: [HasActants]
  }

  type P  {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }

  type C  {
    id: String!
    label: String
    entity: String
    data: String
    actantOf: [A]
  }

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
`;

const resolvers = {
  // root entry point to GraphQL service
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

var schema = makeAugmentedSchema({
  typeDefs,
  resolvers
});

const server = new ApolloServer({
  context: { driver },
  schema,
  resolvers,
  tracing: true,
  engine: true
});

server.listen(3003, "0.0.0.0").then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
