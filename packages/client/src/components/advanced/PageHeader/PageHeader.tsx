import { useQueryClient } from "@tanstack/react-query";
import { heightHeader } from "Theme/constants";
import { PingColor } from "Theme/theme";
import LogoInkvisitor from "assets/logos/inkvisitor.svg";
import { Loader } from "components";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { BeatLoader } from "react-spinners";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
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
  StyledSandboxText,
  StyledSpace,
  StyledText,
  StyledUser,
  StyledUsername,
} from "./PageHeaderStyles";

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
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const ping: number = useAppSelector((state) => state.ping);

    const [pingColor, setPingColor] = useState<keyof PingColor>("0");
    const [waitingForServerRestart, setWaitingForServerRestart] =
      useState(false);

    useEffect(() => {
      if ((ping === -1 || ping === -2) && !waitingForServerRestart) {
        setWaitingForServerRestart(true);
      } else if (ping >= 0 && waitingForServerRestart) {
        queryClient.invalidateQueries();
        setWaitingForServerRestart(false);
      }

      switch (true) {
        case ping === -2:
          setPingColor("-2");
          return;
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
              navigate({
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
              {ping === -10 && "loading"}
              {ping === -2 && "Connection to server failed"}
              {ping === -1 && "Server is down"}
              {ping >= 0 && `Server connection latency:`}
            </StyledPingText>
            {ping === -10 && (
              <BeatLoader
                size={6}
                margin={4}
                style={{ marginLeft: "0.3rem", marginTop: "0.1rem" }}
                color="white"
              />
            )}
            {ping >= -2 && <StyledPingColor pingColor={pingColor} />}
            {ping >= 0 && <StyledPingText>{ping}ms</StyledPingText>}
          </StyledFlexRow>
        </StyledFlexColumn>
      </StyledHeader>
    );
  }
);

interface RightHeader {
  setUserCustomizationOpen: (arg0: boolean) => void;
  userName: string;
  userRole: string;
  tempLocation: string | false;
  setTempLocation: React.Dispatch<React.SetStateAction<string | false>>;
  handleLogOut: () => void;
}

export const RightHeader: React.FC<RightHeader> = React.memo(
  ({
    setUserCustomizationOpen,
    userName,
    userRole,
    tempLocation,
    setTempLocation,
    handleLogOut,
  }) => {
    const env = (process.env.ROOT_URL || "").replace(
      /apps\/inkvisitor[-]?/,
      ""
    );

    return (
      <>
        {env === "sandbox" && (
          <>
            <StyledSandboxText>
              {
                "This is a sandbox version of InkVisitor, to be used for testing only. Do not store important data here; your data stored here can be deleted without previous notice."
              }
            </StyledSandboxText>
            <StyledSpace />
          </>
        )}
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
      </>
    );
  }
);
