import React from "react";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  root: {
    display: "flex",
    justifyContent: "center",
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    background: "black",
  },
  footerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 800,
    height: 50,
  },
});

const Footer: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.footerContainer}>Footer</div>
    </div>
  );
};

export default Footer;
