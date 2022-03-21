import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "./theme";
import Layout from "./components/Layout";

export const wrapPageElement = ({ element }) => {
  return (
    <ChakraProvider theme={theme}>
      <Layout>{element}</Layout>
    </ChakraProvider>
  );
};
