import React from "react";
import { Link as GatsbyLink } from "gatsby";
import { Heading, Text } from "@chakra-ui/react";
import Seo from "./Seo";

const PostLayout = ({ children, pageContext }) => {
  const { title, description, date, image } = pageContext.frontmatter;

  const dateString = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  // ternary prevents error during build time
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Seo
        title={`${title} | Changeblog`}
        description={description}
        image={image}
        path={url}
      />
      <Heading size="2xl">{title}</Heading>
      <Text>{dateString}</Text>
      {children}
      <GatsbyLink to="/changeblog">&larr; back to Changeblog</GatsbyLink>
    </>
  );
};

export default PostLayout;
