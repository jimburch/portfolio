import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import axios from "axios";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./views/Home";
import Development from "./views/Development";
import Writing from "./views/Writing";
import AppContainer from "./components/AppContainer";
import PageContainer from "./components/PageContainer";

const App: React.FC = () => {
  useEffect(() => {
    const callBackend = async (): Promise<void> => {
      const response = await axios.get("/api/hello");
      console.log(response.data.message);
    };
    callBackend();
  }, []);

  return (
    <AppContainer>
      <Router>
        <Navbar />
        <PageContainer>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/development" component={Development} />
            <Route exact path="/writing" component={Writing} />
          </Switch>
        </PageContainer>
        <Footer />
      </Router>
    </AppContainer>
  );
};

export default App;
