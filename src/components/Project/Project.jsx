import React from "react";
import {
  Box,
  Heading,
  Text,
  UnorderedList,
  ListItem,
  ListIcon,
  Link,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";
import { renderRichText } from "gatsby-source-contentful/rich-text";
import { BLOCKS } from "@contentful/rich-text-types";

import { root, imageContainer, details } from "./Project.module.css";

export const Project = ({ projectName, description, image, url }) => {
  const options = {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node, children) => <Text>{children}</Text>,
      [BLOCKS.UL_LIST]: (node, children) => (
        <UnorderedList>{children}</UnorderedList>
      ),
      [BLOCKS.LIST_ITEM]: (node, children) => <ListItem>{children}</ListItem>,
    },
  };

  return (
    <Box className={root}>
      <img
        className={imageContainer}
        src={image?.url}
        alt={image?.description}
        loading="lazy"
      />
      <div className={details}>
        <Heading as="h3" size="lg">
          {projectName}
        </Heading>
        {renderRichText(description, options)}
        <Link href={url} color="atom.cyan">
          New Link
        </Link>
      </div>
    </Box>
  );
};
