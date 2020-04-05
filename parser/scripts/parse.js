var { loadSheet } = require("./loadsheet.js");

var sheets = require("./../../common/config/sheets");
var columnsToCheck = require("./../../common/config/columns");
var relationTypes = require("./../../common/config/relations");

const {
  replaceAll,
  uuid,
  charToEntity,
  entityToChar,
  asyncForEach
} = require("./../../common/util/base");

var nodes = [];
var edges = [];

const addEdge = (from, to, type, data = {}) => {
  if (!data.elvl) {
    data.elvl = 0;
  }
  const edgeWithTheSameIds = edges.find(e => e.from === from && e.to === to);
  if (!edgeWithTheSameIds) {
    if (type in relationTypes && relationTypes[type].name) {
      edges.push({
        from,
        to,
        type: relationTypes[type].name,
        data: JSON.stringify(data)
      });
    } else {
      console.error("wrong relation type", type);
    }
  } else {
    console.error("there is already an edge with the ids", from, to);
  }
};

const addNode = (id, entity, label, data = {}) => {
  const nodeWithTheSameId = nodes.find(n => n.id === id);
  if (!nodeWithTheSameId) {
    nodes.push({
      id,
      label,
      entity,
      data: JSON.stringify(data)
    });
  } else {
    console.error("there is already a node with the id", id);
  }
};

module.exports.parse = async texts => {
  const meta = await loadMeta();

  await asyncForEach(texts, async text => {
    await processText(meta, text);
  });
  return [nodes, edges];
};

var loadMeta = async () => {
  const actions = await loadSheet({
    spread: sheets.meta.actions.id,
    sheet: sheets.meta.actions.sheets.main
  });

  const sourcesSpread = sheets.meta.sources.id;
  const sourceSheets = sheets.meta.sources.sheets;

  /*
   * loading textual tables
   */
  const texts = await loadSheet({
    spread: sourcesSpread,
    sheet: sourceSheets.texts
  });
  const manuscripts = await loadSheet({
    spread: sourcesSpread,
    sheet: sourceSheets.manuscripts
  });
  const others = await loadSheet({
    spread: sourcesSpread,
    sheet: sourceSheets.others
  });

  /*
   * linking others and manuscripts to texts
   */
  texts.forEach(text => {
    text.resources = [];
  });

  others.forEach(other => {
    if (other.text_id) {
      const relevantTexts = texts.filter(
        text => text.id === other.text_id || other.text_id === "all"
      );
      relevantTexts.forEach(text => {
        text.resources.push(other);
      });
    }
  });

  manuscripts.forEach(manuscript => {
    if (manuscript.text_id) {
      const relevantTexts = texts.filter(
        text => text.id === manuscript.text_id || manuscript.text_id === "all"
      );
      relevantTexts.forEach(text => {
        text.resources.push(manuscript);
      });
    }
  });

  /*
   * creating nodes of texts and resources
   */
  texts.forEach(text => {
    // text nodes
    addNode(text.id, "T", text.label);

    // resource nodes
    text.resources.forEach(resource => {
      if (!nodes.find(n => n.id === resource.id)) {
        addNode(resource.id, "R", resource.label);
      }
      addEdge(text.id, resource.id, "concern");
    });
  });

  return {
    texts,
    actions
  };
};

var processText = async (meta, textId) => {
  const text = meta.texts.find(t => t.id === textId);

  if (text && text.resources) {
    const entities = {};

    const entityTables = text.resources.filter(
      resource => resource.type === "entity table"
    );

    for (var oi in entityTables) {
      const resource = entityTables[oi];
      console.log("sheet loaded", resource.spreadsheet_id, resource.sheet_name);
      if (resource.spreadsheet_id) {
        const sheet = await loadSheet({
          spread: resource.spreadsheet_id,
          sheet: resource.sheet_name
        });

        const entityName =
          resource.sheet_name === "Statements"
            ? "actions"
            : resource.sheet_name.toLowerCase();

        entities[entityName] = {
          data: sheet,
          resource: resource.id,
          global: resource.text_id === "all"
        };
      }
    }

    /*
     * create nodes from all text parts
     */

    // create root text node
    entities.actions.data.forEach(action => {
      const textPartId = action.text_part_id;
      if (textPartId && !nodes.find(n => n.id === textPartId)) {
        addNode(textPartId, "T", textPartId);

        // finds parrent and connect it to the parent
        const potentialParentId = textPartId
          .split("-")
          .slice(0, -1)
          .join("-");

        if (potentialParentId && nodes.find(n => n.id === potentialParentId)) {
          addEdge(potentialParentId, textPartId, "part");
        }
      }
    });

    /*
     * processing all entity lists except actions
     * creates node for each row and hasAttribute action for each value in every column
     */
    Object.keys(entities).forEach(entityName => {
      if (entityName !== "actions") {
        let entity = entities[entityName];

        entity.data.forEach(entityRow => {
          // entity node

          const entityNodeId = entity.global
            ? entityRow.id
            : entity.resource + "_" + entityRow.id;

          addNode(entityNodeId, entityToChar(entityName), entityRow.label);

          Object.keys(entityRow).forEach(columnName => {
            if (columnName) {
              const value = entityRow[columnName];
              if (value) {
                const attributeActionId = entity.resource + "_" + uuid();
                const attributeValueId = entity.resource + "_" + uuid();

                // has attribute action
                addNode(attributeActionId, "A", "A0093" + "|" + columnName, {
                  type: "A0093",
                  typeModifier: columnName
                });

                // value node
                addNode(attributeValueId, "V", value, { value });

                // link between entity node and hasAttribute action
                addEdge(attributeActionId, entityNodeId, "actant", {
                  position: "subject"
                });

                // link between value and hasAttribute action
                addEdge(attributeActionId, attributeValueId, "actant", {
                  position: "actant1"
                });

                // link between action and source
                addEdge(attributeActionId, entity.resource, "reference");

                // link between action and text
                addEdge(attributeActionId, textId, "origin");
              }
            }
          });
        });
      }
    });

    /*
     * add `A` before all action ids
     */
    entities.actions.data.forEach((action, si) => {
      action.id = "A" + action.id + "_" + entities.actions.resource;

      addNode(
        action.id,
        "A",
        action["id_action_or_relation"] +
          "|" +
          action.modifier_action_or_relation,
        {
          type: action["id_action_or_relation"],
          typeModifier: action.modifier_action_or_relation,
          modality: action.modality,
          parentId: action.parent_id,
          text: action.text,
          order: si
        }
      );
    });

    /*
     * parse action list
     */
    entities.actions.data.forEach(action => {
      // change id of all actions
      const actionId = action.id;

      /*
       * parsing resources and text units
       */

      // create link between action and resources
      if (action.primary_reference_id) {
        addEdge(actionId, action.primary_reference_id, "reference", {
          reference: action.primary_reference_part,
          primary: true
        });
      }

      if (action.secondary_reference_id) {
        addEdge(actionId, action.secondary_reference_id, "reference", {
          reference: action.secondary_reference_part,
          primary: false
        });
      }

      // create link between action and text
      if (action.text_part_id) {
        addEdge(actionId, action.text_part_id, "origin", {
          elvl: action.epistemological_level
        });
      }

      /*
       * checking columns to create links
       */

      columnsToCheck.forEach(checkColumn => {
        let checkValue = action[checkColumn.column];

        if (!checkValue || checkValue === "NS" || checkValue === "NA") {
          // do nothing
        } else {
          if (
            /*
             * replacement of <sub: ID> syntax
             */
            checkValue.indexOf("<") > -1 &&
            checkValue.indexOf("sub:") > -1
          ) {
            const linkAction = replaceAll(checkValue, ["<sub: ", ">"], "");

            const linkActionIds = entities.actions.data
              .filter(s => s.parent_id === linkAction)
              .map(a => a.id);
            checkValue = linkActionIds.join(" #");
          }

          /*
           * creating list of ids
           */
          checkValue
            .split(" #")
            .filter(i => i)
            .map(checkId => {
              let id = checkId;
              let elvl = 1;

              let entity = false;

              // change epistemic level to 3
              if (checkId[0] === "<") {
                id = replaceAll(id, ["<", ">"], "");
              }

              if (checkId[0] === "[") {
                elvl = 3;
                id = replaceAll(id, ["[", "]"], "");
              }

              if (id[1] === "~") {
                const newNodeId = id[0] + "_" + uuid();

                addNode(newNodeId, id[0], id.substring(1));

                id = newNodeId;
                entity = charToEntity(id[0]);
              } else {
                // check entity
                if (id[0] === "T") {
                  const isAction = entities.actions.data.find(
                    action =>
                      action.id === "A" + id + "_" + entities.actions.resource
                  );
                  if (isAction) {
                    id = "A" + id + "_" + entities.actions.resource;
                  }
                  entity = isAction ? "actions" : "texts";
                } else {
                  entity = charToEntity(id[0]);
                }

                if (entity === "texts") {
                  // text is always global
                  id = id;
                } else {
                  //console.log(actionId, id, checkColumn, entity);
                  id = entities[entity].global
                    ? id
                    : entities[entity].resource + "_" + id;
                }
              }

              if (checkColumn.type === "locality") {
                const hasLocationActionId = textId + uuid();
                if (entity === "actions") {
                  // if this is a location column that is referring to another location
                  // create `has same location` action
                  addNode(
                    hasLocationActionId,
                    "A",
                    "A0188|" + checkColumn.modifier
                  );

                  addEdge(hasLocationActionId, "A" + id, "actant", {
                    position: "actant1"
                  });
                } else {
                  // create `has location` action
                  addNode(
                    hasLocationActionId,
                    "A",
                    "A0187|" + checkColumn.modifier
                  );
                  addEdge(hasLocationActionId, id, "actant", {
                    position: "actant1"
                  });
                }

                // add links
                addEdge(hasLocationActionId, actionId, "actant", {
                  position: "subject"
                });
              } else {
                try {
                  if (entity) {
                    // check whether this object exists
                    const node =
                      entity === "actions"
                        ? nodes.find(
                            n =>
                              entities["actions"].resource + "_" + n.id === id
                          )
                        : nodes.find(n => n.id === id);

                    if (node) {
                      addEdge(action.id, node.id, "actant", {
                        position: checkColumn.type,
                        elvl: elvl
                      });
                    } else {
                      console.error(entity);
                      console.error("node not found", id);
                    }
                  }
                } catch (e) {
                  console.log("error creating node", e);
                }
              }
            });
        }
      });
    });
  }
};
