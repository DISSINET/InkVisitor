var { loadSheet } = require("./../util/loadsheet");
var { v4 } = require("uuid");
var fs = require("fs");

/**
 * waterfall processing
 */
const loadStatementsTables = async (next) => {
  const actants = [];
  const actions = [];

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

  /**
   * actants
   */
  const tableResources = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Resources",
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
   * parse all entity sheets
   */
  for (var esi = 1; esi < entitySheets.length; esi++) {
    const entitySheet = entitySheets[esi];

    const data = await loadSheet({
      spread: entitySheet.spread,
      sheet: entitySheet.sheet,
    });

    data.forEach((entityRow) => {
      actants.push({
        id: entitySheet.id + "_" + entityRow.id,
        class: entitySheet.entityType,
        data: {
          label: entityRow.label.trim(),
        },
        meta: { created },
      });
    });
  }

  next({
    actions,
    actants,
  });
};

/**
 * repeating functions
 */

const created = {
  user: "1",
  time: new Date().valueOf(),
};

// Parsing props in entity tables

const propsConfig = {
  P: {
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
  G: {},
  C: {},
  L: {},
  O: {},
  E: {},
};

loadStatementsTables((out) => {
  fs.writeFileSync("import/all/actants.json", JSON.stringify(out.actants));
  fs.writeFileSync("import/all/actions.json", JSON.stringify(out.actions));
});
