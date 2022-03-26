import React from "react";
import { Header } from "../Header";
import { main } from "./Layout.module.css";

export const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <main className={main}>{children}</main>
    </>
  );
};
