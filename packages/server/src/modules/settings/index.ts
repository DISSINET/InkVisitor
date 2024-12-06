import { Router } from "express";
import {
  BadParams,
  InternalServerError,
  ModelNotValidError,
  NotFound,
} from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import { IResponseGeneric } from "@shared/types";
import { IRequest } from "src/custom_typings/request";
import { ISetting, ISettingGroup, SettingsKey } from "@shared/types/settings";
import { Setting } from "@models/setting/setting";
import { SettingGroupDict } from "@shared/dictionaries/settinggroup";

export default Router()
  .get(
    "/group/:groupkey",
    asyncRouteHandler<IResponseGeneric<ISettingGroup>>(
      async (request: IRequest<{ groupkey: string }>) => {
        const groupkey = request.params.groupkey as string;

        if (!groupkey) {
          throw new BadParams("invalid group setting key");
        }
        const dict = [...SettingGroupDict];
        const dictItem = dict.find((item) => item.id === groupkey);
        if (!dictItem) {
          throw new NotFound(`No group with key ${groupkey} found`);
        }

        const settings = await Setting.getSettings(
          request.db.connection,
          dictItem.value
        );

        return {
          result: true,
          data: {
            id: groupkey,
            settings: settings.filter((setting) => !!setting),
          },
        };
      }
    )
  )
  .get(
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
  )
  .put(
    "/:key",
    asyncRouteHandler<IResponseGeneric>(
      async (request: IRequest<{ key: string }>) => {
        const settingKey = request.params.key as unknown as SettingsKey;
        const data = request.body as { value: unknown };

        // not validation, just required data for this operation
        if (
          !settingKey ||
          !data ||
          Object.keys(data).length === 0 ||
          data.value === undefined
        ) {
          throw new BadParams("key and data have to be set");
        }

        await request.db.lock();

        let existing = await Setting.getSetting(
          request.db.connection,
          settingKey
        );

        let result: boolean | undefined = undefined;

        if (!existing) {
          existing = new Setting({
            id: settingKey as unknown as string,
            ...data,
          } as ISetting);
          if (!existing.isValid()) {
            throw new ModelNotValidError("Setting data is not valid");
          }

          result = await existing.save(request.db.connection);
        } else {
          existing.value = data.value;
          if (!existing.isValid()) {
            throw new ModelNotValidError("Setting data is not valid");
          }

          const updateResult = await existing.update(
            request.db.connection,
            data
          );
          result = updateResult?.replaced > 0 || updateResult?.unchanged > 0;
        }

        if (result) {
          return {
            result: true,
          };
        } else {
          throw new InternalServerError(`cannot upsert setting ${settingKey}`);
        }
      }
    )
  );
