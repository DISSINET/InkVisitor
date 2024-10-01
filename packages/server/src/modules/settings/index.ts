import { Router } from "express";
import { BadParams, NotFound } from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import { IResponseGeneric } from "@shared/types";
import { IRequest } from "src/custom_typings/request";
import { ISetting, SettingsKey } from "@shared/types/settings";
import { Setting } from "@models/setting/setting";

export default Router().get(
  "/:key",
  asyncRouteHandler<IResponseGeneric<ISetting>>(
    async (request: IRequest<{ key: SettingsKey }>) => {
      const key = request.params.key as SettingsKey;
      if (
        !key ||
        // @ts-ignore
        !new Setting({ id: key, public: false, value: null }).isValid()
      ) {
        throw new BadParams("invalid settings key");
      }

      const setting = await Setting.getSetting(request.db.connection, key);
      if (!setting || (!request.user && !setting.public)) {
        throw new NotFound("Entry not found");
      }

      return {
        result: true,
        data: setting,
      };
    }
  )
);
