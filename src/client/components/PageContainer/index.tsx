import React from "react";
import { createUseStyles } from "react-jss";
import { PageContainerProps } from "../../types";
import { appStyles } from "../../constants/appStyles";

const useStyles = createUseStyles({
  root: {
    width: "100%",
    maxWidth: 950,
    minHeight: `calc(100vh - ${
      appStyles.navHeight + appStyles.footerHeight
    }px)`,
    marginTop: appStyles.navHeight,
  },
});

const PageContainer: React.FC<PageContainerProps> = ({ children }: any) => {
  const classes = useStyles();
  return <div className={classes.root}>{children}</div>;
};

export default PageContainer;
