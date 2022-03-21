import React from "react";
import { Box } from "@chakra-ui/react";
import Header from "./Header";

// import "../styles/global.css";
import { main } from "../styles/layout.module.css";

const Layout = ({ children }) => {
  return (
    <Box>
      <Header />
      <main className={main}>{children}</main>
    </Box>
  );
};

export default Layout;
