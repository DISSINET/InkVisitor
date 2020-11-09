var { loadSheet } = require("./../util/loadsheet");
var { v4 } = require("uuid");
var fs = require("fs");

/**
 * waterfall processing
 */
const actants = [];
const actions = [];

const loadStatementsTables = async (next) => {
  const tableActions = await loadSheet({
    spread: "1vzY6opQeR9hZVW6fmuZu2sgy_izF8vqGGhBQDxqT_eQ",
    sheet: "Statements",
  });

  /**
   * actions
   */
  tableActions.forEach((action) => {
    actions.push({
      id: action.id_action_or_relation,
      parent: action.parent_id,
      note: action.note,
      labels: [
        {
          label: action.action_or_relation_english,
          language: "en",
        },
        {
          label: action.action_or_relation,
          language: "la",
        },
      ],
      types: [],
      valencies: [],
      rulesActants: [],
      rulesProperties: [],
    });
  });

  // parse the table of territories
  const tableTexts = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Texts",
  });
  tableTexts.forEach((text) => {
    addTerritoryActant(text.id, {
      label: text.label,
      parent: "T0",
      content: text.content,
      type: "",
      language: "la",
    });
  });

  addTerritoryActant(rootTerritory, {
    label: "everything",
    parent: false,
    content: "everything",
    type: "",
    language: "la",
  });

  // parse resources
  const tableManuscripts = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Manuscripts",
  });
  const tableResources = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Resources",
  });

  tableManuscripts.forEach((manuscript) => {
    addResourceActant(manuscript.id, {
      label: manuscript.label,
      content: "",
      link: "",
      type: manuscript.form,
      language: "la",
    });
  });

  const codingSheets = tableResources
    .filter((row) => row["type"] === "coding sheet")
    .map((row) => {
      return {
        id: row["id"],
        textId: row["text_id"],
        label: row["label"],
        spread: row["spreadsheet_id"],
        sheet: row["sheet_name"],
        entities: {},
      };
    });

  const entitySheets = tableResources
    .filter((row) => row["type"] === "entity table")
    .map((row) => {
      return {
        id: row["id"],
        texts: row["text_id"].split(" #"),
        label: row["label"],
        entityType: row["entity_type"],
        spread: row["spreadsheet_id"],
        sheet: row["sheet_name"],
      };
    });

  /**
   * parse all ENTITY sheets
   */

  addTerritoryActant("entity-tables", {
    label: "entity tables",
    parent: "T0",
    content: "",
    type: "",
    language: "la",
  });

  for (var esi = 0; esi < entitySheets.length; esi++) {
    const entitySheet = entitySheets[esi];

    const data = await loadSheet({
      spread: entitySheet.spread,
      sheet: entitySheet.sheet,
    });

    const entitySheetTerritory = "T_" + entitySheet.id;

    addTerritoryActant(entitySheetTerritory, {
      label: entitySheet.label,
      parent: "entity-tables",
      content: "",
      type: "",
      language: "la",
    });

    data.forEach((entityRow) => {
      const entityRowTerritory = entitySheetTerritory + "_" + entityRow.id;

      addTerritoryActant(entityRowTerritory, {
        label: entitySheet.label + "_" + entityRow.id,
        parent: entitySheetTerritory,
        content: "",
        type: "",
        language: "la",
      });

      addEntityActant(
        entitySheet.id + "_" + entityRow.id,
        entityRow.label,
        entitySheet.entityType
      );

      parseEntityPropsInRow(
        entityRow,
        entitySheet.entityType,
        entityRowTerritory
      );
    });

    entitySheet.texts.forEach((text) => {
      const sheet = codingSheets.find((cs) => cs.textId === text);
      if (sheet) {
        sheet.entities[entitySheet.entityType] = entitySheet.id;
      }
    });
  }

  /**
   * parse CODING SHEETS
   */
  for (var csi = 0; csi < codingSheets.length; csi++) {
    const codingSheet = codingSheets[csi];

    const data = await loadSheet({
      spread: codingSheet["spread"],
      sheet: codingSheet["sheet"],
    });

    // territories
    const territoryIds = [
      ...new Set(data.map((s) => s.text_part_id).filter((a) => a)),
    ];

    // add sub-territories
    territoryIds.forEach((territoryId) => {
      addTerritoryActant(territoryId, {
        label: territoryId,
        parent: territoryId.includes("-")
          ? territoryId.split("-").slice(0, -1).join("-")
          : false,
        content: "",
        type: "A",
        language: "la",
      });
    });

    data.forEach((statement) => {
      // the main statement
      const mainStatement = {
        id: statement.id,
        class: "S",
        data: {
          label: "",
          action: statement.id_action_or_relation,
          territory: statement.text_part_id,
          references: [
            {
              resource: statement.primary_reference_id,
              part: statement.primary_reference_part,
              type: "P",
            },
            {
              resource: statement.secondary_reference_id,
              part: statement.secondary_reference_part,
              type: "S",
            },
          ],
          tags: statement.tags_id.split(" #").filter((t) => t),
          certainty: statement.certainty || "1",
          elvl: statement.epistemological_level || "1",
          modality: statement.modality || "1",
          text: statement.text,
          note: `NOTE: ${statement.note}, LOCATION: ${statement.location_text}, TIME: ${statement.time_note}`,
          props: [],
          actants: [],
        },
        meta: { created, updated: [] },
      };

      //subject
      processActant(
        mainStatement,
        "s",
        statement.id_subject,
        statement.subject_property_type_id,
        statement.subject_property_value_id,
        codingSheet.entities
      );

      // actant1
      processActant(
        mainStatement,
        "a1",
        statement.id_actant1,
        statement.actant1_property_type_id,
        statement.actant1_property_value_id,
        codingSheet.entities
      );

      // actant2
      processActant(
        mainStatement,
        "a2",
        statement.id_actant2,
        statement.actant2_property_type_id,
        statement.actant2_property_value_id,
        codingSheet.entities
      );

      // location
      processLocation(
        mainStatement,
        statement.id_location,
        statement.id_location_from,
        statement.id_location_to
      );

      // time
      // TODO
      //processTime(mainStatement, statement);

      // ar property
      if (
        checkValidId(statement.action_or_relation_property_type_id) &&
        checkValidId(statement.action_or_relation_property_value_id)
      ) {
        const propActant1Id =
          createNewActantIfNeeded(
            statement.action_or_relation_property_type_id
          ) ||
          addResourceToEntityId(
            statement.action_or_relation_property_type_id,
            codingSheet.entities
          );

        const propActant2Id =
          createNewActantIfNeeded(
            statement.action_or_relation_property_value_id
          ) ||
          addResourceToEntityId(
            statement.action_or_relation_property_value_id,
            codingSheet.entities
          );

        mainStatement.data.props.push({
          id: v4(),
          origin: statement.id,
          type: propActant1Id,
          value: propActant2Id,
          elvl: "1",
          certainty: "1",
        });
      }

      /**
       * TODO
       * Time
       * Location
       */

      actants.push(mainStatement);
    });
  }

  next();
};

/**
 ******************************************************************************
 * HELPERS
 ******************************************************************************
 */
const rootTerritory = "T0";

const created = {
  user: "1",
  time: new Date().valueOf(),
};

const checkValidId = (idValue) => {
  return (
    idValue &&
    idValue !== "???" &&
    idValue !== "NS" &&
    !idValue.includes("<") &&
    !idValue.includes(">")
  );
};

const addEntityActant = (id, label, type) => {
  if (id) {
    actants.push({
      id,
      class: type,
      data: {
        label: label.trim(),
      },
      meta: { created },
    });
  }
};
const addTerritoryActant = (id, data) => {
  if (id) {
    if (!actants.some((a) => a.id == id)) {
      actants.push({
        id,
        class: "T",
        data: data,
        meta: { created },
      });
    }
  }
};
const addResourceActant = (id, data) => {
  if (id) {
    actants.push({
      id,
      class: "R",
      data: data,
      meta: { created },
    });
  }
};

// Parsing props in entity tables

const propsConfig = {
  P: {
    name: {
      type: "value",
      conceptId: "R0010_C0325",
    },
    surname: {
      type: "value",
      conceptId: "R0010_C0324",
    },
    occupation_type: {
      type: "value",
      conceptId: "R0010_C0318",
    },
    occupation_general: {
      type: "value",
      conceptId: "R0010_C0315",
    },
    occupation_or_office: {
      type: "value",
      conceptId: "R0010_C0314",
    },
    education: {
      type: "value",
      conceptId: "R0010_C0319",
    },
    sex: {
      type: "concept",
      conceptId: "R0010_C0320",
      mappingFn: (tableValue) => {
        if (tableValue === "m") {
          return "R0010_C0172";
        } else if (tableValue === "f") {
          return "R0010_C0171";
        } else {
          false;
        }
      },
    },
  },
  G: {},
  C: {},
  L: {},
  O: {},
  E: {},
};

const parseEntityPropsInRow = (row, entityId, territory) => {
  if (entityId in propsConfig) {
    const entityPropConfig = propsConfig[entityId];

    Object.keys(row).forEach((tableProp) => {
      if (Object.keys(entityPropConfig).includes(tableProp)) {
        // check empty value
        if (row[tableProp]) {
          const propType = entityPropConfig[tableProp].type;

          // CONCEPT type
          if (propType === "concept") {
            const conceptValueId = entityPropConfig[tableProp].mappingFn(
              row[tableProp]
            );

            createEmptyPropStatement(
              row.id,
              entityPropConfig[tableProp].conceptId,
              conceptValueId,
              territory
            );
            // VALUE type
          } else if (propType === "value") {
            const value = row[tableProp];
            const valueId = v4();

            // add actant
            addEntityActant(valueId, value, "V");

            // add statement
            createEmptyPropStatement(
              row.id,
              entityPropConfig[tableProp].conceptId,
              valueId,
              territory
            );
          }
        }
      }
    });
  }
};

/**
 * create simple statement HAS without any props
 */
const createEmptyPropStatement = (
  idSubject,
  idActant1,
  idActant2,
  territory
) => {
  if (idSubject && idActant1 && idActant2) {
    actants.push({
      id: v4(),
      class: "S",
      meta: { created, updated: [] },
      data: {
        label: "",
        action: "A0093",
        territory: territory,
        references: [],
        tags: [],
        certainty: "1",
        elvl: "1",
        modality: "1",
        text: "",
        note: "",
        props: [],
        actants: [
          {
            id: v4(),
            actant: idSubject,
            position: "s",
            elvl: "1",
            certainty: "1",
          },
          {
            id: v4(),
            actant: idActant1,
            position: "a1",
            elvl: "1",
            certainty: "1",
          },
          {
            id: v4(),
            actant: idActant2,
            position: "a2",
            elvl: "1",
            certainty: "1",
          },
        ],
      },
    });
  }
};

const addResourceToEntityId = (id, codeSheetResources) => {
  const entityId = id[0];
  if (entityId in codeSheetResources) {
    return codeSheetResources[entityId] + "_" + id;
  } else {
    return id;
  }
};

const processLocation = (
  statement,
  locationWhereIds,
  locationFromIds,
  locationToIds
) => {
  const locationTypes = [
    {
      ids: locationWhereIds,
      concept: "R0010_C0223",
    },
    {
      ids: locationFromIds,
      concept: "R0010_C0304",
    },
    {
      ids: locationToIds,
      concept: "R0010_C0305",
    },
  ];

  const sameLocationType = "C0230";

  locationTypes.forEach((locationType) => {
    const locationIdValues = locationType.ids;

    if (
      locationIdValues &&
      locationIdValues !== "NS" &&
      locationIdValues !== "NA"
    ) {
      locationIdValues.split(" #").forEach((locationIdValue) => {
        if (locationIdValue.includes("<")) {
          // location value refers to another statement
          const statementLocationId = locationIdValue
            .replace("<", "")
            .replace(">", "");
          statement.data.props.push({
            id: v4(),
            origin: statement.id,
            type: sameLocationType,
            value: statementLocationId,
            elvl: "1",
            certainty: "1",
          });
        } else {
          statement.data.props.push({
            id: v4(),
            origin: statement.id,
            type: locationType.concept,
            value: locationIdValue,
            elvl: "1",
            certainty: "1",
          });
        }
      });
    }
  });
};

const processActant = (
  statement,
  position,
  actantIdValues,
  propActant1Value,
  propActant2Value,
  codingSheetEntities
) => {
  if (checkValidId(actantIdValues)) {
    actantIdValues.split(" #").forEach((actantIdValue) => {
      // asign elvl and certainty

      let elvl = actantIdValue.includes("[") ? "2" : "1";
      let certainty = "1";

      // remove brackets
      const actantIdClean = actantIdValue.replace("[", "").replace("]", "");

      // chceck tilda in value and create new actant
      const actantId =
        createNewActantIfNeeded(actantIdClean) ||
        addResourceToEntityId(actantIdClean, codingSheetEntities);

      const statementActantId = v4();
      statement.data.actants.push({
        id: statementActantId,
        actant: actantId,
        position: position,
        elvl: elvl,
        certainty: certainty,
      });

      // create a prop if there is one
      if (checkValidId(propActant1Value) && checkValidId(propActant2Value)) {
        const propActant1Id =
          createNewActantIfNeeded(propActant1Value) ||
          addResourceToEntityId(propActant1Value, codingSheetEntities);

        const propActant2Id =
          createNewActantIfNeeded(propActant2Value) ||
          addResourceToEntityId(propActant2Value, codingSheetEntities);

        /**
         * TODO
         * elvl and certainty
         */
        statement.data.props.push({
          id: v4(),
          origin: statementActantId,
          type: propActant1Id,
          value: propActant2Id,
          elvl: "1",
          certainty: "1",
        });
      }
    });
  }
};

// add a new actant when the tilda ~ is present in the value and returns id of that new actant - otherwise return false
const createNewActantIfNeeded = (actantValue) => {
  if (actantValue.includes("~")) {
    const newActantId = v4();
    const newActantType = actantValue.split("~")[1];
    const newActantLabel = actantValue.split("~")[2];

    addEntityActant(newActantId, newActantLabel, newActantType);

    return newActantId;
  } else {
    return false;
  }
};

loadStatementsTables(() => {
  fs.writeFileSync("import/all/actants.json", JSON.stringify(actants));
  fs.writeFileSync("import/all/actions.json", JSON.stringify(actions));
});
