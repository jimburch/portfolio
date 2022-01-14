import * as React from "react";
import { Link } from "gatsby";

import { root, nav } from "../styles/header.module.css";

const Header = ({ siteTitle }) => (
  <header className={root}>
    <div>
      <h3>
        <Link to="/">Home</Link>
      </h3>
    </div>
    <div className={nav}>
      <h3>
        <a href="https://www.github.com/JimBurch">About</a>
      </h3>
      <h3>
        <a href="https://www.linkedin.com/in/jimburch1">Contact</a>
      </h3>
    </div>
  </header>
);

export default Header;
