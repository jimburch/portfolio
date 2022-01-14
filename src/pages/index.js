import * as React from "react";
import { Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";

import Layout from "../components/layout";
import Seo from "../components/seo";

import { root } from "../styles/index.module.css";

const IndexPage = () => (
  <Layout>
    <Seo />
    <div className={root}>
      <h1>My Name Is</h1>
      <h1>Jim</h1>
    </div>
  </Layout>
);

export default IndexPage;
