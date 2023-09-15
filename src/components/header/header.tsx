"use client";

import { Separator } from "../ui/separator";
import { headerHeight } from "@/lib/constants";
import { DesktopNav, MobileNav } from "./nav";
import Image from "next/image";

const Header = () => {
  return (
    <header className={`h-[${headerHeight}]`}>
      <div className="flex justify-between p-4">
        <Image
          src="/jim-computer.png"
          alt="Jim memoji behind a MacBook"
          height={50}
          width={50}
        />
        <nav className="flex flex-row">
          <div className="hidden md:flex">
            <DesktopNav />
          </div>
          <div className="flex md:hidden">
            <MobileNav />
          </div>
        </nav>
      </div>
      <Separator orientation="horizontal" />
    </header>
  );
};

export default Header;
