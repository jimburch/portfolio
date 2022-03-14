import React from "react";
import { Link } from "gatsby";
import Layout from "./Layout";

const PostLayout = ({ children, pageContext }) => {
  const { title, description, date, metaImageUrl } = pageContext.frontmatter;

  const dateString = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Layout
      title={`${title} | Changeblog`}
      description={description}
      image={metaImageUrl}
      date={date}
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
