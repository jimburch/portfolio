import React from "react";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  root: {},
});

const Development: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div>Dev</div>
    </div>
  );
};

export default Development;
