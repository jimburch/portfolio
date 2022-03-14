import React from "react";
import { useStaticQuery, graphql } from "gatsby";

import Header from "./Header";
import Seo from "./Seo";

import "../styles/global.css";
import { main } from "../styles/layout.module.css";

const Layout = ({
  children,
  title = false,
  description = false,
  image = false,
  path = false,
  date = null,
  style = null,
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
    <div style={style}>
      <Seo
        title={title}
        description={description}
        image={image}
        path={path}
        date={date}
      />
      <Header siteTitle={data.site.siteMetadata?.title || "Jim Burch"} />
      <div>
        <main className={main}>{children}</main>
        <footer></footer>
      </div>
    </div>
  );
};

export default Layout;
