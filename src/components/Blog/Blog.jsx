import React from "react";
import { Link as GatsbyLink, useStaticQuery, graphql } from "gatsby";
import { Heading, Text, Link } from "@chakra-ui/react";

import { root, title, description, article } from "./Blog.module.css";

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
    <div className={root}>
      <div className={title}>
        <Heading size="4xl">Change</Heading>
        <Heading size="4xl">blog</Heading>
        <Text fontSize="xl" className={description}>
          An in-depth journal on how this site changes and grows.
        </Text>
      </div>
      <div>
        {posts.map((post) => (
          <div className={article} key={post.id}>
            <Link as={GatsbyLink} to={post.slug} color="atom.cyan">
              <Heading size="md">{post.frontmatter.title}</Heading>
            </Link>
            <Text>{post.frontmatter.description}</Text>
            <Text fontSize="sm">posted {post.frontmatter.date}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};
