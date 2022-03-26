import React from "react";
import { Link as GatsbyLink } from "gatsby";
import { Container, Link, Heading, Text, Image } from "@chakra-ui/react";
import { MDXProvider } from "@mdx-js/react";
import { Seo } from "../Seo";

import { title } from "./PostLayout.module.css";

const chakraUiComponents = {
  h1: (props) => <Heading as="h1" paddingY="5" size="2xl" {...props} />,
  h2: (props) => <Heading as="h2" paddingY="5" size="xl" {...props} />,
  h3: (props) => <Heading as="h3" paddingY="5" size="lg" {...props} />,
  h4: (props) => <Heading as="h4" paddingY="5" size="md" {...props} />,
  h5: (props) => <Heading as="h5" paddingY="5" size="sm" {...props} />,
  h6: (props) => <Heading as="h6" paddingY="5" size="xl" {...props} />,
  p: (props) => (
    <Text lineHeight={1.5} paddingBottom="4" fontSize="lg" {...props} />
  ),
  img: (props) => <Image marginBottom="4" {...props} />,
};

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
    <Container maxW={1200} style={{ margin: "25px 0px" }}>
      <Seo
        title={`${title} | Changeblog`}
        description={description}
        image={image}
        path={url}
      />
      <div className={title}>
        <Heading>{title}</Heading>
        <Text>{dateString}</Text>
      </div>
      <MDXProvider components={chakraUiComponents}>{children}</MDXProvider>
      <Link
        as={GatsbyLink}
        to="/changeblog"
        color="atom.cyan"
        style={{ margin: "25px 0px" }}
      >
        &larr; back to Changeblog
      </Link>
    </Container>
  );
};

export default PostLayout;
