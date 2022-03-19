import React from "react";
import { StaticImage } from "gatsby-plugin-image";
import { Heading } from "@chakra-ui/react";

import Layout from "../components/Layout";
import { root, name } from "../styles/index.module.css";

const Home = () => (
  <Layout>
    <div className={root}>
      <Heading>MY NAME IS</Heading>
      <StaticImage
        src="../images/memoji.png"
        alt="Jim Burch memoji sitting behind a MacBook Pro"
        height={250}
      />
      <Heading className={name}>
        JIM BURCH{" "}
        <span role="img" aria-label="waving hand">
          👋
        </span>
      </Heading>
    </div>
  </Layout>
);

export default Home;
