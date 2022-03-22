import React from "react";
import { Box } from "@chakra-ui/react";
import { Header } from "../Header";

import { main } from "./Layout.module.css";

export const Layout = ({ children }) => {
  return (
    <Box>
      <Header />
      <main className={main}>{children}</main>
    </Box>
  );
};
