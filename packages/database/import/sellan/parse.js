var { loadSheet } = require("./../util/loadsheet");
var { v4 } = require("uuid");
var fs = require("fs");

const created = {
  user: "1",
  time: new Date().valueOf(),
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
    actants.push({
      id,
      class: "T",
      data: data,
      meta: { created },
    });
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

/**
 * Parsing props in entity tables
 */

const propsConfig = {
  person: {
    name: {
      type: "value",
      conceptId: "C0325",
    },
    surname: {
      type: "value",
      conceptId: "C0324",
    },
    occupation_type: {
      type: "value",
      conceptId: "C0318",
    },
    occupation_general: {
      type: "value",
      conceptId: "C0315",
    },
    occupation_or_office: {
      type: "value",
      conceptId: "C0314",
    },
    education: {
      type: "value",
      conceptId: "C0319",
    },
    sex: {
      type: "concept",
      conceptId: "C0320",
      mappingFn: (tableValue) => {
        if (tableValue === "m") {
          return "C0172";
        } else if (tableValue === "f") {
          return "C0171";
        } else {
          false;
        }
      },
    },
  },
  group: {},
  concept: {},
  location: {},
  object: {},
  event: {},
};

const parsePropsInRow = (row, entity, territory) => {
  if (entity in propsConfig) {
    const entityPropConfig = propsConfig[entity];

    Object.keys(row).forEach((tableProp) => {
      if (Object.keys(entityPropConfig).includes(tableProp)) {
        // check empty value
        if (row[tableProp]) {
          const { propType } = entityPropConfig[tableProp].type;

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
  } else {
  }
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

const processActant = (
  statement,
  position,
  actantIdValues,
  propActant1Value,
  propActant2Value
) => {
  if (
    statement &&
    statement.data &&
    statement.data.actants &&
    statement.data.props &&
    ["s", "a1", "a2"].includes(position)
  ) {
    const propActant1Id =
      createNewActantIfNeeded(propActant1Value) || propActant1Value;

    const propActant2Id =
      createNewActantIfNeeded(propActant2Value) || propActant2Value;

    actantIdValues.split(" #").forEach((actantIdValue) => {
      // asign elvl and certainty
      let elvl = actantIdValue.includes("[") ? "2" : "1";
      let certainty = actantIdValue.includes("[") ? "2" : "1";

      // remove brackets
      const actantIdClean = actantIdValue.replace("[", "").replace("]", "");

      // chceck tilda in value and create new actant
      const actantId = createNewActantIfNeeded(actantIdClean) || actantIdClean;

      statement.data.actants.push({
        actant: actantId,
        position: position,
        elvl: elvl,
        certainty: certainty,
      });

      if (propActant1Id && propActant2Id) {
        statement.data.props.push({
          id: v4(),
          subject: actantId,
          actant1: propActant1Id,
          actant2: propActant2Id,
          elvl: "1",
          certainty: "1",
        });
      }
    });
  }
};

/**
 * add a new actant when the tilda ~ is present in the value and returns id of that new actant - otherwise return false
 */
const createNewActantIfNeeded = (actantValue) => {
  if (actantValue.includes("~")) {
    const newActantId = v4();
    const newActantType = actantValue.split("~")[0];
    const newActantLabel = actantValue.split("~")[1];

    addEntityActant(newActantId, newActantLabel, newActantType);

    return newActantId;
  } else {
    return false;
  }
};

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
            actant: idSubject,
            position: "s",
            elvl: "1",
            certainty: "1",
          },
          {
            actant: idActant1,
            position: "a1",
            elvl: "1",
            certainty: "1",
          },
          {
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

var loadTables = async (next) => {
  const tableTexts = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Texts",
  });
  const tableManuscripts = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Manuscripts",
  });
  const tableResources = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Resources",
  });
  const tableStatements = await loadSheet({
    spread: "1X6P4jOAqWGXg1sPH4vOxHgl7-1v11AjQoEiJgjrCrmA",
    sheet: "Statements",
  });
  const tablePersons = await loadSheet({
    spread: "1kamaBpL3RpKK9r1kEfH2DBY1A0EA6XZOqDSUsBthyEU",
    sheet: "Persons",
  });
  const tableConcepts = await loadSheet({
    spread: "1nSqnN6cjtdWK-y6iKZlJv4iGdhgtqkRPus8StVgExP4",
    sheet: "WithoutDiscouraged",
  });
  const tableLocations = await loadSheet({
    spread: "125CPCSQylTb35x0A6KxKNDqbkRa4PwYiPvW5fQp4DBQ",
    sheet: "Locations",
  });
  const tableObjects = await loadSheet({
    spread: "1tRCxkBfC9zLf-TEE2HMrNbi_I2NZKclJS2UVfcpa4Co",
    sheet: "Objects",
  });
  const tableEvents = await loadSheet({
    spread: "1mal4uGwZlwC7vycLiP5O6sZQgQRdTexBdpp3TF8QFjw",
    sheet: "Events",
  });
  const tableGroups = await loadSheet({
    spread: "13QzPZWh1-wm-BPeQDROHNcFprx2c58KSWCl3-3HAn-c",
    sheet: "Groups",
  });
  const tableActions = await loadSheet({
    spread: "1vzY6opQeR9hZVW6fmuZu2sgy_izF8vqGGhBQDxqT_eQ",
    sheet: "Statements",
  });

  next({
    texts: tableTexts,
    manuscripts: tableManuscripts,
    resources: tableResources,
    statements: tableStatements,
    persons: tablePersons,
    groups: tableGroups,
    concepts: tableConcepts,
    locations: tableLocations,
    objects: tableObjects,
    events: tableEvents,
    actions: tableActions,
  });
};

const actants = [];
const actions = [];

const rootTerritory = "T3";

loadTables((tables) => {
  console.log(Object.keys(tables));

  // parse table of territories
  tables.texts.forEach((text) => {
    addTerritoryActant(text.id, {
      label: text.label,
      parent: false,
      content: text.content,
      type: "",
      language: "la",
    });
  });

  // parse resources
  tables.manuscripts.forEach((manuscript) => {
    addResourceActant(manuscript.id, {
      label: manuscript.label,
      content: "",
      link: "",
      type: manuscript.form,
      language: "la",
    });
  });
  tables.resources.forEach((resource) => {
    addResourceActant(resource.id, {
      label: resource.label,
      content: "",
      link: "",
      type: resource.type,
      language: "la",
    });
  });

  // action table
  tables.actions.forEach((action) => {
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

  /**
   * PERSONS table
   */
  tables.persons.forEach((person) => {
    addEntityActant(person.id, person.label, "P");
    parsePropsInRow(person, "person", rootTerritory);
  });

  /**
   * GROUPS table
   */
  tables.groups.forEach((group) => {
    addEntityActant(group.id, group.label, "G");
    parsePropsInRow(group, "group", rootTerritory);
  });

  /**
   * CONCEPTS table
   */
  tables.concepts.forEach((concept) => {
    addEntityActant(concept.id, concept.label, "C");
    parsePropsInRow(concept, "concept", rootTerritory);
  });

  /**
   * LOCATIONS table
   */
  tables.locations.forEach((location) => {
    addEntityActant(location.id, location.label, "L");
    parsePropsInRow(location, "location", rootTerritory);
  });

  /**
   * OBJECTS table
   */
  tables.objects.forEach((object) => {
    addEntityActant(object.id, object.label, "O");
    parsePropsInRow(object, "object", rootTerritory);
  });

  /**
   * EVENTS table
   */
  tables.events.forEach((event) => {
    addEntityActant(event.id, event.label, "E");
    parsePropsInRow(event, "event", rootTerritory);
  });

  /**
   * parsing Statements
   */

  // territories
  const territoryIds = [
    ...new Set(tables.statements.map((s) => s.text_part_id).filter((a) => a)),
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

  // process statements table
  tables.statements.forEach((statement) => {
    const statementActant = {
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
        tags: statement.tags_id.split(" #"),
        certainty: statement.certainty || "1",
        elvl: parseInt(statement.epistemological_level),
        modality: statement.modality || "1",
        text: statement.text,
        note: statement.note,
        props: [],
        actants: [],
      },
      meta: { created, updated: [] },
    };

    //subject
    processActant(
      statementActant,
      "s",
      statement.id_subject,
      statement.subject_property_type_id,
      statement.subject_property_value_id
    );

    // actant1
    processActant(
      statementActant,
      "a1",
      statement.id_actant1,
      statement.actant1_property_type_id,
      statement.actant1_property_value_id
    );

    // actant2
    processActant(
      statementActant,
      "a2",
      statement.id_actant2,
      statement.actant2_property_type_id,
      statement.actant2_property_value_id
    );

    // ar property
    if (
      checkValidId(statement.action_or_relation_property_type_id) &&
      checkValidId(statement.action_or_relation_property_value_id)
    ) {
      const propActant1Id =
        createNewActantIfNeeded(
          statement.action_or_relation_property_type_id
        ) || statement.action_or_relation_property_type_id;

      const propActant2Id =
        createNewActantIfNeeded(
          statement.action_or_relation_property_value_id
        ) || statement.action_or_relation_property_value_id;

      statementActant.data.props.push({
        id: v4(),
        subject: statement.id,
        actant1: propActant1Id,
        actant2: propActant2Id,
        elvl: "1",
        certainty: "1",
      });
    }

    actants.push(statementActant);
  });

  fs.writeFileSync("import/sellan/actants.json", JSON.stringify(actants));
  fs.writeFileSync("import/sellan/actions.json", JSON.stringify(actions));
});
