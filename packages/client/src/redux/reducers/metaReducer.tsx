import { FETCH_META, MetaAction } from "redux/types";
import { ResponseMetaI } from "@shared/types/response-meta";

const initialState: ResponseMetaI = {
  actions: [],
};

const meta = (
  state: ResponseMetaI = initialState,
  action: MetaAction
): ResponseMetaI => {
  switch (action.type) {
    case FETCH_META:
      return action.payload;
    default:
      return state;
  }
};

export default meta;
