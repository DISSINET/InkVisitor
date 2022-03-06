var { loadSheet } = require("./loadsheet.js");
var { v4 } = require("uuid");
var fs = require("fs");

import {
  EntityClass,
  EntityStatus,
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
  Language,
} from "../../shared/enums";
import {
  IAction,
  IEntity,
  IStatement,
  ITerritory,
  IResource,
  IStatementActant,
} from "../../shared/types";

import { entityStatusDict } from "../../shared/dictionaries";

/**
 * waterfall processing
 */
var entities: IEntity[] = [];

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
    headerRow: 4,
  });

  /**
   * actions
   */
  tableActions.forEach((action: any) => {
    if (action.label) {
      const statusOption = entityStatusDict.find(
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
              Object.values(EntityClass).forEach((type) => {
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
        class: EntityClass.Action,
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
        },
        status: statusOption
          ? (statusOption.value as EntityStatus)
          : EntityStatus.Pending,
        language:
          action.language === "English" ? Language.English : Language.Latin,
        notes: action.note ? [action.note] : [],
        label: action.label,
        detail: action.detail_incl_valency,
        props: [],
        references: [],
        isTemplate: false,
      };
      entities.push(newAction);
    }
  });

  // parse the table of territories
  const tableTexts = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Texts",
    headerRow: 4,
    validRowFn: (vals: any) => vals.label !== "",
  });

  tableTexts.forEach(
    (
      text: {
        id: string;
        label: string;
        language: Language;
        detail: string;
        note: string;
      },
      ti: number
    ) => {
      addTerritoryEntity(
        text.id,
        text.label,
        rootTerritory,
        ti + 1,
        text.detail,
        text.language,
        text.note ? text.note.split("#") : []
      );
    }
  );

  addTerritoryEntity(rootTerritory, "everything", false, 0);

  type IRowResources = {
    type: string;
    id: string;
    label: string;
    text_id: string;
    spreadsheet_id: string;
    sheet_name: string;
    texts: string[];
    parsing_type: string; // todo
    parsing_entity: string; // todo
    related_text_id: string;
    entity_type: string;
    spread: string;
    sheet: string;
    class_id: string;
  };
  type ICodingSheet = {
    id: string;
    textId: string;
    label: string;
    spread: string;
    sheet: string;
    entities: { [key: string]: string };
  };

  // parse resources
  const tableManuscripts = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Manuscripts",
    headerRow: 4,
  });

  tableManuscripts.forEach((manuscript: { id: string; label: string }) => {
    // parse as objects #629
    //addResourceActant(manuscript.id, manuscript.label);
    addEntity(manuscript.id, manuscript.label, EntityClass.Object);
  });

  const tableResources: IRowResources[] = await loadSheet({
    spread: "13eVorFf7J9R8YzO7TmJRVLzIIwRJS737r7eFbH1boyE",
    sheet: "Resources",
    headerRow: 4,
  });

  // add resources
  tableResources.forEach((resource: { id: string; label: string }) => {
    // parse as objects #629
    addResourceActant(resource.id, resource.label);
  });

  const entitySheets = tableResources
    .filter((row) => row["parsing_type"] === "entity-table")
    .filter((row) => row["spreadsheet_id"])
    .map((row) => {
      return {
        id: row["id"],
        texts: row["related_text_id"].split(" #"),
        label: row["label"],
        entityType: row["parsing_entity"],
        spread: row["spreadsheet_id"],
        sheet: row["sheet_name"],
      };
    });

  const codingSheets: ICodingSheet[] = tableResources
    .filter((row) => row["parsing_type"] === "coding-sheet") // coding sheet
    .map((row) => {
      const relTextId = row["related_text_id"];
      const relEntitySheets = entitySheets.filter((es) => {
        return es.texts.includes(relTextId) || es.texts.includes("*");
      });
      const relEntityDict: { [key: string]: string } = {};
      relEntitySheets.forEach((res) => {
        relEntityDict[res.entityType] = res.id;
      });

      return {
        id: row["id"],
        textId: row["text_id"],
        label: row["label"],
        spread: row["spreadsheet_id"],
        sheet: row["sheet_name"],
        entities: relEntityDict,
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
        headerRow: 4,
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

    if (propValues.length !== -1) {
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
      headerRow: 4,
    });
    //console.log(entitySheet);

    const entitySheetTerritory = "T_" + entitySheet.id;

    data
      .filter((er: any) => er.label)
      .forEach((entityRow: any, eri: number) => {
        addEntity(
          entitySheet.id + "_" + entityRow.id,
          entityRow.label,
          entitySheet.entityType as EntityClass
        );

        parseEntityPropsInRow(entityRow);
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
    if (csi === 0) {
      const codingSheet = codingSheets[csi];

      const data = await loadSheet({
        spread: codingSheet["spread"],
        sheet: codingSheet["sheet"],
        headerRow: 1,
        validRowFn: (a: any, ai: number) =>
          ai != 0 && a && (a["text"] || a["id"]),
      });

      //console.log(data);
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
        console.log(territoryId);
        addTerritoryEntity(
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

        // parse the statement id but keep the order somehow sorted
        const mainStatement: IStatement = {
          id: v4(),
          class: EntityClass.Statement,
          props: [],
          data: {
            actions: [
              {
                id: v4(),
                action: statement.id_action_or_relation,
                elvl: Elvl.Textual,
                certainty: Certainty.Empty,
                logic: Logic.Positive,
                mood: [Mood.Indication],
                moodvariant: MoodVariant.Realis,
                bundleOperator: Operator.And,
                bundleStart: false,
                bundleEnd: false,
                props: [],
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
            actants: [],
          },
          notes: [],
          label: statement.id,
          detail: "",
          language: Language.Latin,
          status: EntityStatus.Approved,
          references: [],
          isTemplate: false,
        };

        statement.note && mainStatement.notes.push(statement.note);
        statement.location_text &&
          mainStatement.notes.push(statement.location_text);
        statement.time_note && mainStatement.notes.push(statement.time_note);

        //subject
        processActant(
          mainStatement,
          Position.Subject,
          statement.id_subject,
          statement.subject_property_type_id,
          statement.subject_property_value_id,
          codingSheet.entities
        );

        // actant1
        processActant(
          mainStatement,
          Position.Actant1,
          statement.id_actant1,
          statement.actant1_property_type_id,
          statement.actant1_property_value_id,
          codingSheet.entities
        );

        // actant2
        processActant(
          mainStatement,
          Position.Actant2,
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

          mainStatement.data.actions[0].props.push({
            id: v4(),
            elvl: Elvl.Textual,
            certainty: Certainty.Empty,
            logic: Logic.Positive,
            mood: [Mood.Indication],
            moodvariant: MoodVariant.Realis,
            bundleOperator: Operator.And,
            bundleStart: false,
            bundleEnd: false,

            children: [],
            type: {
              id: propActant1Id,
              elvl: Elvl.Textual,
              logic: Logic.Positive,
              virtuality: Virtuality.Reality,
              partitivity: Partitivity.Unison,
            },
            value: {
              id: propActant2Id,
              elvl: Elvl.Textual,
              logic: Logic.Positive,
              virtuality: Virtuality.Reality,
              partitivity: Partitivity.Unison,
            },
          });
        }

        /**
         * TODO
         * Time
         * Location
         */

        entities.push(mainStatement);
      });
    }
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
const addEntity = (id: string, label: string, type: EntityClass) => {
  const newEntity: IEntity | IEntity = {
    id,
    class: type,
    data:
      type === EntityClass.Concept
        ? {
            status: EntityStatus.Approved,
          }
        : {
            logicalType: EntityLogicalType.Definite,
          },
    label: label,
    detail: "",
    language: Language.Latin,
    notes: [],
    props: [],
    references: [],
    status: EntityStatus.Approved,
    isTemplate: false,
  };
  if (id) {
    entities.push(newEntity);
  }
};
const addTerritoryEntity = (
  id: string,
  label: string,
  parentId: string | false,
  order: number,
  detail: string = "",
  language: string = "Latin",
  notes: string[] = []
) => {
  if (id) {
    if (!entities.some((a) => a.id == id)) {
      const newTerritory: ITerritory = {
        id,
        class: EntityClass.Territory,
        data: {
          parent: parentId
            ? {
                id: parentId,
                order: order,
              }
            : false,
        },
        label: label.trim(),
        detail: detail,
        status: EntityStatus.Approved,
        // @ts-ignore
        language: Language[language] as Language,
        notes: notes,
        props: [],
        references: [],
        isTemplate: false,
      };

      entities.push(newTerritory);
    }
  }
};
const addResourceActant = (id: string, label: string) => {
  if (id) {
    const newResource: IResource = {
      id,
      class: EntityClass.Resource,
      data: {
        link: "",
      },
      label: label.trim(),
      detail: "",
      language: Language.Latin,
      notes: [],
      props: [],
      status: EntityStatus.Approved,
      references: [],
      isTemplate: false,
    };
    entities.push(newResource);
  }
};

// Parsing props in entity tables
const parseEntityPropsInRow = (row: any) => {
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
            // createEmptyPropStatement(
            //   row.id,
            //   propsConfig[tableProp].conceptId,
            //   conceptValueId,
            //   territory,
            //   tpi
            // );
          }
          // VALUE type
        } else if (propType === "value") {
          const value = row[tableProp];
          const valueId = v4();

          // add actant
          addEntity(valueId, value, EntityClass.Value);

          // add statement
          // createEmptyPropStatement(
          //   row.id,
          //   propsConfig[tableProp].conceptId,
          //   valueId,
          //   territory,
          //   tpi
          // );
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
      class: EntityClass.Statement,
      props: [],
      label: "",
      data: {
        actions: [
          {
            id: v4(),
            action: "A0093",
            certainty: Certainty.Empty,
            elvl: Elvl.Textual,
            logic: Logic.Positive,
            mood: [Mood.Indication],
            moodvariant: MoodVariant.Realis,
            bundleOperator: Operator.And,
            bundleStart: false,
            bundleEnd: false,
            props: [],
          },
        ],
        territory: {
          id: territory,
          order: order,
        },
        references: [],
        tags: [],
        text: "",
        actants: [
          {
            id: v4(),
            actant: idSubject,
            position: Position.Subject,
            elvl: Elvl.Inferential,
            logic: Logic.Positive,
            virtuality: Virtuality.Reality,
            partitivity: Partitivity.Unison,
            bundleOperator: Operator.And,
            bundleStart: false,
            bundleEnd: false,
            props: [],
          },
          {
            id: v4(),
            actant: idActant1,
            position: Position.Actant1,
            elvl: Elvl.Inferential,
            logic: Logic.Positive,
            virtuality: Virtuality.Reality,
            partitivity: Partitivity.Unison,
            bundleOperator: Operator.And,
            bundleStart: false,
            bundleEnd: false,
            props: [],
          },
          {
            id: v4(),
            actant: idActant2,
            position: Position.Actant2,
            elvl: Elvl.Inferential,
            logic: Logic.Positive,
            virtuality: Virtuality.Reality,
            partitivity: Partitivity.Unison,
            bundleOperator: Operator.And,
            bundleStart: false,
            bundleEnd: false,
            props: [],
          },
        ],
      },
      detail: "",
      language: Language.Latin,
      notes: [],
      status: EntityStatus.Approved,
      references: [],
      isTemplate: false,
    };
    entities.push(newEmptyStatement);
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
          statement.data.actions[0].props.push({
            id: v4(),
            certainty: Certainty.Empty,
            elvl: Elvl.Textual,
            logic: Logic.Positive,
            mood: [Mood.Indication],
            moodvariant: MoodVariant.Realis,
            bundleOperator: Operator.And,
            bundleStart: false,
            bundleEnd: false,

            children: [],

            type: {
              id: sameLocationType,
              elvl: Elvl.Textual,
              logic: Logic.Positive,
              virtuality: Virtuality.Reality,
              partitivity: Partitivity.Unison,
            },
            value: {
              id: statementLocationId,
              elvl: Elvl.Textual,
              logic: Logic.Positive,
              virtuality: Virtuality.Reality,
              partitivity: Partitivity.Unison,
            },
          });
        } else {
          statement.data.actions[0].props.push({
            id: v4(),
            elvl: Elvl.Textual,
            certainty: Certainty.Empty,
            logic: Logic.Positive,
            mood: [Mood.Indication],
            moodvariant: MoodVariant.Realis,
            bundleOperator: Operator.And,
            bundleStart: false,
            bundleEnd: false,

            children: [],
            type: {
              id: locationType.concept,
              elvl: Elvl.Textual,
              logic: Logic.Positive,
              virtuality: Virtuality.Reality,
              partitivity: Partitivity.Unison,
            },
            value: {
              id: locationIdValue,
              elvl: Elvl.Textual,
              logic: Logic.Positive,
              virtuality: Virtuality.Reality,
              partitivity: Partitivity.Unison,
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
        : Elvl.Textual;

      // remove brackets
      const actantIdClean: string = actantIdValue
        .replace("[", "")
        .replace("]", "");

      // chceck tilda in value and create new actant
      const actantId: string =
        createNewActantIfNeeded(actantIdClean) ||
        addResourceToEntityId(actantIdClean, codingSheetEntities);

      const statementActantId = v4();

      const actant: IStatementActant = {
        id: statementActantId,
        actant: actantId,
        position: position,
        elvl: elvl,
        logic: Logic.Positive,
        virtuality: Virtuality.Reality,
        partitivity: Partitivity.Unison,
        bundleOperator: Operator.And,
        bundleStart: false,
        bundleEnd: false,
        props: [],
      };

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
        actant.props.push({
          id: v4(),
          elvl: Elvl.Textual,
          certainty: Certainty.Empty,
          logic: Logic.Positive,
          mood: [Mood.Indication],
          moodvariant: MoodVariant.Realis,
          bundleOperator: Operator.And,
          bundleStart: false,
          bundleEnd: false,

          children: [],

          type: {
            id: propActant1Id,
            elvl: Elvl.Textual,
            logic: Logic.Positive,
            virtuality: Virtuality.Reality,
            partitivity: Partitivity.Unison,
          },
          value: {
            id: propActant2Id,
            elvl: Elvl.Textual,
            logic: Logic.Positive,
            virtuality: Virtuality.Reality,
            partitivity: Partitivity.Unison,
          },
        });
      }

      statement.data.actants.push(actant);
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
      addEntity(newActantId, newActantLabel, newActantType as EntityClass);

    return newActantId;
  } else {
    return false;
  }
};

loadStatementsTables(() => {
  console.log(entities.length);
  fs.writeFileSync("datasets/all/entities.json", JSON.stringify(entities));
});
