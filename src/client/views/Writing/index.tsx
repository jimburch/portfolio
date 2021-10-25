import React from "react";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  root: {},
});

const Writing: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div>Writing</div>
    </div>
  );
};

export default Writing;
