import * as React from "react";
import { StaticImage } from "gatsby-plugin-image";

import Layout from "../components/layout";
import Seo from "../components/seo";

import { root, name } from "../styles/index.module.css";

const IndexPage = () => (
  <Layout>
    <Seo />
    <div className={root}>
      <h3>MY NAME IS</h3>
      <StaticImage
        src="../images/memoji.png"
        alt="Jim Burch memoji sitting behind a MacBook Pro"
        placeholder="dominantColor"
        height={250}
      />
      <h1 className={name}>
        JIM BURCH{" "}
        <span role="img" aria-label="waving hand">
          👋
        </span>
      </h1>
    </div>
  </Layout>
);

export default IndexPage;
