import { InterfaceEnums, UserEnums } from "@inkvisitor/shared/enums";
import { getAppEnv } from "utils/appEnv";
import { useQueryClient } from "@tanstack/react-query";
import { heightHeader } from "Theme/constants";
import { PingColor } from "Theme/theme";
import api, { HTML_CAPTURE_EVENT, HTML_CAPTURE_STORAGE_KEY, IDbStats } from "api";
import LogoInkvisitor from "assets/logos/inkvisitor.svg";
import { Button, Loader } from "components";
import React, { useEffect, useRef, useState } from "react";
import { PiSealCheckFill } from "react-icons/pi";
import { useLocation, useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import { toast } from "react-toastify";
import { setTheme } from "redux/features/themeSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { IcoDarkMode, IcoLightMode } from "Theme/icons";
import { ButtonSize } from "types";
import { getUserIcon } from "utils/iconUtils";
import { GlobalValidationsModal, Menu, UserTag } from "..";
import packageJson from "../../../../package.json";
import { UserTagSize } from "../UserTag/utils";
import {
  StyledFlexColumn,
  StyledGlobalValidationsWrap,
  StyledFlexRow,
  StyledHeader,
  StyledHeaderLogo,
  StyledHeaderTag,
  StyledHtmlCaptureActions,
  StyledHtmlCaptureIcon,
  StyledHtmlCapturePanel,
  StyledHtmlCapturePre,
  StyledHtmlCaptureText,
  StyledHtmlCaptureWrap,
  StyledLoggedAsWrap,
  StyledMenu,
  StyledPingColor,
  StyledPingText,
  StyledRightHeader,
  StyledSandboxText,
  StyledSpace,
  StyledStatsHeading,
  StyledStatsPanel,
  StyledStatsRow,
  StyledStatsWrap,
  StyledThemeSwitcherWrap,
  StyledUser,
  StyledUserIconWrap,
  StyledUsername,
} from "./PageHeaderStyles";

interface LeftHeader {
  tempLocation: string | false;
}
export const LeftHeader: React.FC<LeftHeader> = React.memo(({ tempLocation }) => {
  const env = getAppEnv();

  const versionText = `v. ${packageJson.version}${env ? ` | ${env}` : ``} | build: ${
    process.env.BUILD_TIMESTAMP
  }`;

  const location = useLocation();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const ping: number = useAppSelector((state) => state.ping);

  const [pingColor, setPingColor] = useState<keyof PingColor>("0");
  const [waitingForServerRestart, setWaitingForServerRestart] = useState(false);

  const [statsOpen, setStatsOpen] = useState(false);
  const [dbStats, setDbStats] = useState<IDbStats | null>(api.getDbStats());
  const statsWrapRef = useRef<HTMLDivElement | null>(null);

  // Diagnostic captures of "Server returned HTML instead of JSON" (written by the
  // api response interceptor). The warning icon below only renders when present.
  const [htmlCaptures, setHtmlCaptures] = useState<any[] | null>(null);
  const [htmlCapturesOpen, setHtmlCapturesOpen] = useState(false);
  const htmlCapturesWrapRef = useRef<HTMLDivElement | null>(null);

  // Poll lightly until the first sample arrives (only privileged sockets ever
  // receive one). Until it does, the popup trigger stays inert.
  useEffect(() => {
    if (dbStats) return;
    const interval = setInterval(() => {
      const next = api.getDbStats();
      if (next) setDbStats(next);
    }, 2000);
    return () => clearInterval(interval);
  }, [dbStats]);

  useEffect(() => {
    if (!statsOpen) return;
    const tick = () => setDbStats(api.getDbStats());
    tick();
    const interval = setInterval(tick, 2000);
    const onDocClick = (e: MouseEvent) => {
      if (!statsWrapRef.current?.contains(e.target as Node)) {
        setStatsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [statsOpen]);

  // Load captured diagnostics on mount and whenever one is written (same-tab
  // custom event) or changed in another tab (native "storage" event).
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem(HTML_CAPTURE_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        setHtmlCaptures(Array.isArray(parsed) && parsed.length ? parsed : null);
      } catch {
        setHtmlCaptures(null);
      }
    };
    refresh();
    window.addEventListener(HTML_CAPTURE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(HTML_CAPTURE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (!htmlCapturesOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!htmlCapturesWrapRef.current?.contains(e.target as Node)) {
        setHtmlCapturesOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [htmlCapturesOpen]);

  const handleCopyHtmlCaptures = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(htmlCaptures, null, 2));
      toast.info("Diagnostic copied — please send it to support");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleClearHtmlCaptures = () => {
    try {
      localStorage.removeItem(HTML_CAPTURE_STORAGE_KEY);
    } catch {
      // ignore — clearing state below is what matters for the UI
    }
    setHtmlCaptures(null);
    setHtmlCapturesOpen(false);
  };

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
              style={{
                marginLeft: "0.3rem",
                marginTop: "0.1rem",
              }}
              color="white"
            />
          )}
          {ping >= -2 && (
            <StyledStatsWrap ref={statsWrapRef}>
              <StyledPingColor
                $pingColor={pingColor}
                $clickable={!!dbStats}
                title={dbStats ? "Click to show DB pool / mutex stats" : ""}
                onClick={dbStats ? () => setStatsOpen((v) => !v) : undefined}
              />
              {statsOpen && dbStats && (
                <StyledStatsPanel>
                  <StyledStatsHeading>pool</StyledStatsHeading>
                  <StyledStatsRow>
                    <span>borrowed</span>
                    <span>
                      {dbStats.pool.borrowed} / {dbStats.pool.max}
                    </span>
                  </StyledStatsRow>
                  <StyledStatsRow>
                    <span>available</span>
                    <span>{dbStats.pool.available}</span>
                  </StyledStatsRow>
                  <StyledStatsRow>
                    <span>pending</span>
                    <span>{dbStats.pool.pending}</span>
                  </StyledStatsRow>
                  <StyledStatsHeading>mutex</StyledStatsHeading>
                  <StyledStatsRow>
                    <span>locked</span>
                    <span>{dbStats.mutex.locked ? "yes" : "no"}</span>
                  </StyledStatsRow>
                  <StyledStatsRow>
                    <span>queue</span>
                    <span>{dbStats.mutex.queue}</span>
                  </StyledStatsRow>
                </StyledStatsPanel>
              )}
            </StyledStatsWrap>
          )}
          {ping >= 0 && <StyledPingText>{ping}ms</StyledPingText>}

          {htmlCaptures && (
            <StyledHtmlCaptureWrap ref={htmlCapturesWrapRef}>
              <StyledHtmlCaptureIcon
                size={18}
                title="A server response error was captured — click for details"
                onClick={() => setHtmlCapturesOpen((v) => !v)}
              />
              {htmlCapturesOpen && (
                <StyledHtmlCapturePanel>
                  <StyledHtmlCaptureText>
                    <strong>{htmlCaptures.length}</strong> server response problem
                    {htmlCaptures.length > 1 ? "s were" : " was"} captured (the server returned HTML
                    instead of JSON). Please{" "}
                    <strong>copy the details below and send them to support</strong> so the issue
                    can be diagnosed.
                  </StyledHtmlCaptureText>
                  <StyledHtmlCapturePre>
                    {JSON.stringify(htmlCaptures, null, 2)}
                  </StyledHtmlCapturePre>
                  <StyledHtmlCaptureActions>
                    <Button label="Copy" color="primary" onClick={handleCopyHtmlCaptures} />
                    <Button label="Clear" color="danger" onClick={handleClearHtmlCaptures} />
                  </StyledHtmlCaptureActions>
                </StyledHtmlCapturePanel>
              )}
            </StyledHtmlCaptureWrap>
          )}
        </StyledFlexRow>
      </StyledFlexColumn>
    </StyledHeader>
  );
});

interface RightHeader {
  setUserCustomizationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userName: string;
  userId: string;
  userRole: UserEnums.Role;
  tempLocation: string | false;
  setTempLocation: React.Dispatch<React.SetStateAction<string | false>>;
  handleLogOut: () => void;
  userIsFetching?: boolean;
}

export const RightHeader: React.FC<RightHeader> = React.memo(
  ({
    setUserCustomizationOpen,
    userId,
    userName,
    userRole,
    tempLocation,
    setTempLocation,
    handleLogOut,
    userIsFetching = false,
  }) => {
    const env = getAppEnv();

    const dispatch = useAppDispatch();
    const selectedThemeId: InterfaceEnums.Theme = useAppSelector((state) => state.theme);

    const handleThemeChange = (newTheme: InterfaceEnums.Theme) => {
      dispatch(setTheme(newTheme));
      localStorage.setItem("theme", newTheme);
    };
    const isDarkTheme = selectedThemeId === InterfaceEnums.Theme.Dark;

    const usernameLoaded = userName.length > 0;

    const [showGlobalValidations, setShowGlobalValidations] = useState(false);

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
          <StyledThemeSwitcherWrap>
            {/* the icon shows the theme the click switches to, not the current one */}
            <Button
              icon={isDarkTheme ? <IcoLightMode size={20} /> : <IcoDarkMode size={20} />}
              tooltipLabel={isDarkTheme ? "switch to light mode" : "switch to dark mode"}
              shape="circle"
              size={ButtonSize.Large}
              noBackground
              noBorder
              textColor="headerTextColor"
              tooltipPortalId="page"
              onClick={() =>
                handleThemeChange(
                  isDarkTheme ? InterfaceEnums.Theme.Light : InterfaceEnums.Theme.Dark,
                )
              }
            />
          </StyledThemeSwitcherWrap>

          {userRole === UserEnums.Role.Owner && (
            <StyledGlobalValidationsWrap>
              <Button
                shape="rounded-md"
                size={ButtonSize.Large}
                label="global validations"
                icon={<PiSealCheckFill size={14} />}
                onClick={() => setShowGlobalValidations(true)}
                noBackground
                textColor="headerTextColor"
                borderColor="headerChromeColor"
              />
            </StyledGlobalValidationsWrap>
          )}

          <StyledLoggedAsWrap>
            {userName.length > 0 && (
              <StyledUser>
                <StyledUserIconWrap onClick={() => setUserCustomizationOpen(true)}>
                  {getUserIcon(userRole, UserTagSize.Medium)}
                </StyledUserIconWrap>
                <StyledUsername onClick={() => setUserCustomizationOpen(true)}>
                  {userName}
                </StyledUsername>
              </StyledUser>
            )}

            {userIsFetching && !usernameLoaded && (
              <Loader size={16} show noBackground color={"headerTextColor"} />
            )}
          </StyledLoggedAsWrap>

          <StyledMenu>
            <Menu
              userRole={userRole}
              tempLocation={tempLocation}
              setTempLocation={setTempLocation}
              handleLogOut={handleLogOut}
              setUserCustomizationOpen={setUserCustomizationOpen}
            />
          </StyledMenu>
        </StyledRightHeader>

        {showGlobalValidations && (
          <GlobalValidationsModal setShowGlobalValidations={setShowGlobalValidations} />
        )}
      </>
    );
  },
);
