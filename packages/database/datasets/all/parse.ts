var { loadSheet } = require("./../util/loadsheet");
var { v4 } = require("uuid");
var fs = require("fs");

import {
  ActantType,
  ActantStatus,
  EntityActantType,
  Certainty,
  Elvl,
  Position,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
  Operator,
  EntityLogicalType,
} from "../../../shared/enums";
import {
  IAudit,
  IAction,
  IActant,
  IEntity,
  ILabel,
  IOption,
  IStatement,
  ITerritory,
  IResource,
  IStatementProp,
  IUser,
} from "./../../../shared/types";

import { actantStatusDict } from "./../../../shared/dictionaries";

/**
 * waterfall processing
 */
var actants: IActant[] = [];

type IConceptProp = {
  type: "value" | "concept";
  conceptId: string;
  mappingDict?: { [id: string]: string };
};
var propsConfig: {
  [id: string]: IConceptProp;
} = {};

const loadStatementsTables = async (next: Function) => {
  const tableActions = await loadSheet({
    spread: "1vzY6opQeR9hZVW6fmuZu2sgy_izF8vqGGhBQDxqT_eQ",
    sheet: "Statements",
    headerRow: 3,
  });

  /**
   * actions
   */
  tableActions.forEach((action: any) => {
    if (action.label) {
      const statusOption = actantStatusDict.find(
        (o) => o.label === action.status
      );

      const parseEntities = (text: string) => {
        const out: string[] = [];

        const parts = text.split("|");
        if (parts.length == 0) {
          return [];
        } else {
          parts.forEach((part) => {
            if (part === "NULL") {
              out.push("NULL");
            } else {
              Object.values(ActantType).forEach((type) => {
                if (part.includes(type)) {
                  out.push(type);
                }
              });
            }
          });

          return out;
        }
      };

      const newAction: IAction = {
        id: action.id,
        class: ActantType.Action,
        data: {
          valencies: {
            s: action.subject_valency,
            a1: action.actant1_valency,
            a2: action.actant2_valency,
          },
          entities: {
            s: parseEntities(action.subject_entity_type),
            a1: parseEntities(action.actant1_entity_type),
            a2: parseEntities(action.actant2_entity_type),
          },
          properties: [],
        },
        language: action.language === "English" ? ["eng"] : ["lat"],
        status: statusOption
          ? (statusOption.value as ActantStatus)
          : ("0" as ActantStatus),
        notes: action.note ? [action.note] : [],
        label: action.label,
        detail: action.detail_incl_valency,
      };
      actants.push(newAction);
    }
  });

  // parse the table of territories
  const tableTexts = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Texts",
  });

  //  addTerritoryActant("entity-tables", "entity tables", "T0", 0);

  tableTexts.forEach((text: { id: string; label: string }, ti: number) => {
    addTerritoryActant(text.id, text.label, "T0", ti + 1);
  });

  addTerritoryActant(rootTerritory, "everything", false, 0);

  // parse resources
  const tableManuscripts = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Manuscripts",
  });

  type IRowResources = {
    type: string;
    id: string;
    label: string;
    text_id: string;
    spreadsheet_id: string;
    sheet_name: string;
    entity_type: string;
    spread: string;
    sheet: string;
  };
  type ICodingSheet = {
    id: string;
    textId: string;
    label: string;
    spread: string;
    sheet: string;
    entities: { [key: string]: string };
  };

  const tableResources: IRowResources[] = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Resources",
  });

  tableManuscripts.forEach((manuscript: { id: string; label: string }) => {
    addResourceActant(manuscript.id, manuscript.label);
  });

  const codingSheets: ICodingSheet[] = tableResources
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
    .filter((row) => row["spreadsheet_id"])
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
   * prepare props config from CONCEPT list
   *  */
  const conceptSheet = entitySheets.find((es) => es.id === "R0010");

  const conceptsData = conceptSheet
    ? await loadSheet({
        spread: conceptSheet.spread,
        sheet: conceptSheet.sheet,
      })
    : [];

  type IConceptRow = {
    masterlists_column_name: string;
    masterlists_column_value: string;
    instance_entity_type: string;
    id: string;
  };

  const propsList: {
    [id: string]: { id: string; value: string; type: string }[];
  } = {};

  conceptsData.forEach((conceptRow: IConceptRow) => {
    const entityTableNames = conceptRow.instance_entity_type.split(" #");
    entityTableNames.forEach((entityTableName) => {
      const type = conceptRow.masterlists_column_name;
      const value = conceptRow.masterlists_column_value;
      const id = conceptRow.id;

      if (type && type !== "NA") {
        if (type in propsList) {
          propsList[type].push({
            id,
            value,
            type,
          });
        } else {
          propsList[type] = [
            {
              id,
              value,
              type,
            },
          ];
        }
      }
    });
  });

  Object.keys(propsList).forEach((propName: string) => {
    const propValues = propsList[propName];

    if (propValues.length === 1) {
      const prop: IConceptProp = {
        type: "value",
        conceptId: propValues[0].id,
      };
      propsConfig[propName] = prop;
    } else {
      const conceptRow = propValues.find((v) => v.value === "NA");
      if (conceptRow) {
        const prop: IConceptProp = {
          type: "concept",
          conceptId: conceptRow.id,
          mappingDict: {},
        };

        propValues.forEach((propValue) => {
          if (prop["mappingDict"]) {
            prop["mappingDict"][propValue.value] = propValue.id;
          }
        });

        propsConfig[propName] = prop;
      } else {
        console.log("warning: wrong prop:", propName, propValues);
      }
    }
  });

  /**
   * parse all ENTITY sheets
   */
  for (var esi = 0; esi < entitySheets.length; esi++) {
    const entitySheet = entitySheets[esi];

    const data = await loadSheet({
      spread: entitySheet.spread,
      sheet: entitySheet.sheet,
    });

    const entitySheetTerritory = "T_" + entitySheet.id;

    // addTerritoryActant(
    //   entitySheetTerritory,
    //   entitySheet.label,
    //   "entity-tables",
    //   esi
    // );

    data.forEach((entityRow: any, eri: number) => {
      //const entityRowTerritory = entitySheetTerritory + "_" + entityRow.id;

      // addTerritoryActant(
      //   entityRowTerritory,
      //   entitySheet.label + "_" + entityRow.id,
      //   entitySheetTerritory,
      //   eri
      // );

      addEntityActant(
        entitySheet.id + "_" + entityRow.id,
        entityRow.label,
        entitySheet.entityType as EntityActantType
      );

      parseEntityPropsInRow(entityRow, "T0");
    });

    entitySheet.texts.forEach((text) => {
      const sheets = codingSheets.filter((cs) => cs.textId === text);

      sheets.forEach((sheet) => {
        sheet.entities[entitySheet.entityType] = entitySheet.id;
      });
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
    const territoryIds: string[] = [];

    data.forEach((s: { text_part_id: string }) => {
      const textPartId = s.text_part_id;
      if (textPartId && !territoryIds.includes(textPartId)) {
        territoryIds.push(textPartId);
      }
    });

    // add sub-territories
    territoryIds.forEach((territoryId: string, ti: number) => {
      addTerritoryActant(
        territoryId,
        territoryId,
        territoryId.includes("-")
          ? territoryId.split("-").slice(0, -1).join("-")
          : "",
        ti
      );
    });

    data.forEach((statement: any, si: number) => {
      // the main statement

      // parse the statement id but keep the order somehow
      const mainStatement: IStatement = {
        id: v4(),
        class: ActantType.Statement,
        data: {
          actions: [
            {
              id: v4(),
              action: statement.id_action_or_relation,
              elvl: Elvl["Textual"],
              certainty: Certainty["Certain"],
              logic: Logic["Positive"],
              mood: [Mood['Indication']],
              moodvariant: MoodVariant["Realis"],
              operator: Operator["And"],
              bundleStart: false,
              bundleEnd: false,
            },
          ],
          territory: {
            id: statement.text_part_id,
            order: si,
          },
          references: [
            {
              id: v4(),
              resource: statement.primary_reference_id,
              part: statement.primary_reference_part,
              type: "P",
            },
            {
              id: v4(),
              resource: statement.secondary_reference_id,
              part: statement.secondary_reference_part,
              type: "S",
            },
          ],
          tags: statement.tags_id.split(" #").filter((t: string) => t),
          text: statement.text,
          props: [],
          actants: [],
        },
        notes: [],
        label: statement.id,
        detail: "",
        language: ["eng"],
        status: ActantStatus["Approved"],
      };

      statement.note && mainStatement.notes.push(statement.note);
      statement.location_text &&
        mainStatement.notes.push(statement.location_text);
      statement.time_note && mainStatement.notes.push(statement.time_note);

      //subject
      processActant(
        mainStatement,
        Position["Subject"],
        statement.id_subject,
        statement.subject_property_type_id,
        statement.subject_property_value_id,
        codingSheet.entities
      );

      // actant1
      processActant(
        mainStatement,
        Position["Actant1"],
        statement.id_actant1,
        statement.actant1_property_type_id,
        statement.actant1_property_value_id,
        codingSheet.entities
      );

      // actant2
      processActant(
        mainStatement,
        Position["Actant2"],
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
          elvl: Elvl["Textual"],
          certainty: Certainty["Certain"],
          logic: Logic["Positive"],
          mood: [Mood['Indication']],
          moodvariant: MoodVariant["Realis"],
          operator: Operator["And"],
          bundleStart: false,
          bundleEnd: false,
          type: {
            id: propActant1Id,
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            virtuality: Virtuality["Certitude"],
            partitivity: Partitivity["Unison"],
          },
          value: {
            id: propActant2Id,
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            virtuality: Virtuality["Certitude"],
            partitivity: Partitivity["Unison"],
          },
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

const checkValidId = (idValue: string) => {
  return (
    idValue &&
    idValue !== "???" &&
    idValue !== "NS" &&
    !idValue.includes("<") &&
    !idValue.includes(">")
  );
};

/***
 * TODO: logical type
 */
const addEntityActant = (id: string, label: string, type: EntityActantType) => {
  const newEntityActant: IEntity = {
    id,
    class: type,
    data: {
      logicalType: EntityLogicalType["Definite"],
    },
    label: label,
    detail: "",
    status: ActantStatus["Approved"],
    language: ["eng"],
    notes: [],
  };
  if (id) {
    actants.push(newEntityActant);
  }
};
const addTerritoryActant = (
  id: string,
  label: string,
  parentId: string | false,
  order: number
) => {
  if (id) {
    if (!actants.some((a) => a.id == id)) {
      const newTerritory: ITerritory = {
        id,
        class: ActantType.Territory,
        data: {
          parent: parentId
            ? {
                id: parentId,
                order: order,
              }
            : false,
        },
        label: label.trim(),
        detail: "",
        status: ActantStatus["Approved"],
        language: ["eng"],
        notes: [],
      };

      actants.push(newTerritory);
    }
  }
};
const addResourceActant = (id: string, label: string) => {
  if (id) {
    const newResource: IResource = {
      id,
      class: ActantType.Resource,
      data: {
        link: "",
      },
      label: label.trim(),
      detail: "",
      status: ActantStatus["Approved"],
      language: ["eng"],
      notes: [],
    };
    actants.push(newResource);
  }
};

// Parsing props in entity tables
const parseEntityPropsInRow = (row: any, territory: string) => {
  const entityProps = Object.keys(row) as Array<keyof string>;

  entityProps.forEach((tableProp: any, tpi: number) => {
    if (Object.keys(propsConfig).includes(tableProp.toString())) {
      // check empty value
      if (row[tableProp]) {
        const propType = propsConfig[tableProp].type;

        // CONCEPT type
        if (propType === "concept") {
          const conceptValueId =
            propsConfig[tableProp].mappingDict?.[row[tableProp]];

          if (conceptValueId) {
            createEmptyPropStatement(
              row.id,
              propsConfig[tableProp].conceptId,
              conceptValueId,
              territory,
              tpi
            );
          }
          // VALUE type
        } else if (propType === "value") {
          const value = row[tableProp];
          const valueId = v4();

          // add actant
          addEntityActant(valueId, value, ActantType.Value);

          // add statement
          createEmptyPropStatement(
            row.id,
            propsConfig[tableProp].conceptId,
            valueId,
            territory,
            tpi
          );
        }
      }
    }
  });
};

/**
 * create simple statement HAS without any props
 */
const createEmptyPropStatement = (
  idSubject: string,
  idActant1: string,
  idActant2: string,
  territory: string,
  order: number
) => {
  if (idSubject && idActant1 && idActant2) {
    const newEmptyStatement: IStatement = {
      id: v4(),
      class: ActantType.Statement,

      label: "",
      data: {
        actions: [
          {
            id: v4(),
            action: "A0093",
            certainty: Certainty["Certain"],
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            mood: [Mood['Indication']],
            moodvariant: MoodVariant["Realis"],
            operator: Operator["And"],
            bundleStart: false,
            bundleEnd: false,
          },
        ],
        territory: {
          id: territory,
          order: order,
        },
        references: [],
        tags: [],
        text: "",
        props: [],
        actants: [
          {
            id: v4(),
            actant: idSubject,
            position: Position["Subject"],
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            virtuality: Virtuality["Reality"],
            partitivity: Partitivity["Unison"],
            operator: Operator["And"],
            bundleStart: false,
            bundleEnd: false,
          },
          {
            id: v4(),
            actant: idActant1,
            position: Position["Actant1"],
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            virtuality: Virtuality["Reality"],
            partitivity: Partitivity["Unison"],
            operator: Operator["And"],
            bundleStart: false,
            bundleEnd: false,
          },
          {
            id: v4(),
            actant: idActant2,
            position: Position["Actant2"],
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            virtuality: Virtuality["Reality"],
            partitivity: Partitivity["Unison"],
            operator: Operator["And"],
            bundleStart: false,
            bundleEnd: false,
          },
        ],
      },
      detail: "",
      status: ActantStatus["Approved"],
      language: ["eng"],
      notes: [],
    };
    actants.push(newEmptyStatement);
  }
};

const addResourceToEntityId = (
  id: string,
  codeSheetResources: { [key: string]: string }
) => {
  const entityId = id[0];

  if (entityId in codeSheetResources) {
    return codeSheetResources[entityId] + "_" + id;
  } else {
    return id;
  }
};

const processLocation = (
  statement: IStatement,
  locationWhereIds: string,
  locationFromIds: string,
  locationToIds: string
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
            certainty: Certainty["Certain"],
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            mood: [Mood['Indication']],
            moodvariant: MoodVariant["Realis"],
            operator: Operator["And"],
            bundleStart: false,
            bundleEnd: false,

            type: {
              id: sameLocationType,
              elvl: Elvl["Textual"],
              logic: Logic["Positive"],
              virtuality: Virtuality["Certitude"],
              partitivity: Partitivity["Unison"],
            },
            value: {
              id: statementLocationId,
              elvl: Elvl["Textual"],
              logic: Logic["Positive"],
              virtuality: Virtuality["Certitude"],
              partitivity: Partitivity["Unison"],
            },
          });
        } else {
          statement.data.props.push({
            id: v4(),
            origin: statement.id,
            elvl: Elvl["Textual"],
            certainty: Certainty["Certain"],
            logic: Logic["Positive"],
            mood: [Mood['Indication']],
            moodvariant: MoodVariant["Realis"],
            operator: Operator["And"],
            bundleStart: false,
            bundleEnd: false,
            type: {
              id: locationType.concept,
              elvl: Elvl["Textual"],
              logic: Logic["Positive"],
              virtuality: Virtuality["Certitude"],
              partitivity: Partitivity["Unison"],
            },
            value: {
              id: locationIdValue,
              elvl: Elvl["Textual"],
              logic: Logic["Positive"],
              virtuality: Virtuality["Certitude"],
              partitivity: Partitivity["Unison"],
            },
          });
        }
      });
    }
  });
};

const processActant = (
  statement: IStatement,
  position: Position,
  actantIdValues: string,
  propActant1Value: string,
  propActant2Value: string,
  codingSheetEntities: { [key: string]: string }
) => {
  if (checkValidId(actantIdValues)) {
    actantIdValues.split(" #").forEach((actantIdValue: string) => {
      // asign elvl and certainty

      let elvl: Elvl = actantIdValue.includes("[")
        ? Elvl["Interpretive"]
        : Elvl["Textual"];

      // remove brackets
      const actantIdClean: string = actantIdValue
        .replace("[", "")
        .replace("]", "");

      // chceck tilda in value and create new actant
      const actantId: string =
        createNewActantIfNeeded(actantIdClean) ||
        addResourceToEntityId(actantIdClean, codingSheetEntities);

      const statementActantId = v4();
      statement.data.actants.push({
        id: statementActantId,
        actant: actantId,
        position: position,
        elvl: elvl,
        logic: Logic["Positive"],
        virtuality: Virtuality["Certitude"],
        partitivity: Partitivity["Unison"],
        operator: Operator["And"],
        bundleStart: false,
        bundleEnd: false,
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
          elvl: Elvl["Textual"],
          certainty: Certainty["Certain"],
          logic: Logic["Positive"],
          mood: [Mood['Indication']],
          moodvariant: MoodVariant["Realis"],
          operator: Operator["And"],
          bundleStart: false,
          bundleEnd: false,

          type: {
            id: propActant1Id,
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            virtuality: Virtuality["Certitude"],
            partitivity: Partitivity["Unison"],
          },
          value: {
            id: propActant2Id,
            elvl: Elvl["Textual"],
            logic: Logic["Positive"],
            virtuality: Virtuality["Certitude"],
            partitivity: Partitivity["Unison"],
          },
        });
      }
    });
  }
};

// add a new actant when the tilda ~ is present in the value and returns id of that new actant - otherwise return false
const createNewActantIfNeeded = (actantValue: string) => {
  if (actantValue.includes("~")) {
    const newActantId = v4();
    const newActantType: string = actantValue.split("~")[1];
    const newActantLabel: string = actantValue.split("~")[2];

    if (["P", "G", "O", "C", "L", "V", "E"].indexOf(newActantType) > -1)
      addEntityActant(
        newActantId,
        newActantLabel,
        newActantType as EntityActantType
      );

    return newActantId;
  } else {
    return false;
  }
};

loadStatementsTables(() => {
  fs.writeFileSync("datasets/all/actants.json", JSON.stringify(actants));
});
