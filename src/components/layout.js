import React from "react";
import { useStaticQuery, graphql } from "gatsby";

import Header from "./header.js";
import Seo from "./seo.js";

import "../styles/global.css";
import { main } from "../styles/layout.module.css";

const Layout = ({
  children,
  title = false,
  description = false,
  image = false,
  path = false,
}) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  return (
    <>
      <Seo title={title} description={description} image={image} path={path} />
      <Header siteTitle={data.site.siteMetadata?.title || "Jim Burch"} />
      <div>
        <main className={main}>{children}</main>
        <footer></footer>
      </div>
    </>
  );
};

export default Layout;
