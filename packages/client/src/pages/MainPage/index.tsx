import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Entities } from "types";

import { toast } from "react-toastify";

import { Box, Button, Footer, Header, Toast } from "components";

import {
    ActantSearchBox,
    ActantDetailBox,
    ActantSuggester,
    ActionModal,
    ActantBookmarkBox,
    StatementEditorBox,
    StatementListBox,
    TerritoryTreeBox,
    UserAdministrationModal,
    UserOptionsModal,
} from "./containers";
import { useHistory, useParams } from "react-router-dom";
import api from "../../api/api";

interface MainPage {
    size: number[];
}

const initTerritory = "T40-02-07";

const MainPage: React.FC<MainPage> = ({ size }) => {
    const history = useHistory();
    const { territoryId, statementId } = useParams<{
        territoryId: string;
        statementId: string;
    }>();

    const heightHeader = 70;
    const heightFooter = 30;
    const heightContent = size[1] - heightHeader - heightFooter;

    return (
        <>
            <Header
                height={heightHeader}
                paddingY={0}
                paddingX={10}
                left={<div className="text-4xl">InkVisitor</div>}
                right={
                    <div className="flex">
                        {/* {user ? (
                            <>
                                <div className="text-sm inline m-2">
                                    logged as {api.getUser().name}
                                </div>
                                <Button
                                    label="Log Out"
                                    color="danger"
                                    onClick={() => null}
                                />
                            </>
                        ) : (
                            <Button
                                label="Log In"
                                color="info"
                                onClick={() => null}
                            />
                        )} */}
                    </div>
                }
            />
            <DndProvider backend={HTML5Backend}>
                <div className="flex">
                    <Box
                        height={heightContent}
                        width={200}
                        label={"Territories"}
                    >
                        <TerritoryTreeBox />
                    </Box>
                    <Box
                        height={heightContent}
                        width={650}
                        label={"Statements"}
                    >
                        <StatementListBox />
                    </Box>
                    <div className="flex flex-col">
                        <Box
                            height={heightContent - 400}
                            width={720}
                            label={"Editor"}
                        >
                            <StatementEditorBox />
                        </Box>
                        <Box height={400} width={720} label={"Detail"}>
                            <ActantDetailBox />
                        </Box>
                    </div>
                    <div className="flex flex-col">
                        <Box height={400} width={350} label={"Search"}>
                            <ActantSearchBox />
                        </Box>
                        <Box
                            height={heightContent - 400}
                            width={350}
                            label={"Bookmarks"}
                        >
                            <ActantBookmarkBox />
                        </Box>
                    </div>
                </div>
            </DndProvider>

            <Toast />
            <Footer height={heightFooter} />
        </>
    );
};
