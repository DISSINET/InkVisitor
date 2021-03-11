import React from "react";
import { useQuery } from "react-query";
import api from "api";
import { ITerritory, IResponseTreeTerritoryComponent } from "@shared/types";
import { ButtonGroup, Tag } from "components";

export const TerritoryTreeBox: React.FC = () => {
    const { status, data, error, isFetching } = useQuery(
        "tree",
        async () => {
            const res = await api.treeGet();
            return res.data;
        },
        {}
    );

    const renderTerritoryTag = (label: string, key: string) => {
        return <Tag category="T" label={label} color="#bcd" key={key} />;
    };

    const renderTerritory = (territory: any, children: any, lvl: any) => {
        return (
            <div>
                {renderTerritoryTag(territory.labels[0].value, territory.id)}

                <div style={{ marginLeft: `${5 - lvl}em` }}>
                    {children.map((child: any) =>
                        renderTerritory(
                            child.territory,
                            child.children,
                            child.lvl
                        )
                    )}
                </div>
            </div>
        );
    };

    if (data) {
        console.log(data);
    }

    return (
        <div>
            {data && renderTerritory(data.territory, data.children, data.lvl)}
        </div>
    );
};
