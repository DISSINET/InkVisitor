import React, { useState, useLayoutEffect } from "react";
import { Switch, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import theme from "./Theme/theme";
import "app.css";
import MainPage from "./pages/MainPage";
import GlobalStyle from "Theme/global";

import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

const queryClient = new QueryClient();

interface AppProps {}
export const App: React.FC<AppProps> = () => {
    const [size, setSize] = useState([0, 0]);

    useLayoutEffect(() => {
        const handleResize = () => {
            setSize([window.innerWidth, window.innerHeight]);
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <QueryClientProvider client={queryClient}>
                <BrowserRouter basename="apps/inkvisitor">
                    <Switch>
                        <Route
                            path="/:territoryId?/:statementId?"
                            exact
                            render={(props) => (
                                <MainPage {...props} size={size} />
                            )}
                        />
                    </Switch>
                </BrowserRouter>
                <ReactQueryDevtools initialIsOpen />
            </QueryClientProvider>
        </ThemeProvider>
    );
};
