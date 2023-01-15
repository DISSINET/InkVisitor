import LogoInkvisitor from "assets/logos/inkvisitor.svg";
import { Loader } from "components";
import React from "react";
import { useQueryClient } from "react-query";
import { useHistory, useLocation } from "react-router";
import { toast } from "react-toastify";
import { heightHeader } from "Theme/constants";
import { Menu } from "..";
import packageJson from "../../../../package.json";
import {
  StyledFaUserAlt,
  StyledHeader,
  StyledHeaderLogo,
  StyledHeaderTag,
  StyledRightHeader,
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
    const versionText = `v. ${packageJson.version} ${
      ["production", ""].indexOf(env) === -1
        ? `| ${env} | built: ${process.env.BUILD_TIMESTAMP}`
        : ""
    }`;
    const location = useLocation();
    const history = useHistory();

    const queryClient = useQueryClient();

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
        <StyledHeaderTag
          onClick={async () => {
            await navigator.clipboard.writeText(versionText);
            toast.info("Inkvisitor version copied to clipboard");
          }}
        >
          {versionText}
        </StyledHeaderTag>
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
