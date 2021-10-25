import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { createUseStyles } from "react-jss";
import axios from "axios";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./views/Home";
import Development from "./views/Development";
import Writing from "./views/Writing";

import "./styles.css";

const useStyles = createUseStyles({
  root: {},
});

const Main: React.FC = () => {
  const classes = useStyles();

  useEffect(() => {
    const callBackend = async (): Promise<void> => {
      const response = await axios.get("/api/hello");
      console.log(response.data.message);
    };
    callBackend();
  }, []);

  return (
    <Router>
      <div className={classes.root}>
        <Navbar />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/development" component={Development} />
          <Route exact path="/writing" component={Writing} />
        </Switch>
        <Footer />
      </div>
    </Router>
  );
};

export default Main;
