import React from "react";
import { StaticImage } from "gatsby-plugin-image";

import Layout from "../components/Layout";

import { root, name } from "../styles/index.module.css";

const Home = () => (
  <Layout>
    <div className={root}>
      <h3>MY NAME IS</h3>
      <StaticImage
        src="../images/memoji.png"
        alt="Jim Burch memoji sitting behind a MacBook Pro"
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

export default Home;
