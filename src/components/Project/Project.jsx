import React from "react";
import { Box, Heading, Text, Link } from "@chakra-ui/react";
import { renderRichText } from "gatsby-source-contentful/rich-text";
import { BLOCKS } from "@contentful/rich-text-types";

import { root, details, richText } from "./Project.module.css";

export const Project = ({ projectName, description, image, url, github }) => {
  const options = {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node, children) => <Text>{children}</Text>,
    },
  };

  return (
    <Box
      className={root}
      borderRadius="5px"
      background="atom.mono1"
      color="atom.midnight"
    >
      <Link href={url}>
        <img src={image?.url} alt={image?.description} loading="lazy" />
      </Link>
      <div className={details}>
        <Heading as="h3" size="lg" marginBottom="10px">
          {projectName}
        </Heading>
        <div className={richText}>{renderRichText(description, options)}</div>
        <Link href={url} fontSize="lg" fontWeight="bold" marginRight="15px">
          App
        </Link>
        {github ? (
          <Link href={github} fontSize="lg" fontWeight="bold">
            GitHub
          </Link>
        ) : null}
      </div>
    </Box>
  );
};
