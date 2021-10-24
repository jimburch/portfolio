import React from "react";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  root: {
    display: "flex",
    justifyContent: "center",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    background: "black",
  },
  navContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 800,
    height: 50,
  },
  leftContainer: {},
  rightContainer: {
    display: "flex",
    flexDirection: "row",
  },
});

const Navbar: React.FC = () => {
  const classes = useStyles();

  return (
    <header className={classes.root}>
      <nav className={classes.navContainer}>
        <div className={classes.leftContainer}>[ Logo ]</div>
        <div className={classes.rightContainer}>
          <div>Work</div>
          <div>About</div>
          <div>Contact</div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
