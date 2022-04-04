import React from "react";
import { StaticImage } from "gatsby-plugin-image";
import { Box, Heading, Text, Icon } from "@chakra-ui/react";
import { MdWavingHand } from "react-icons/md";
import moment from "moment";

import { root, hero, heroHeadings, truncated } from "./Home.module.css";

export const Home = () => (
  <div className={root}>
    <div className={hero}>
      <StaticImage
        src="../../images/memoji.png"
        alt="Jim Burch memoji sitting behind a MacBook Pro"
        height={350}
      />
      <div className={heroHeadings}>
        <Heading as="h1" fontSize="4xl">
          <Text as="span">{"<"}</Text>
          <Text as="span" color="atom.red1">
            {"h1"}
          </Text>
          <Text as="span">{">"}</Text>
          <Text as="span">
            My Name is Jim <Icon as={MdWavingHand} />
          </Text>
          <Text as="span">{"</"}</Text>
          <Text as="span" color="atom.red1">
            {"h1"}
          </Text>
          <Text as="span">{">"}</Text>
        </Heading>
        <Heading as="h2" fontSize="3xl">
          Software Engineer & Creative Pro
        </Heading>
      </div>
    </div>
    <Box
      fontSize="xl"
      background="atom.highlight"
      color="atom.mono3"
      className={truncated}
    >
      <Box style={{ display: "block", paddingRight: 10 }}>
        <Text as="span" color="atom.mono1">
          {"<"}
        </Text>
        <Text as="span" color="atom.orange2">
          {"Portfolio"}
        </Text>
        <Text as="span" color="atom.mono1">
          {" /> "}
        </Text>
      </Box>
      <Text isTruncated>
        {`Jim Burch, ${moment(
          "20220325",
          "YYYYMMDD",
        ).fromNow()} • set up chakra, refactored site nav, and restyled global theme`}
      </Text>
    </Box>
  </div>
);
