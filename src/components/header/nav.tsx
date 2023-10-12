import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  FormInput,
  Github,
  Hammer,
  Home,
  Linkedin,
  ScrollText,
  User,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { ModeToggle } from "../ui/mode-toggle";

export const MobileNav = () => {
  return (
    <div className="flex flex-row">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Home className="mr-2 h-4 w-4" />
              <Link href="/">Home</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <Link href="/#about">About</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ScrollText className="mr-2 h-4 w-4" />
              <Link href="/#experience">Experience</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Hammer className="mr-2 h-4 w-4" />
              <Link href="/#projects">Projects</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FormInput className="mr-2 h-4 w-4" />
              <Link href="/#contact">Contact</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Github className="mr-2 h-4 w-4" />
              <Link href="https://github.com/jimburch">Github</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Linkedin className="mr-2 h-4 w-4" />
              <Link href="https://www.linkedin.com/in/jimburch1/">Contact</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ModeToggle />
    </div>
  );
};

export const DesktopNav = () => {
  return (
    <div className="flex flex-row">
      <Link href="/">
        <Button variant="link">Home</Button>
      </Link>
      <Separator orientation="vertical" />
      <Link href="/#about">
        <Button variant="link">About</Button>
      </Link>
      <Separator orientation="vertical" />
      <Link href="/#experience">
        <Button variant="link">Experience</Button>
      </Link>
      <Separator orientation="vertical" />
      <Link href="/#projects">
        <Button variant="link">Projects</Button>
      </Link>
      <Separator orientation="vertical" />
      <Link href="/#contact">
        <Button variant="link">Contact</Button>
      </Link>
      <div className="flex flex-row space-x-1">
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
      </div>
    </div>
  );
};
