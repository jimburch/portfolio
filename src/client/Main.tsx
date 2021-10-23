import React, { useEffect } from "react";
import axios from "axios";

import "./styles.css";

const Main: React.FC = () => {
  useEffect(() => {
    const callBackend = async (): Promise<void> => {
      const response = await axios.get("/api/hello");
      console.log(response.data.message);
    };
    callBackend();
  }, []);
  return (
    <div>
      <h1>Hello, my name is Jim.</h1>
    </div>
  );
};

export default Main;
