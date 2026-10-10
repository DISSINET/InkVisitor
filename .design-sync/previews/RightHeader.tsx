import React from "react";
import { Header, RightHeader, UserEnums } from "dissinet.ddb.client";

// RightHeader is the piece of Page's header that carries real props — role,
// name, and fetch state all show up visually, unlike LeftHeader's mostly
// redux-driven half. The sandbox banner above it is env-config only, not a
// prop, so it isn't reachable here.
export const Default = () => (
  <div style={{ width: 460 }}>
    <Header
      paddingY={0}
      paddingX={10}
      color="muni"
      right={
        <RightHeader
          setUserCustomizationOpen={() => {}}
          userId="u-2201"
          userName="Camilla Russo"
          userRole={UserEnums.Role.Editor}
          tempLocation={false}
          setTempLocation={() => {}}
          handleLogOut={() => {}}
        />
      }
    />
  </div>
);

export const OwnerRole = () => (
  <div style={{ width: 460 }}>
    <Header
      paddingY={0}
      paddingX={10}
      color="muni"
      right={
        <RightHeader
          setUserCustomizationOpen={() => {}}
          userId="u-1001"
          userName="Petra Nováková"
          userRole={UserEnums.Role.Owner}
          tempLocation={false}
          setTempLocation={() => {}}
          handleLogOut={() => {}}
        />
      }
    />
  </div>
);

export const FetchingUser = () => (
  <div style={{ width: 460 }}>
    <Header
      paddingY={0}
      paddingX={10}
      color="muni"
      right={
        <RightHeader
          setUserCustomizationOpen={() => {}}
          userId=""
          userName=""
          userRole={UserEnums.Role.Viewer}
          tempLocation={false}
          setTempLocation={() => {}}
          handleLogOut={() => {}}
          userIsFetching
        />
      }
    />
  </div>
);
