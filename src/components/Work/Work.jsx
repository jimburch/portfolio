import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";
import { Heading, Text, Icon } from "@chakra-ui/react";
import { MdWork } from "react-icons/md";

import { Project } from "../Project";
import { root, hero, heroHeadings, image } from "./Work.module.css";

export const Work = () => {
  const data = useStaticQuery(graphql`
    query GetContentfulEntries {
      allContentfulProject {
        nodes {
          contentful_id
          description {
            raw
          }
          image {
            description
            title
            url
          }
          projectName
          url
        }
      }
    }
  `);

  const projects = data.allContentfulProject.nodes;

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
        <div className={image}>
          <StaticImage
            src="../../images/memoji_work.png"
            alt="Jim Burch memoji sitting behind a MacBook Pro"
            height={350}
          />
        </div>
      </div>
      {projects.map((project) => (
        <Project
          key={project.contentful_id}
          projectName={project.projectName}
          description={project.description}
          image={project.image}
          url={project.url}
        />
      ))}
    </div>
  );
};
