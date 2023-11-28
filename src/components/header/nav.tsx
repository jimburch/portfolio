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
} from "lucide-react";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { ModeToggle } from "../ui/mode-toggle";

export const MobileNav = () => {
  return (
    <div className="flex flex-row space-x-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          <DropdownMenuGroup>
            <Link href="/">
              <DropdownMenuItem>
                <Home className="mr-2 h-4 w-4" />
                {"Home"}
              </DropdownMenuItem>
            </Link>
            <Link href="/#experience">
              <DropdownMenuItem>
                <ScrollText className="mr-2 h-4 w-4" />
                {"Experience"}
              </DropdownMenuItem>
            </Link>
            <Link href="/#projects">
              <DropdownMenuItem>
                <Hammer className="mr-2 h-4 w-4" />
                {"Projects"}
              </DropdownMenuItem>
            </Link>
            <Link href="/#contact">
              <DropdownMenuItem>
                <FormInput className="mr-2 h-4 w-4" />
                {"Contact"}
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="https://github.com/jimburch">
              <DropdownMenuItem>
                <Github className="mr-2 h-4 w-4" />
                {"Github"}
              </DropdownMenuItem>
            </Link>
            <Link href="https://www.linkedin.com/in/jimburch1/">
              <DropdownMenuItem>
                <Linkedin className="mr-2 h-4 w-4" />
                {"Contact"}
              </DropdownMenuItem>
            </Link>
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
        <Link href="https://github.com/jimburch" target="_blank">
          <Button variant="outline" size="icon">
            <Github className="w-6 h-6" />
          </Button>
        </Link>
        <Link href="https://www.linkedin.com/in/jimburch1/" target="_blank">
          <Button variant="outline" size="icon">
            <Linkedin className="w-6 h-6" />
          </Button>
        </Link>
        <ModeToggle />
      </div>
    </div>
  );
};
