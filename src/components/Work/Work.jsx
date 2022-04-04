import React from "react";
import { StaticImage } from "gatsby-plugin-image";
import { Heading, Text, Icon } from "@chakra-ui/react";
import { MdWork } from "react-icons/md";

import { root, hero, heroHeadings, image } from "./Work.module.css";

export const Work = () => {
  return (
    <div id="work" className={root}>
      <div className={hero}>
        <div className={heroHeadings}>
          <Heading as="h1" fontSize="4xl">
            <Text as="span">{"<"}</Text>
            <Text as="span" color="atom.red1">
              {"h2"}
            </Text>
            <Text as="span">{">"}</Text>
            <Text as="span">
              Cool Projects <Icon as={MdWork} />
            </Text>
            <Text as="span">{"</"}</Text>
            <Text as="span" color="atom.red1">
              {"h2"}
            </Text>
            <Text as="span">{">"}</Text>
          </Heading>
          <Heading as="h2" fontSize="3xl">
            Professional Highlights
          </Heading>
          <Heading as="h2" fontSize="3xl">
            & Personal Projects
          </Heading>
        </div>
        <StaticImage
          src="../../images/memoji_work.png"
          alt="Jim Burch memoji sitting behind a MacBook Pro"
          height={350}
          className={image}
        />
      </div>
    </div>
  );
};
