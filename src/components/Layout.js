import React from "react";

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
  return (
    <div style={style}>
      <Seo
        title={title}
        description={description}
        image={image}
        path={path}
        date={date}
      />
      <Header />
      <main className={main}>{children}</main>
    </div>
  );
};

export default Layout;
