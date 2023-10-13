import { headerHeight } from "@/lib/constants";
import { DesktopNav, MobileNav } from "./nav";

export default function Header() {
  return (
    <header className={`h-[${headerHeight}]`}>
      <div className="flex justify-end p-4 md:justify-center">
        <nav className="flex flex-row">
          <div className="hidden md:flex">
            <DesktopNav />
          </div>
          <div className="flex md:hidden">
            <MobileNav />
          </div>
        </nav>
      </div>
    </header>
  );
}
