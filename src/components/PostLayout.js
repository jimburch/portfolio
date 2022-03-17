import React from "react";
import { Link } from "gatsby";
import Layout from "./Layout";

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
    <Layout
      title={`${title} | Changeblog`}
      description={description}
      image={image}
      path={url}
      style={{ paddingBottom: 50 }}
    >
      <h1>{title}</h1>
      <p>{dateString}</p>
      {children}
      <Link to="/changeblog">&larr; back to Changeblog</Link>
    </Layout>
  );
};

export default PostLayout;
