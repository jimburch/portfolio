module.exports = {
  siteMetadata: {
    title: "Jim Burch | Portfolio",
    description: "A collection of my work and a sandbox to try new things.",
    author: "Jim Burch",
    siteUrl: "https://jimburch.com",
    image: "https://miro.medium.com/max/2000/1*VUMnDejhPbnBG48fw3ZAWA.jpeg",
  },
  plugins: [
    // seo
    "gatsby-plugin-react-helmet",

    // images
    {
      resolve: "gatsby-plugin-sharp",
      options: {
        defaults: {
          formats: ["auto", "webp"],
          placeholder: "dominantColor",
          quality: 90,
          breakpoints: [750, 1080, 1366, 1920],
          backgroundColor: "transparent",
          tracedSVGOptions: {},
          blurredOptions: {},
          jpgOptions: {},
          pngOptions: {},
          webpOptions: {},
          avifOptions: {},
        },
      },
    },
    "gatsby-plugin-image",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: `${__dirname}/src/images`,
      },
    },

    // PWA
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "Jim Burch | Portfolio",
        short_name: "portfolio",
        start_url: "/",
        background_color: "#663399",
        // This will impact how browsers show your PWA/website
        // https://css-tricks.com/meta-theme-color-and-trickery/
        // theme_color: "#663399",
        display: "minimal-ui",
        icon: "src/images/memoji.png", // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    "gatsby-plugin-offline",
  ],
};
