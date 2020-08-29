var { loadSheet } = require("./../util/loadsheet");
var { v4 } = require("uuid");

var fs = require("fs");

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
        actants: [
          {
            actant: statement.id_subject,
            position: "s",
            elvl: "1",
            certainty: "1",
          },
        ],
      },
    };

    /**
     *
     * split by #
     * chceck [] -> elvl
     * check ~ -> new actant
     */

    // actant1
    if (statement.id_actant1) {
      statementActant.data.actants.push({
        actant: statement.id_actant1,
        position: "a1",
        elvl: "1",
        certainty: "1",
      });
    }

    // actant2
    if (statement.id_actant2) {
      statementActant.data.actants.push({
        actant: statement.id_actant2,
        position: "a2",
        elvl: "1",
        certainty: "1",
      });
    }

    // subject property
    if (statement.subject_property_type_id) {
      statementActant.data.props.push({
        id: v4(),
        subject: statement.id_subject,
        actant1: statement.subject_property_type_id,
        actant2: statement.subject_property_value_id,
        elvl: "1",
        certainty: "1",
      });
    }

    // ar property
    if (statement.action_or_relation_property_type_id) {
      statementActant.data.props.push({
        id: v4(),
        subject: statement.id,
        actant1: statement.action_or_relation_property_type_id,
        actant2: statement.action_or_relation_property_value_id,
        elvl: "1",
        certainty: "1",
      });
    }

    // actant1 property
    if (statement.actant1_property_type_id) {
      statementActant.data.props.push({
        id: v4(),
        subject: statement.id_actant1,
        actant1: statement.actant1_property_type_id,
        actant2: statement.actant1_property_value_id,
        elvl: "1",
        certainty: "1",
      });
    }
    // actant2 property
    if (statement.actant2_property_type_id) {
      statementActant.data.props.push({
        id: v4(),
        subject: statement.id_actant2,
        actant1: statement.actant2_property_type_id,
        actant2: statement.actant2_property_value_id,
        elvl: "1",
        certainty: "1",
      });
    }

    actants.push(statementActant);
  });

  fs.writeFileSync("import/sellan/actants.json", JSON.stringify(actants));
});
