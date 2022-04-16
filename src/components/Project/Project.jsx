import React from "react";
import {
  Box,
  Heading,
  Text,
  Link,
  Button,
  ButtonGroup,
  Badge,
  Stack,
} from "@chakra-ui/react";
import { MdExitToApp, MdOutlineCode } from "react-icons/md";
import { renderRichText } from "gatsby-source-contentful/rich-text";
import { BLOCKS } from "@contentful/rich-text-types";

import { root, details, richText, stackContainer } from "./Project.module.css";

export const Project = ({
  projectName,
  description,
  image,
  stack,
  url,
  github,
}) => {
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
        <Stack
          className={stackContainer}
          direction="row"
          wrap="wrap"
          shouldWrapChildren={true}
        >
          {stack.map((item, i) => (
            <Badge key={i}>{item}</Badge>
          ))}
        </Stack>
        <ButtonGroup variant="ghost">
          {url ? (
            <Button
              as="a"
              href={url}
              aira-label="project app"
              leftIcon={<MdExitToApp />}
            >
              App
            </Button>
          ) : null}

          {github ? (
            <Button
              as="a"
              href={github}
              aria-label="github repository"
              leftIcon={<MdOutlineCode />}
            >
              Code
            </Button>
          ) : null}
        </ButtonGroup>
      </div>
    </Box>
  );
};
