import React from "react";
import { Link } from "gatsby";
// import { StaticImage } from "gatsby-plugin-image";
import { GatsbyImage } from "gatsby-plugin-image";
import Layout from "./layout.js";

const PostLayout = ({ children, pageContext }) => {
  const { title, description, date, featuredImgUrl, featuredImgAlt } =
    pageContext.frontmatter;

  console.log("IMAGE: ", featuredImgUrl);

  return (
    <Layout
      title={`${title} | Changeblog`}
      description={description}
      image={featuredImgUrl}
      style={{ paddingBottom: 50 }}
    >
      {/* <StaticImage src={featuredImage} alt={title} /> */}
      <GatsbyImage src={featuredImgUrl} alt={featuredImgAlt} />
      <h1>{title}</h1>
      <p>{date}</p>
      {children}
      <Link to="/changeblog">&larr; back to Changeblog</Link>
    </Layout>
  );
};

export default PostLayout;
