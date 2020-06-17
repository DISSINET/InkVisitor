import * as React from "react";

interface AppProps {
  label: string;
}

export const Button: React.FC<AppProps> = ({ label }) => {
  return <button className="btn">{label}</button>;
};
