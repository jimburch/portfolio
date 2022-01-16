import React from "react";
import Layout from "../components/layout";
import { Link } from "gatsby";

import { root } from "../styles/index.module.css";

const NotFound = () => {
  return (
    <Layout>
      <div className={root}>
        <h1>404: Page Not Found</h1>
        <p>
          <Link to="/">Go Home</Link>
        </p>
      </div>
    </Layout>
  );
};

export default NotFound;
