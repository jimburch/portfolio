import React from "react";
import { Heading, Text } from "@chakra-ui/react";
import { Seo } from "../components/Seo";

const NotFoundPage = () => (
  <>
    <Seo title="404: Not found" />
    <Heading>404: Not Found</Heading>
    <Text fontSize="xl" my={5}>
      You just hit a route that doesn&#39;t exist... the sadness.
    </Text>
  </>
);

export default NotFoundPage;
