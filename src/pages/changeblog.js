import React from "react";
import { Link as GatsbyLink, useStaticQuery, graphql } from "gatsby";
import { Heading, Text, Link } from "@chakra-ui/react";

import { Seo } from "../components/Seo";
import { article } from "../styles/changeblog.module.css";

const Changeblog = () => {
  const data = useStaticQuery(graphql`
    query GetBlogPosts {
      allMdx(sort: { fields: frontmatter___date, order: DESC }) {
        nodes {
          id
          frontmatter {
            date(fromNow: true)
            description
            title
          }
          slug
        }
      }
    }
  `);

  const posts = data?.allMdx.nodes;

  // ternary prevents error during build time
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Seo
        title="Jim Burch | Changeblog"
        description="An in-depth journal on how this site changes and grows."
        image="https://jimburch-portfolio.s3.us-west-1.amazonaws.com/site-images/jimburch-changeblog-coffee-coding.jpg"
        path={url}
      />
      <Heading>Changeblog</Heading>
      <Text>An in-depth journal on how this site changes and grows.</Text>
      {posts.map((post) => (
        <div className={article} key={post.id}>
          <Link as={GatsbyLink} to={post.slug}>
            {post.frontmatter.title}
          </Link>
          <Text size="xs">posted {post.frontmatter.date}</Text>
        </div>
      ))}
    </>
  );
};

export default Changeblog;
