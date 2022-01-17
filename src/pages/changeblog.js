import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";
import Layout from "../components/layout.js";

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

  return (
    <Layout>
      <h1>Changeblog</h1>
      {posts.map((post) => (
        <li key={post.id}>
          <Link to={post.slug}>{post.frontmatter.title}</Link>
          <small>posted {post.frontmatter.date}</small>
        </li>
      ))}
    </Layout>
  );
};

export default Changeblog;
