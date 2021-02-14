import { AuditI } from "./audit";
import { ActionI } from "./action";
import { ActantI } from "./actant";
import { EntityI } from "./entity";
import { LabelI } from "./label";
import { ResponseActantI } from "./response-actant";
import { ResponseActionI } from "./response-action";
import { ResponseStatementI } from "./response-statement";
import { ResponseTerritoryI } from "./response-territory";
import { ResponseUserI } from "./response-user";
import { StatementI } from "./statement";
import { TerritoryI } from "./territory";

import { OptionI } from "./option";

type DictionaryI = OptionI[];

export type {
    AuditI,
    ActionI,
    ActantI,
    EntityI,
    LabelI,
    OptionI,
    DictionaryI,
    StatementI,
    TerritoryI,
    ResponseActantI,
    ResponseActionI,
    ResponseStatementI,
    ResponseTerritoryI,
    ResponseUserI,
};
