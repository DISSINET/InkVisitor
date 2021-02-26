import { IAudit } from "./audit";
import { IAction } from "./action";
import { IActant } from "./actant";
import { IEntity } from "./entity";
import { ILabel } from "./label";
import { IProp } from "./prop";
import { IUser } from "./user";
import { IResource } from "./resource";
import { IResponseDetail } from "./response-detail";
import { IResponseBookmarks } from "./response-bookmarks";
import { IResponseAdministration } from "./response-administration";
import { IResponseActant } from "./response-actant";
import { IResponseAction } from "./response-action";
import { IResponseStatement } from "./response-statement";
import { IResponseTree } from "./response-tree";
import { IResponseTerritory } from "./response-territory";
import { IResponseUser } from "./response-user";
import { IStatement } from "./statement";
import { ITerritory } from "./territory";
import { IOption } from "./option";

type IDictionary = IOption[];

export type {
    IAudit,
    IAction,
    IActant,
    IEntity,
    IDictionary,
    ILabel,
    IOption,
    IStatement,
    ITerritory,
    IProp,
    IUser,
    IResource,
    IResponseActant,
    IResponseAction,
    IResponseDetail,
    IResponseBookmarks,
    IResponseAdministration,
    IResponseStatement,
    IResponseTerritory,
    IResponseTree,
    IResponseUser,
};
