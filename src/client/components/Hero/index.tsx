import React from "react";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles({
  root: {
    display: "flex",
    background: "black",
    width: "100%",
    height: 200,
  },
});

const Hero: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div>Hero</div>
    </div>
  );
};

export default Hero;
