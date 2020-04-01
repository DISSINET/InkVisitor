import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import { buildSchema } from "graphql";
import { neo4jgraphql, makeAugmentedSchema } from "neo4j-graphql-js";
import { ApolloServer } from "apollo-server";
import neo4j from "neo4j-driver";

var driver = neo4j.driver(
  "bolt://0.0.0.0:7687",
  neo4j.auth.basic("neo4j", "test")
);

// Initialize a GraphQL schema
var typeDefs = `
  interface Entity {
    id: ID
    _id: String
    label: String  
    entity: String
  }
  
  type A implements Entity {
    id: ID
    _id: String
    label: String
    entity: String
    type: String
    type_modifier: String
    subjects: [Entity] @cypher(statement: "MATCH (this)-[:HAS_ACTANT { position: 'subject' }]-(s) RETURN s")
    actants1: [Entity] @cypher(statement: "MATCH (this)-[:HAS_ACTANT { position: 'actant1' }]-(s) RETURN s")
    actants2: [Entity] @cypher(statement: "MATCH (this)-[:HAS_ACTANT { position: 'actant2' }]-(s) RETURN s")
  }
  type C implements Entity {
    id: ID
    _id: String
    label: String  
    entity: String
  }
  type E implements Entity {
    id: ID
    _id: String
    label: String  
    entity: String
  }
  type G implements Entity {
    id: ID
    _id: String
    label: String  
    entity: String
  }
  type L implements Entity {
    id: ID
    _id: String
    label: String  
    entity: String
  }
  type O implements Entity {
    id: ID
    _id: String
    label: String 
    entity: String 
  }
  type P implements Entity {
    id: ID
    _id: String
    label: String  
    entity: String
  }
  type R implements Entity {
    id: ID
    _id: String
    label: String  
    entity: String
  }
  type T implements Entity {
    id: ID
    _id: String
    label: String  
    entity: String
    actions: [A] @cypher(statement: "MATCH (this)-[:ORIGINATES_IN]-(s:A) RETURN s")
    texts: [T] @relation(name: "IS_PART_OF", direction:"OUT")
  }
  type V implements Entity {
    id: ID
    value: String
    _id: String
    label: String  
    entity: String
  }
  type Query {
    ActionsByTextId(textId: ID): [A]
	}

`;

const resolvers = {
  // root entry point to GraphQL service
  Query: {
    ActionsByTextId(object, params, ctx, resolveInfo) {
      const res = neo4jgraphql(object, params, ctx, resolveInfo, true);
      return res;
    }
  }
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
