import React from "react";
import { Link } from "gatsby";
import Layout from "./layout.js";

const PostLayout = ({ children, pageContext }) => {
  const { title, description, metaImageUrl } = pageContext.frontmatter;

  return (
    <Layout
      title={`${title} | Changeblog`}
      description={description}
      image={metaImageUrl}
      style={{ paddingBottom: 50 }}
    >
      <h1>{title}</h1>
      {children}
      <Link to="/changeblog">&larr; back to Changeblog</Link>
    </Layout>
  );
};

export default PostLayout;
