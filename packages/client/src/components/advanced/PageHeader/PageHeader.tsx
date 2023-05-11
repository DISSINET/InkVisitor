import LogoInkvisitor from "assets/logos/inkvisitor.svg";
import { Loader } from "components";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { useHistory, useLocation } from "react-router";
import { toast } from "react-toastify";
import { heightHeader } from "Theme/constants";
import { Menu } from "..";
import packageJson from "../../../../package.json";
import {
  StyledFaUserAlt,
  StyledFlexColumn,
  StyledFlexRow,
  StyledHeader,
  StyledHeaderLogo,
  StyledHeaderTag,
  StyledPingColor,
  StyledPingText,
  StyledRightHeader,
  StyledText,
  StyledUser,
  StyledUsername,
} from "./PageHeaderStyles";
import { useAppSelector } from "redux/hooks";
import { PingColor } from "Theme/theme";

interface LeftHeader {
  tempLocation: string | false;
}
export const LeftHeader: React.FC<LeftHeader> = React.memo(
  ({ tempLocation }) => {
    const env = (process.env.ROOT_URL || "").replace(
      /apps\/inkvisitor[-]?/,
      ""
    );
    const versionText = `v. ${packageJson.version}${
      env ? ` | ${env}` : ``
    } | built: ${process.env.BUILD_TIMESTAMP}`;
    const location = useLocation();
    const history = useHistory();

    const queryClient = useQueryClient();

    const ping: number = useAppSelector((state) => state.ping);

    const [pingColor, setPingColor] = useState<keyof PingColor>("0");

    useEffect(() => {
      switch (true) {
        case ping === -1:
          setPingColor("-1");
          return;
        case ping < 100:
          setPingColor("5");
          return;
        case ping < 200:
          setPingColor("4");
          return;
        case ping < 300:
          setPingColor("3");
          return;
        case ping < 500:
          setPingColor("2");
          return;
        case ping < 1000:
          setPingColor("1");
          return;
        case ping > 1000:
          setPingColor("0");
          return;
      }
    }, [ping]);

    return (
      <StyledHeader>
        <StyledHeaderLogo
          height={heightHeader - 10}
          src={LogoInkvisitor}
          alt="Inkvisitor Logo"
          onClick={async () => {
            if (location.pathname !== "/") {
              history.push({
                pathname: "/",
                hash: tempLocation ? tempLocation : "",
              });
            } else {
              queryClient.invalidateQueries();
            }
          }}
        />
        <StyledFlexColumn>
          <StyledHeaderTag
            onClick={async () => {
              await navigator.clipboard.writeText(versionText);
              toast.info("Inkvisitor version copied to clipboard");
            }}
          >
            {versionText}
          </StyledHeaderTag>
          <StyledFlexRow>
            <StyledPingText style={{ marginLeft: "0.3rem" }}>
              {ping > -1 ? `Server connection latency:` : "Server is down"}
            </StyledPingText>
            <StyledPingColor pingColor={pingColor} />
            {ping > -1 && <StyledPingText>{ping}ms</StyledPingText>}
          </StyledFlexRow>
        </StyledFlexColumn>
      </StyledHeader>
    );
  }
);

interface RightHeaderProps {
  setUserCustomizationOpen: (arg0: boolean) => void;
  userName: string;
  userRole: string;
  tempLocation: string | false;
  setTempLocation: React.Dispatch<React.SetStateAction<string | false>>;
  handleLogOut: () => void;
}

export const RightHeader: React.FC<RightHeaderProps> = React.memo(
  ({
    setUserCustomizationOpen,
    userName,
    userRole,
    tempLocation,
    setTempLocation,
    handleLogOut,
  }) => {
    return (
      <StyledRightHeader>
        {userName.length > 0 ? (
          <StyledUser>
            <StyledText>logged as</StyledText>
            <StyledFaUserAlt
              size={14}
              onClick={() => setUserCustomizationOpen(true)}
            />
            <StyledUsername onClick={() => setUserCustomizationOpen(true)}>
              {userName}
            </StyledUsername>
          </StyledUser>
        ) : (
          <div
            style={{
              height: "1rem",
              width: "1rem",
              position: "relative",
              marginRight: "2rem",
            }}
          >
            <Loader size={10} show />
          </div>
        )}
        <Menu
          userRole={userRole}
          tempLocation={tempLocation}
          setTempLocation={setTempLocation}
          handleLogOut={handleLogOut}
        />
      </StyledRightHeader>
    );
  }
);
