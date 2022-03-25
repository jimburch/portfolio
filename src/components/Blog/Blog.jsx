import React from "react";
import { Link as GatsbyLink, useStaticQuery, graphql } from "gatsby";
import { Heading, Text, Link } from "@chakra-ui/react";

import { article } from "./Blog.module.css";

export const Blog = () => {
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

  return (
    <>
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
