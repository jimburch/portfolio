import React from "react";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  root: {},
});

const Navbar: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div>Navbar</div>
    </div>
  );
};

export default Navbar;
