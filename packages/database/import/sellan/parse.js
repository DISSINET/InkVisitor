var { loadSheet } = require("./../util/loadsheet");
var { v4 } = require("uuid");

var fs = require("fs");

/**
 *
 * helping methods
 */
/**
 *
 * split by #
 * chceck [] -> elvl
 * check ~ -> new actant
 */

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
    actants.push({
      id: newActantId,
      label: newActantLabel,
      class: "E",
      data: {
        type: newActantType,
      },
    });
    return newActantId;
  } else {
    return false;
  }
};

var loadTables = async (next) => {
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
  const tableActions = await loadSheet({
    spread: "1vzY6opQeR9hZVW6fmuZu2sgy_izF8vqGGhBQDxqT_eQ",
    sheet: "WithoutDiscouraged",
  });

  next({
    statements: tableStatements,
    persons: tablePersons,
    concepts: tableConcepts,
    locations: tableLocations,
    objects: tableObjects,
    events: tableEvents,
    actions: tableActions,
  });
};

const actants = [];
const actions = [];

loadTables((tables) => {
  console.log(Object.keys(tables));

  // person table
  tables.persons.forEach((person) => {
    const personActant = {
      id: person.id,
      label: person.label,
      class: "E",
      data: {
        type: "P",
      },
    };
    actants.push(personActant);
  });

  // concepts table
  tables.concepts.forEach((concept) => {
    const conceptActant = {
      id: concept.id,
      label: concept.label,
      class: "E",
      data: {
        type: "C",
      },
    };
    actants.push(conceptActant);
  });

  // locations table
  tables.locations.forEach((location) => {
    const locationActant = {
      id: location.id,
      label: location.label,
      class: "E",
      data: {
        type: "L",
      },
    };
    actants.push(locationActant);
  });

  // locations table
  tables.objects.forEach((object) => {
    const objectActant = {
      id: object.id,
      label: object.label,
      class: "E",
      data: {
        type: "O",
      },
    };
    actants.push(objectActant);
  });

  // events table
  tables.events.forEach((event) => {
    const eventActant = {
      id: event.id,
      label: event.label,
      class: "E",
      data: {
        type: "E",
      },
    };
    actants.push(eventActant);
  });

  // territories
  const territoryIds = [
    ...new Set(tables.statements.map((s) => s.text_part_id).filter((a) => a)),
  ];

  territoryIds.forEach((territoryId) => {
    actants.push({
      id: territoryId,
      label: territoryId,
      class: "T",
      data: {
        parent: territoryId.includes("-")
          ? territoryId.split("-").slice(0, -1).join("-")
          : false,
        content: "",
        type: "A",
        language: "Lang1",
      },
    });
  });

  // process statements table
  tables.statements.forEach((statement) => {
    const statementActant = {
      id: statement.id,
      class: "S",
      label: "",
      data: {
        action: statement.id_action_or_relation,
        territory: statement.text_part_id,
        references: [
          {
            resource: "R1", // check this
            part: statement.primary_reference_part,
            type: "P",
          },
          {
            resource: "R2", // check this
            part: statement.secondary_reference_part,
            type: "S",
          },
        ],
        tags: statement.tags_id.split(" #"),
        certainty: statement.certainty,
        elvl: parseInt(statement.epistemological_level),
        modality: statement.modality,
        text: statement.text,
        note: statement.note,
        props: [],
        actants: [],
      },
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
    if (statement.action_or_relation_property_type_id) {
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
});
