var { loadSheet } = require("./loadsheet.js");

var sheets = require("./../../common/config/sheets");
var columnsToCheck = require("./../../common/config/columns");
var relationTypes = require("./../../common/config/relations");

const {
  replaceAll,
  uuid,
  charToEntity,
  entityToChar,
  asyncForEach,
} = require("../../common/util/base");

var nodes = [];
var edges = [];

const addEdge = (from, to, type) => {
  const edgeWithTheSameIds = edges.find((e) => e.from === from && e.to === to);
  if (!edgeWithTheSameIds) {
    if (type in relationTypes && relationTypes[type].name) {
      edges.push({
        from,
        to,
        type: relationTypes[type].name,
      });
    } else {
      console.error("wrong relation type", type);
    }
  } else {
    console.error("there is already an edge with the ids", from, to);
  }
};

const addNode = (id, entity, label, data = {}) => {
  const nodeWithTheSameId = nodes.find((n) => n.id === id);
  if (!nodeWithTheSameId) {
    nodes.push({
      id,
      label,
      entity,
      ...data,
    });
  } else {
    console.error("there is already a node with the id", id);
  }
};

module.exports.parse = async (texts) => {
  const meta = await loadMeta();

  await asyncForEach(texts, async (text) => {
    await processText(meta, text);
  });

  return [nodes, edges];
};

var loadMeta = async () => {
  const actions = await loadSheet({
    spread: sheets.meta.actions.id,
    sheet: sheets.meta.actions.sheets.main,
  });

  const sourcesSpread = sheets.meta.sources.id;
  const sourceSheets = sheets.meta.sources.sheets;

  /*
   * loading textual tables
   */
  const texts = await loadSheet({
    spread: sourcesSpread,
    sheet: sourceSheets.texts,
  });
  const manuscripts = await loadSheet({
    spread: sourcesSpread,
    sheet: sourceSheets.manuscripts,
  });
  const others = await loadSheet({
    spread: sourcesSpread,
    sheet: sourceSheets.others,
  });

  /*
   * linking others and manuscripts to texts
   */
  texts.forEach((text) => {
    text.resources = [];
  });

  others.forEach((other) => {
    if (other.text_id) {
      const relevantTexts = texts.filter(
        (text) => text.id === other.text_id || other.text_id === "all"
      );
      relevantTexts.forEach((text) => {
        text.resources.push(other);
      });
    }
  });

  manuscripts.forEach((manuscript) => {
    if (manuscript.text_id) {
      const relevantTexts = texts.filter(
        (text) => text.id === manuscript.text_id || manuscript.text_id === "all"
      );
      relevantTexts.forEach((text) => {
        text.resources.push(manuscript);
      });
    }
  });

  /*
   * creating nodes of texts and resources
   */
  texts.forEach((text) => {
    // text nodes
    addNode(text.id, "T", text.label);

    // resource nodes
    text.resources.forEach((resource) => {
      if (!nodes.find((n) => n.id === resource.id)) {
        addNode(resource.id, "R", resource.label);
      }
    });
  });

  return {
    texts,
    actions,
  };
};

var processText = async (meta, textId) => {
  const text = meta.texts.find((t) => t.id === textId);

  if (text && text.resources) {
    const entities = {};

    const entityTables = text.resources.filter(
      (resource) => resource.type === "entity table"
    );

    for (var oi in entityTables) {
      const resource = entityTables[oi];
      console.log("sheet loaded", resource.spreadsheet_id, resource.sheet_name);
      if (resource.spreadsheet_id) {
        const sheet = await loadSheet({
          spread: resource.spreadsheet_id,
          sheet: resource.sheet_name,
        });

        const entityName =
          resource.sheet_name === "Statements"
            ? "actions"
            : resource.sheet_name.toLowerCase();

        entities[entityName] = {
          data: sheet,
          resource: resource.id,
          global: resource.text_id === "all",
        };
      }
    }
    console.log(entityTables);

    /*
     * processing all entity lists except actions
     * creates node for each row and hasAttribute action for each value in every column
     */
    Object.keys(entities).forEach((entityName) => {
      if (entityName !== "actions") {
        let entity = entities[entityName];

        entity.data.forEach((entityRow) => {
          // entity node

          const entityNodeId = entity.global
            ? entityRow.id
            : entity.resource + "_" + entityRow.id;

          addNode(entityNodeId, entityToChar(entityName), entityRow["label"]);
        });
      }
    });

    /*
     * create nodes from all text parts
     */

    // create root text node
    entities.actions.data.forEach((action) => {
      const textPartId = action.text_part_id;
      if (textPartId && !nodes.find((n) => n.id === textPartId)) {
        addNode(textPartId, "T", textPartId);

        // finds parrent and connect it to the parent
        const potentialParentId = textPartId.split("-").slice(0, -1).join("-");

        if (
          potentialParentId &&
          nodes.find((n) => n.id === potentialParentId)
        ) {
          addEdge(potentialParentId, textPartId, "part");
        }
      }
    });

    // parse statement list
    entities.actions.data.forEach((statementRow, si) => {
      // add statement node
      addNode(statementRow.id, "S", statementRow.id, {
        type: statementRow["id_action_or_relation"],
        modality: statementRow["modality"],
        text: statementRow["text"],
        elvl: statementRow["epistemological_level"],
        order: si,
      });

      // actants
      ["id_subject", "id_actant1", "id_actant2"].forEach((actantIdCol) => {
        const checkValue = statementRow[actantIdCol];

        if (checkValue || checkValue === "NS" || checkValue === "NA") {
          checkValue
            .split(" #")
            .filter((i) => i)
            .forEach((checkId) => {
              let id = checkId;
              let entity = false;
              let elvl = 1;

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
                    (action) =>
                      action.id === "A" + id + "_" + entities.actions.resource
                  );
                  if (isAction) {
                    id = "A" + id + "_" + entities.actions.resource;
                  }
                  entity = isAction ? "actions" : "territories";
                } else {
                  entity = charToEntity(id[0]);
                }
                if (entity === "territories") {
                  // text is always global
                  id = id;
                } else {
                  //console.log(actionId, id, checkColumn, entity);
                  if (entity) {
                    id = entities[entity].global
                      ? id
                      : entities[entity].resource + "_" + id;
                  }
                }
              }

              try {
                if (entity) {
                  // check whether this object exists
                  console.log(entity, id);
                  console.log(nodes.find((n) => n.id === id));

                  const node =
                    entity === "actions"
                      ? nodes.find(
                          (n) =>
                            entities["actions"].resource + "_" + n.id === id
                        )
                      : nodes.find((n) => n.id === id);

                  if (node) {
                    addEdge(action.id, node.id, "actant", {
                      position: checkColumn.type,
                      elvl: elvl,
                    });
                  } else {
                    console.error(entity);
                    console.error("node not found", id);
                  }
                }
              } catch (e) {
                console.log("error creating node", e);
              }
            });
        }
      });

      // add subject node
      addNode(statementRow["id_subject"], "S", statementRow["subject"]);
      // add actant1 node
      addNode(statementRow["id_actant1"], "S", statementRow["actant1"]);
      // add actant2 node
      addNode(statementRow["id_actant2"], "S", statementRow["actant2"]);
    });
  }
};
