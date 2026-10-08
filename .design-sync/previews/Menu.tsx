import React from "react";
import { Header, Menu, UserEnums } from "dissinet.ddb.client";

// Menu opens its item list on pointer hover/enter, tracked as its own
// internal state — no prop drives it, so a static capture only ever shows
// the closed trigger button. userRole only changes what's inside that list
// (Users, Backups, Global validations gated by role), which is unreachable
// here for the same reason. Both cells put the trigger in the colored header
// chrome it needs — textColor="headerTextColor" is invisible on a plain page.
export const Default = () => (
  <div style={{ width: 200 }}>
    <Header
      paddingY={0}
      paddingX={10}
      color="muni"
      right={
        <Menu
          userRole={UserEnums.Role.Editor}
          tempLocation={false}
          setTempLocation={() => {}}
          handleLogOut={() => {}}
          setUserCustomizationOpen={() => {}}
        />
      }
    />
  </div>
);

export const OwnerOnStaging = () => (
  <div style={{ width: 200 }}>
    <Header
      paddingY={0}
      paddingX={10}
      color="staging"
      right={
        <Menu
          userRole={UserEnums.Role.Owner}
          tempLocation="#T0-council-of-trent"
          setTempLocation={() => {}}
          handleLogOut={() => {}}
          setUserCustomizationOpen={() => {}}
        />
      }
    />
  </div>
);
