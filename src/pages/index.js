import React from "react";
import { StaticImage } from "gatsby-plugin-image";
import { Heading } from "@chakra-ui/react";

import { Seo } from "../components/Seo";
import { root, name } from "../styles/index.module.css";

const IndexPage = () => (
  <div className={root}>
    <Seo />
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
);

export default IndexPage;
