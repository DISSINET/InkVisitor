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
      },
      schemas: {
        Acl: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            controller: {
              type: "string"
            },
            route: {
              type: "string",
            },
            roles: {
              type: "array",
              items: {
                type: "string"
              }
            }
          },
          required: [
            "controller", "route", "roles"
          ]
        },
        IAudit: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            entityId: {
              type: "string",
            },
            user: {
              type: "string"
            },
            date: {
              type: "string",
              format: "date",
              example: "2019-05-17"
            },
            changes: {
              type: "object",
            }
          },
          required: [
            "id", "entityId", "user", "date", "changes"
          ]
        },
        IResponseAudit: {
          type: "object",
          properties: {
            entityId: {
              type: "string",
            },
            last: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IAudit"
              }
            },
            first: {
              $ref: "#/components/schemas/IAudit"
            }
          },
          required: [
            "entityId", "last"
          ]
        },
        IResponseGeneric: {
          type: "object",
          properties: {
            result: {
              type: "boolean",
            },
            error: {
              type: "string"
            },
            message: {
              type: "string"
            }
          },
          required: [
            "result"
          ]
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
  },
  apis: ['./src/modules/**/index.ts'],
};

const openapiSpecification = swaggerJsdoc(options);
writeFileSync("swagger.json", JSON.stringify(openapiSpecification, null, 4));