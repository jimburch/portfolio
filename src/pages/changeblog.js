import React from "react";
import { Seo } from "../components/Seo";
import { Blog } from "../components/Blog";

const Changeblog = () => {
  // ternary prevents error during build time
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Seo
        title="Jim Burch | Changeblog"
        description="An in-depth journal on how this site changes and grows."
        image="https://jimburch-portfolio.s3.us-west-1.amazonaws.com/site-images/jimburch-changeblog-coffee-coding.jpg"
        path={url}
      />
      <Blog />
    </>
  );
};

export default Changeblog;
