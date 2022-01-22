import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";
// import { StaticImage } from "gatsby-plugin-image";

import Layout from "../components/layout.js";

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

  return (
    <Layout title="Jim Burch | Changeblog">
      <h1>Changeblog</h1>
      <p>An in-depth journal on how this site changes and grows.</p>
      {/* <StaticImage
        src="../images/monument-valley.jpg"
        alt="landscape view of monument valley utah"
      /> */}
      {posts.map((post) => (
        <div className={article} key={post.id}>
          <Link to={post.slug}>{post.frontmatter.title}</Link>
          <small>posted {post.frontmatter.date}</small>
        </div>
      ))}
    </Layout>
  );
};

export default Changeblog;
