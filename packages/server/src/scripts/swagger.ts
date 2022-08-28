import { writeFileSync } from "fs";

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InkVisitor',
      version: '1.3.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/modules/**/index.ts'],
};

const openapiSpecification = swaggerJsdoc(options);
writeFileSync("swagger.json", JSON.stringify(openapiSpecification, null, 4));