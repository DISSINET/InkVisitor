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
    servers: [
      {
        url: "http://api.example.com/v1",
        description: "localhost"
      },
    ],
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
        IEntityCommon: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            legacyId: {
              type: "string",
            },
            status: {
              $ref: "#/components/schemas/EntityEnumsStatus"
            },
            label: {
              type: "string"
            },
            detail: {
              type: "string"
            },
            language: {
              $ref: "#/components/schemas/EntityEnumsLanguage"
            },
            notes: {
              type: "array",
              items: {
                type: "string"
              }
            },
            props: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IProp"
              }
            },
            references: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IReference"
              }
            },
            isTemplate: {
              type: "boolean"
            },
            usedTemplate: {
              type: "string"
            },
            templateData: {
              type: "object"
            }
          },
        },
        IAction: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["A"]
                },
                data: {
                  type: "object",
                  properties: {
                    valencies: {
                      type: "object",
                      properties: {
                        s: {
                          type: "string"
                        },
                        a1: {
                          type: "string"
                        },
                        a2: {
                          type: "string"
                        }
                      }
                    },
                    entities: {
                      type: "object",
                      properties: {
                        s: {
                          type: "array",
                          items: {
                            type: "string"
                          }
                        },
                        a1: {
                          type: "array",
                          items: {
                            type: "string"
                          }
                        },
                        a2: {
                          type: "array",
                          items: {
                            type: "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
          ],
        },
        ITerritory: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["T"]
                },
                data: {
                  type: "object",
                  properties: {
                    territoryId: {
                      type: "string"
                    },
                    order: {
                      type: "integer"
                    }
                  }
                }
              }
            },
          ],
        },
        IStatement: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["S"]
                },
                data: {
                  $ref: "#/components/schemas/IStatementData"
                }
              }
            },
          ],
        },
        IStatementData: {
          type: "object",
          properties: {
            text: {
              type: "string"
            },
            territory: {
              type: "object",
              properties: {
                territoryId: {
                  type: "string",
                },
                order: {
                  type: "integer"
                }
              }
            },
            actions: {
              type: "array",
              items: {
                type: "object"
              }
            },
            actants: {
              type: "array",
              items: {
                type: "object"
              }
            },
            tags: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        IResource: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["R"]
                },
                data: {
                  type: "object",
                  properties: {
                    url: {
                      type: "string"
                    },
                    partValueLabel: {
                      type: "string"
                    },
                    partValueBaseURL: {
                      type: "string"
                    }
                  }
                }
              }
            },
          ],
        },
        IPerson: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["P"]
                },
                data: {
                  type: "object",
                  properties: {
                    logicalType: {
                      $ref: "#/components/schemas/EntityEnumsLogicalType"
                    }
                  }
                }
              }
            },
          ],
        },
        IGroup: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["G"]
                },
                data: {
                  type: "object",
                  properties: {
                    logicalType: {
                      $ref: "#/components/schemas/EntityEnumsLogicalType"
                    }
                  }
                }
              }
            },
          ],
        },
        IObject: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["O"]
                },
                data: {
                  type: "object",
                  properties: {
                    logicalType: {
                      $ref: "#/components/schemas/EntityEnumsLogicalType"
                    }
                  }
                }
              }
            },
          ],
        },
        IConcept: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["C"]
                },
                data: {
                  type: "object"
                }
              }
            },
          ],
        },
        ILocation: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["L"]
                },
                data: {
                  type: "object",
                  properties: {
                    logicalType: {
                      $ref: "#/components/schemas/EntityEnumsLogicalType"
                    }
                  }
                }
              }
            },
          ],
        },
        IValue: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["V"]
                },
                data: {
                  type: "object",
                  properties: {
                    logicalType: {
                      $ref: "#/components/schemas/EntityEnumsLogicalType"
                    }
                  }
                }
              }
            },
          ],
        },
        IEvent: {
          allOf: [
            {
              $ref: "#/components/schemas/IEntityCommon"
            },
            {
              type: "object",
              properties: {
                class: {
                  type: "string",
                  enum: ["E"]
                },
                data: {
                  type: "object",
                  properties: {
                    logicalType: {
                      $ref: "#/components/schemas/EntityEnumsLogicalType"
                    }
                  }
                }
              }
            },
          ],
        },
        IEntity: {
          oneOf: [
            {
              $ref: "#/components/schemas/IAction"
            },
            {
              $ref: "#/components/schemas/ITerritory"
            },
            {
              $ref: "#/components/schemas/IStatement"
            },
            {
              $ref: "#/components/schemas/IResource"
            },
            {
              $ref: "#/components/schemas/IPerson"
            },
            {
              $ref: "#/components/schemas/IGroup"
            },
            {
              $ref: "#/components/schemas/IObject"
            },
            {
              $ref: "#/components/schemas/IConcept"
            },
            {
              $ref: "#/components/schemas/ILocation"
            },
            {
              $ref: "#/components/schemas/IValue"
            },
            {
              $ref: "#/components/schemas/IEvent"
            }
          ]
        },
        IResponseBookmarkFolder: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            name: {
              type: "string"
            },
            entities: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IEntity"
              }
            }
          }
        },
        IUser: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            email: {
              type: "string"
            },
            name: {
              type: "string"
            },
            password: {
              type: "string"
            },
            role: {
              $ref: "#/components/schemas/UserEnumsRole"
            },
            options: {
              type: "object",
              properties: {
                defaultTerritory: {
                  type: "string"
                },
                defaultLanguage: {
                  type: "string"
                },
                searchLanguages: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                }
              }
            },
            bookmarks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string"
                  },
                  name: {
                    type: "string"
                  },
                  entityIds: {
                    type: "array",
                    items: {
                      type: "string"
                    }
                  }
                }
              }
            },
            storedTerritories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  territoryId: {
                    type: "string"
                  },
                }
              }
            },
            rights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  territory: {
                    type: "string"
                  },
                  mode: {
                    $ref: "#/components/schemas/UserEnumsRoleMode"
                  }
                }
              }
            },
            active: {
              type: "boolean"
            }
          }
        },
        IResponseEntity: {
          allOf: [
            {
              oneOf: [
                {
                  $ref: "#/components/schemas/IEntityCommon"
                }
              ]
            },
            {
              type: "object",
              properties: {
                right: {
                  $ref: "#/components/schemas/UserEnumsRoleMode"
                }
              },
            }
          ]
        },
        IResponseTree: {
          type: "object",
          properties: {
            territory: {
              $ref: "#/components/schemas/ITerritory"
            },
            path: {
              type: "array",
              items: {
                type: "string"
              }
            },
            statementsCount: {
              type: "integer",
            },
            lvl: {
              type: "integer",
            },
            children: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IResponseTree"
              }
            },
            empty: {
              type: "boolean"
            },
            right: {
              $ref: "#/components/schemas/UserEnumsRoleMode"
            }
          }
        },
        IResponseUser: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            email: {
              type: "string"
            },
            name: {
              type: "string"
            },
            role: {
              $ref: "#/components/schemas/UserEnumsRole"
            },
            options: {
              type: "object",
              properties: {
                defaultTerritory: {
                  type: "string"
                },
                defaultLanguage: {
                  type: "string"
                },
                searchLanguages: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                }
              }
            },
            rights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  territory: {
                    type: "string"
                  },
                  mode: {
                    $ref: "#/components/schemas/UserEnumsRoleMode"
                  }
                }
              }
            },
            active: {
              type: "boolean"
            },
            bookmarks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string"
                  },
                  name: {
                    type: "string"
                  },
                  entities: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/IEntity"
                    }
                  }
                }
              }
            },
            storedTerritories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  territory: {
                    $ref: "#/components/schemas/IResponseEntity"
                  },
                }
              }
            },
            territoryRights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  territory: {
                    $ref: "#/components/schemas/IResponseEntity"
                  },
                }
              }
            }
          }
        },
        IResponseAdministration: {
          type: "object",
          properties: {
            users: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IResponseUser"
              }
            }
          }
        },
        IResponseTerritory: {
          allOf: [
            {
              oneOf: [
                {
                  $ref: "#/components/schemas/ITerritory"
                }
              ]
            },
            {
              type: "object",
              properties: {
                statements: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/IResponseStatement"
                  }
                },
                entities: {
                  type: "object",
                  description: "{ [key: string]: IEntity }"
                },
                right: {
                  $ref: "#/components/schemas/UserEnumsRoleMode"
                }
              },
            }
          ]
        },
        IResponseStatement: {
          allOf: [
            {
              $ref: "#/components/schemas/IStatement"
            },
            {
              type: "object",
              properties: {
                entities: {
                  type: "object",
                },
                right: {
                  $ref: "#/components/schemas/UserEnumsRoleMode"
                }
              }
            }
          ]
        },
        IResponseDetail: {
          allOf: [
            {
              $ref: "#/components/schemas/IResponseEntity"
            },
            {
              type: "object",
              properties: {
                entities: {
                  type: "object"
                },
                usedInStatements: {
                  type: "array",
                  items: {
                    type: "object"
                  }
                },
                usedInStatementProps: {
                  type: "array",
                  items: {
                    type: "object"
                  }
                },
                usedInMetaProps: {
                  type: "array",
                  items: {
                    type: "object"
                  }
                },
                usedInStatementIdentifications: {
                  type: "array",
                  items: {
                    type: "object"
                  }
                },
                usedInStatementClassifications: {
                  type: "array",
                  items: {
                    type: "object"
                  }
                },
                usedAsTemplate: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
                relations: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/RelationIModel"
                  }
                }
              },
            }
          ],
          required: [
            "id"
          ]
        },
        RelationIModel: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            type: {
              $ref: "#/components/schemas/RelationEnumsType"
            },
            entityIds: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
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
        IProp: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            elvl: {
              $ref: "#/components/schemas/EntityEnumsElvl"
            },
            certainty: {
              $ref: "#/components/schemas/EntityEnumsCertainty"
            },
            logic: {
              $ref: "#/components/schemas/EntityEnumsLogic"
            },
            mood: {
              type: "array",
              items: {
                $ref: "#/components/schemas/EntityEnumsMood"
              }
            },
            moodvariant: {
              $ref: "#/components/schemas/EntityEnumsMoodVariant"
            },
            bundleOperator: {
              $ref: "#/components/schemas/EntityEnumsOperator"
            },
            bundleStart: {
              type: "boolean"
            },
            bundleEnd: {
              type: "boolean"
            },
            children: {
              type: "array",
              items: {
                $ref: "#/components/schemas/IProp"
              }
            },
            type: {
              $ref: "#/components/schemas/IPropSpec"
            },
            value: {
              $ref: "#/components/schemas/IPropSpec"
            }
          },
          required: [
            "id", "elvl", "certainty", "logic", "mood", "moodvariant", "bundleOperator", "bundleStart", "bundleEnd", "children", "type", "value"
          ]
        },
        IPropSpec: {
          type: "object",
          properties: {
            entityId: {
              type: "string"
            },
            elvl: {
              $ref: "#/components/schemas/EntityEnumsElvl"
            },
            logic: {
              $ref: "#/components/schemas/EntityEnumsLogic"
            },
            virtuality: {
              $ref: "#/components/schemas/EntityEnumsVirtuality"
            },
            partitivity: {
              $ref: "#/components/schemas/EntityEnumsPartitivity"
            },
          },
          required: [
            "entityId", "elvl", "logic", "virtuality", "partitivity"
          ]
        },
        IReference: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            resource: {
              type: "string"
            },
            value: {
              type: "string"
            }
          },
          required: [
            "id", "resource", "value"
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
        },
        IRequestSearch: {
          type: "object",
          properties: {
            class: {
              $ref: "#/components/schemas/EntityEnumsClass"
            },
            excludes: {
              type: "array",
              items: {
                $ref: "#/components/schemas/EntityEnumsClass"
              }
            },
            label: {
              type: "string"
            },
            entityIds: {
              type: "array",
              items: {
                type: "string"
              }
            },
            cooccurrenceId: {
              type: "string"
            },
            onlyTemplates: {
              type: "boolean"
            },
            usedTemplate: {
              type: "string"
            }
          }
        },
        EntityEnumsClass: {
          type: "string",
          enum: ["A", "T", "S", "R", "P", "G", "O", "C", "L", "V", "E"]
        },
        EntityEnumsExtension: {
          type: "string",
          enum: ["*", "X"]
        },
        EntityEnumsLogicalType: {
          type: "string",
          enum: ["1", "2", "3", "4"]
        },
        EntityEnumsStatus: {
          type: "string",
          enum: ["0", "1", "2", "3"]
        },
        EntityEnumsCertainty: {
          type: "string",
          enum: ["0", "1", "2", "3", "4", "5", "6"]
        },
        EntityEnumsElvl: {
          type: "string",
          enum: ["1", "2", "3"]
        },
        EntityEnumsPosition: {
          type: "string",
          enum: ["s", "a1", "a2", "pa"]
        },
        EntityEnumsUsedInPosition: {
          type: "string",
          enum: ["value", "type", "actant", "action", "tag"]
        },
        EntityEnumsLogic: {
          type: "string",
          enum: ["1", "2"]
        },
        EntityEnumsMood: {
          type: "string",
          enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]
        },
        EntityEnumsMoodVariant: {
          type: "string",
          enum: ["1", "2", "3"]
        },
        EntityEnumsVirtuality: {
          type: "string",
          enum: ["1", "2", "3", "4", "5", "6"]
        },
        EntityEnumsPartitivity: {
          type: "string",
          enum: ["1", "2", "3", "4", "5"]
        },
        EntityEnumsOperator: {
          type: "string",
          enum: ["x", "a", "o", ">", ">=", "=", "<=", "<"]
        },
        EntityEnumsLanguage: {
          type: "string",
          enum: ["", "lat", "eng", "enm", "oci", "ces", "ita", "fra", "deu"]
        },
        EntityEnumsResourceType: {
          type: "string",
          enum: ["1", "2"]
        },
        EntityEnumsTerritoryType: {
          type: "string",
          enum: ["1", "2"]
        },
        EntityEnumsOrder: {
          type: "integer",
          enum: [-9999, 9999]
        },
        UserEnumsRole: {
          type: "string",
          enum: ["admin", "editor", "viewer"]
        },
        UserEnumsRoleMode: {
          type: "string",
          enum: ["write", "read", "admin"]
        },
        RelationEnumsType: {
          type: "string",
          enum: ["SC", "SOL", "S", "A", "T", "PR", "SAR", "AEE", "RE", "C", "I", "H", "IM"]
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