import React from "react";
import { Helmet } from "react-helmet";
import { useStaticQuery, graphql } from "gatsby";

const Seo = (props) => {
  const data = useStaticQuery(graphql`
    query GetSiteMetadata {
      site {
        siteMetadata {
          title
          siteUrl
          image
          description
          author
        }
      }
    }
  `);

  const defaults = data.site.siteMetadata;

  const title = props.title || defaults.title;
  const description = props.description || defaults.description;
  const image = new URL(props.image || defaults.image, defaults.siteUrl);
  const url = new URL(props.path || "/", defaults.siteUrl);
  const author = props.author || defaults.author;

  return (
    <Helmet
      htmlAttributes={{
        lang: "en",
      }}
    >
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="image" content={image} />
      <meta name="author" content={author} />

      <meta property="og:type" content="Website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default Seo;
