import React from "react";
import { Link as GatsbyLink } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";
import {
  Box,
  ButtonGroup,
  Button,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { AiFillHome, AiFillGithub, AiFillLinkedin } from "react-icons/ai";
import { BsCode } from "react-icons/bs";

import { root, logo, nav, short } from "./Header.module.css";

export const Header = () => (
  <Box as="header" bg="atom.midnight" className={root}>
    <div className={logo}>
      <Link as={GatsbyLink} to="/">
        <StaticImage
          src="../../images/memoji.png"
          alt="memoji of Jim Burch"
          height={40}
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
    <nav className={short}>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="menu"
          icon={<HamburgerIcon />}
          variant="outline"
        />
        <MenuList color="atom.midnight">
          <Link as={GatsbyLink} to="/">
            <MenuItem icon={<AiFillHome />}>Home</MenuItem>
          </Link>
          <Link href="https://github.com/JimBurch">
            <MenuItem icon={<AiFillGithub />}>GitHub</MenuItem>
          </Link>
          <Link href="https://www.linkedin.com/in/jimburch1/">
            <MenuItem icon={<AiFillLinkedin />}>LinkedIn</MenuItem>
          </Link>
          <Link as={GatsbyLink} to="/changeblog">
            <MenuItem icon={<BsCode />}>Changeblog</MenuItem>
          </Link>
        </MenuList>
      </Menu>
    </nav>
  </Box>
);
