import React from "react";
import { Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";

import { root, logo, nav, short } from "../styles/header.module.css";

const Header = ({ siteTitle }) => (
  <header className={root}>
    <div>
      <h3 className={logo}>
        <Link to="/">JB</Link>
      </h3>
    </div>
    <div className={nav}>
      <h3>
        <a href="https://www.github.com/JimBurch">GitHub</a>
      </h3>
      <h3>
        <a href="https://www.linkedin.com/in/jimburch1">LinkedIn</a>
      </h3>
      <h3>
        <Link to="/changeblog">Changeblog</Link>
      </h3>
    </div>
    <div className={short}>
      <a href="https://www.github.com/JimBurch">
        <StaticImage
          src="../images/github-icon.png"
          alt="github icon about me"
          height={30}
        />
      </a>
      <a href="https://www.linkedin.com/in/jimburch1">
        <StaticImage
          src="../images/linkedin-icon.png"
          alt="linkedin icon contact"
          height={30}
        />
      </a>
      <h3>
        <Link to="/changeblog">CB</Link>
      </h3>
    </div>
  </header>
);

export default Header;
