import React from "react";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  root: {},
});

const Footer: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div>Footer</div>
    </div>
  );
};

export default Footer;
