var { loadSheet } = require("./../util/loadsheet");
var { v4 } = require("uuid");
var fs = require("fs");
const { uuid } = require("rethinkdb/ast");

/**
 * waterfall processing
 */
var actants = [];
var actions = [];

var propsConfig = {};

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

    addTerritoryActant("entity-tables", "entity tables", "T0", 0);

    tableTexts.forEach((ti, text) => {
        addTerritoryActant(text.id, text.label, "T0", ti + 1);
    });

    addTerritoryActant(rootTerritory, "everything", false, 0);

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
        addResourceActant(manuscript.id, manuscript.label);
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
     * prepare props config from CONCEPT list
     *  */
    const conceptSheet = entitySheets.find((es) => es.id === "R0010");

    const conceptsData = await loadSheet({
        spread: conceptSheet.spread,
        sheet: conceptSheet.sheet,
    });

    const propsList = {};
    conceptsData.forEach((conceptRow) => {
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

    Object.keys(propsList).forEach((propName) => {
        const propValues = propsList[propName];
        if (propValues.length === 1) {
            propsConfig[propName] = {
                type: "value",
                conceptId: propValues[0].id,
            };
        } else {
            const conceptRow = propValues.find((v) => v.value === "NA");
            if (conceptRow) {
                propsConfig[propName] = {
                    type: "concept",
                    conceptId: conceptRow.id,
                    mappingDict: {},
                };
                propValues.forEach((propValue) => {
                    propsConfig[propName]["mappingDict"][propValue.value] =
                        propValue.id;
                });
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

        addTerritoryActant(
            entitySheetTerritory,
            entitySheet.label,
            "entity-tables",
            esi
        );

        data.forEach((eri, entityRow) => {
            const entityRowTerritory =
                entitySheetTerritory + "_" + entityRow.id;

            addTerritoryActant(
                entityRowTerritory,
                entitySheet.label + "_" + entityRow.id,
                entitySheetTerritory,
                eri
            );

            addEntityActant(
                entitySheet.id + "_" + entityRow.id,
                entityRow.label,
                entitySheet.entityType
            );

            parseEntityPropsInRow(entityRow, entityRowTerritory);
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
        const territoryIds = [
            ...new Set(data.map((s) => s.text_part_id).filter((a) => a)),
        ];

        // add sub-territories
        territoryIds.forEach((ti, territoryId) => {
            addTerritoryActant(
                territoryId,
                territoryId,
                territoryId.includes("-")
                    ? territoryId.split("-").slice(0, -1).join("-")
                    : false,
                ti
            );
        });

        data.forEach((si, statement) => {
            // the main statement

            // parse the statement id but keep the order somehow
            const mainStatement = {
                id: v4(),
                class: "S",
                labels: [
                    {
                        value: statement.id,
                        id: v4(),
                        lang: "en",
                        primary: true,
                    },
                ],
                data: {
                    action: statement.id_action_or_relation,
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
                    tags: statement.tags_id.split(" #").filter((t) => t),
                    certainty: parseInt(statement.certainty) || "1",
                    elvl: parseInt(statement.epistemological_level) || "1",

                    // TODO handle modality
                    modality: parseInt(statement.modality) || "1",
                    text: statement.text,
                    note: `NOTE: ${statement.note}, LOCATION: ${statement.location_text}, TIME: ${statement.time_note}`,
                    props: [],
                    actants: [],
                },
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
                    order: 1,
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
            labels: [
                {
                    id: string,
                    value: label.trim(),
                    lang: "en",
                    primary: true,
                },
            ],
        });
    }
};
const addTerritoryActant = (id, label, parentId, order) => {
    if (id) {
        if (!actants.some((a) => a.id == id)) {
            actants.push({
                id,
                class: "T",
                labels: [
                    {
                        id: v4(),
                        value: label.trim(),
                        lang: "en",
                        primary: true,
                    },
                ],
                data: {
                    parent: {
                        id: parentId,
                        order: order,
                    },
                    type: "",
                    content: "",
                    lang: "1",
                },
            });
        }
    }
};
const addResourceActant = (id, label) => {
    if (id) {
        actants.push({
            id,
            class: "R",
            labels: [
                {
                    id: v4(),
                    value: label.trim(),
                    lang: "en",
                    primary: true,
                },
            ],
            data: {
                link: "",
                type: "1",
                lang: "1",
            },
        });
    }
};

// Parsing props in entity tables
const parseEntityPropsInRow = (row, territory) => {
    Object.keys(row).forEach((tpi, tableProp) => {
        if (Object.keys(propsConfig).includes(tableProp)) {
            // check empty value
            if (row[tableProp]) {
                const propType = propsConfig[tableProp].type;

                // CONCEPT type
                if (propType === "concept") {
                    const conceptValueId =
                        propsConfig[tableProp].mappingDict[row[tableProp]];

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
                    addEntityActant(valueId, value, "V");

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
    idSubject,
    idActant1,
    idActant2,
    territory,
    order
) => {
    if (idSubject && idActant1 && idActant2) {
        actants.push({
            id: v4(),
            class: "S",

            labels: [],
            data: {
                action: "A0093",
                territory: {
                    id: territory,
                    order: order,
                },
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
        actantIdValues.split(" #").forEach((ai, actantIdValue) => {
            // asign elvl and certainty

            let elvl = actantIdValue.includes("[") ? "2" : "1";
            let certainty = "1";

            // remove brackets
            const actantIdClean = actantIdValue
                .replace("[", "")
                .replace("]", "");

            // chceck tilda in value and create new actant
            const actantId =
                createNewActantIfNeeded(actantIdClean) ||
                addResourceToEntityId(actantIdClean, codingSheetEntities);

            const statementActantId = v4();
            statement.actants.push({
                id: statementActantId,
                actant: actantId,
                position: position,
                elvl: elvl,
                certainty: certainty,
            });

            // create a prop if there is one
            if (
                checkValidId(propActant1Value) &&
                checkValidId(propActant2Value)
            ) {
                const propActant1Id =
                    createNewActantIfNeeded(propActant1Value) ||
                    addResourceToEntityId(
                        propActant1Value,
                        codingSheetEntities
                    );

                const propActant2Id =
                    createNewActantIfNeeded(propActant2Value) ||
                    addResourceToEntityId(
                        propActant2Value,
                        codingSheetEntities
                    );

                console.log(propActant1Id);
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
