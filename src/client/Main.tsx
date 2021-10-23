import React, { useEffect } from "react";
import axios from "axios";
import { createUseStyles } from "react-jss";

import "./styles.css";

const useStyles = createUseStyles({
  text: {
    color: "#FFC017",
  },
});

const Main: React.FC = () => {
  const classes = useStyles();

  useEffect(() => {
    const callBackend = async (): Promise<void> => {
      const response = await axios.get("/api/hello");
      console.log(response.data.message);
    };
    callBackend();
  }, []);
  return (
    <div>
      <h1>
        Hello, my name is Jim{" "}
        <span role="img" aria-label="waving hand">
          👋
        </span>
      </h1>
      <p className={classes.text}>
        This paragraph content is styled with React-JSS
      </p>
    </div>
  );
};

export default Main;
