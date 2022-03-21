import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";

import Seo from "../components/Seo";

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
      <h1>Changeblog</h1>
      <p>An in-depth journal on how this site changes and grows.</p>
      {posts.map((post) => (
        <div className={article} key={post.id}>
          <Link to={post.slug}>{post.frontmatter.title}</Link>
          <small>posted {post.frontmatter.date}</small>
        </div>
      ))}
    </>
  );
};

export default Changeblog;
