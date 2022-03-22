import React from "react";
import { Link as GatsbyLink } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";
import { ButtonGroup, Button, Link } from "@chakra-ui/react";

import { root, nav, short } from "./Header.module.css";

export const Header = () => (
  <header className={root}>
    <div>
      <Link as={GatsbyLink} to="/">
        <StaticImage
          src="../../images/memoji.png"
          alt="memoji of Jim Burch"
          height={30}
        />
      </Link>
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
          src="../../images/github-icon.png"
          alt="github icon about me"
          height={30}
        />
      </a>
      <a href="https://www.linkedin.com/in/jimburch1">
        <StaticImage
          src="../../images/linkedin-icon.png"
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
