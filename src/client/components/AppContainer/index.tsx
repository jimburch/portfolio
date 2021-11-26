import React from "react";
import { createUseStyles } from "react-jss";
import { AppContainerProps } from "../../types";

const useStyles = createUseStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  "@global": {
    html: {
      background: "lightgrey",
      color: "white",
    },
  },
});

const AppContainer: React.FC<AppContainerProps> = ({ children }: any) => {
  const classes = useStyles();
  return <div className={classes.root}>{children}</div>;
};

export default AppContainer;
