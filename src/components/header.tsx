import Heading from "./ui/typography/heading";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Github, Linkedin } from "lucide-react";
import { ModeToggle } from "./ui/mode-toggle";
import Link from "next/link";
import { headerHeight } from "@/lib/constants";

const Header = () => {
  return (
    <header className={`h-[${headerHeight}]`}>
      <div className="flex justify-between p-4">
        <Heading as="h3">Jim Burch</Heading>
        <nav className="flex flex-row">
          <Button variant="link">Home</Button>
          <Separator orientation="vertical" />
          <Button variant="link">About</Button>
          <Separator orientation="vertical" />
          <Button variant="link">Experience</Button>
          <Separator orientation="vertical" />
          <Button variant="link">Projects</Button>
          <Separator orientation="vertical" />
          <Button variant="link">Contact</Button>
          <Link href="https://github.com/jimburch">
            <Button variant="outline" size="icon">
              <Github className="w-6 h-6" />
            </Button>
          </Link>
          <Link href="https://www.linkedin.com/in/jimburch1/">
            <Button variant="outline" size="icon">
              <Linkedin className="w-6 h-6" />
            </Button>
          </Link>
          <ModeToggle />
        </nav>
      </div>
      <Separator orientation="horizontal" />
    </header>
  );
};

export default Header;
