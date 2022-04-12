import React from "react";
import { renderRichText } from "gatsby-source-contentful/rich-text";

import { root } from "./Project.module.css";

export const Project = ({ projectName, description, image, url }) => {
  return (
    <div className={root}>
      <div>{projectName}</div>
      <div>{renderRichText(description)}</div>
      <img src={image?.url} alt={image?.description} />
      <a href={url}>Link</a>
    </div>
  );
};
