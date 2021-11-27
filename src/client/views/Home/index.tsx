import React from "react";
import { Link } from "react-router-dom";
import { createUseStyles } from "react-jss";
import Hero from "../../components/Hero";

const useStyles = createUseStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  cardContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    "@media only screen and (max-width: 768px)": {
      flexDirection: "column",
    },
  },
  card: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "black",
    color: "white",
    width: 225,
    height: 350,
    margin: 10,
    border: "none",
    borderRadius: 5,
  },
});

const Home: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Hero />
      <h1>
        Choose Your Own Adventure{" "}
        <span role="img" aria-label="camping">
          🏕️
        </span>
      </h1>
      <div className={classes.cardContainer}>
        <Link to="/development" className={classes.card}>
          Development
        </Link>
        <Link to="/writing" className={classes.card}>
          Writing
        </Link>
      </div>
    </div>
  );
};

export default Home;
