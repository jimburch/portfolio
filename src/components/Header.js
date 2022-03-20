import React from "react";
import { Link as GatsbyLink } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";
import { ButtonGroup, Button } from "@chakra-ui/react";

import { root, logo, nav, short } from "../styles/header.module.css";

const Header = () => (
  <header className={root}>
    <div>
      <h3 className={logo}>
        <GatsbyLink to="/">JB</GatsbyLink>
      </h3>
    </div>
    <nav className={nav}>
      <ButtonGroup variant="outline">
        <Button as="a" href="https://github.com/JimBurch">
          GitHub
        </Button>
        <Button as="a" href="https://www.linkedin.com/in/jimburch1">
          LinkedIn
        </Button>
        <Button as={GatsbyLink} to="/changeblog">
          Changeblog
        </Button>
      </ButtonGroup>
    </nav>
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
        <GatsbyLink to="/changeblog">CB</GatsbyLink>
      </h3>
    </div>
  </header>
);

export default Header;
