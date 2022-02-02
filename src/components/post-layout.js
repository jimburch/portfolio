import React from "react";
import { Link } from "gatsby";
import Layout from "./layout.js";

const PostLayout = ({ children, pageContext }) => {
  const { title, description, date, featuredImage } = pageContext.frontmatter;

  return (
    <Layout
      title={`${title} | Changeblog`}
      description={description}
      image={featuredImage}
      style={{ paddingBottom: 50 }}
    >
      <h1>{title}</h1>
      <p>{date}</p>
      {children}
      <Link to="/changeblog">&larr; back to Changeblog</Link>
    </Layout>
  );
};

export default PostLayout;
