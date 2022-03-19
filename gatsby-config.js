module.exports = {
  siteMetadata: {
    title: "Jim Burch | Software Engineer & Creative Pro",
    description: "A collection of my work and a sandbox to try new things.",
    author: "Jim Burch",
    siteUrl: "https://www.jimburch.com",
    image:
      "https://jimburch-portfolio.s3.us-west-1.amazonaws.com/site-images/jimburch-portfolio-grand-canyon.jpg",
  },
  plugins: [
    // seo
    "gatsby-plugin-react-helmet",

    // chakra ui
    "@chakra-ui/gatsby-plugin",

    // images
    {
      resolve: "gatsby-plugin-sharp",
      options: {
        defaults: {
          formats: ["auto", "webp"],
          placeholder: "none",
          quality: 90,
          breakpoints: [750, 1080, 1366, 1920],
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

    // mdx
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "posts",
        path: `${__dirname}/src/posts/changeblog/`,
      },
    },
    {
      resolve: "gatsby-plugin-page-creator",
      options: {
        path: `${__dirname}/src/posts/`,
      },
    },
    "gatsby-remark-images",
    {
      resolve: "gatsby-plugin-mdx",
      options: {
        gatsbyRemarkPlugins: [
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 1200,
            },
          },
        ],
        defaultLayouts: {
          posts: require.resolve("./src/components/PostLayout.js"),
        },
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
