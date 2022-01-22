import React from "react";
import { Link } from "gatsby";
import Layout from "./layout.js";

const PostLayout = ({ children, pageContext }) => {
  const { title, description } = pageContext.frontmatter;

  return (
    <Layout title={`Changeblog | ${title}`} description={description}>
      {children}
      <Link to="/changeblog">&larr; back</Link>
    </Layout>
  );
};

export default PostLayout;
