import React from "react";
import { useStaticQuery, graphql } from "gatsby";

import Header from "./header";
import "../styles/global.css";
import { main } from "../styles/layout.module.css";

const Layout = ({ children }) => {
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
      <Header siteTitle={data.site.siteMetadata?.title || "Jim Burch"} />
      <div>
        <main className={main}>{children}</main>
        <footer></footer>
      </div>
    </>
  );
};

export default Layout;
