"use client";

import GitHubCalendar from "react-github-calendar";
import Heading from "../ui/typography/heading";
import Center from "../layout/center";
import Link from "next/link";

export default function Projects() {
  return (
    <Center className="flex-col">
      <Heading as="h1" className="pb-5">
        Projects
      </Heading>
      <Link href="https://github.com/jimburch">
        <GitHubCalendar username="jimburch" />
      </Link>
    </Center>
  );
}

// https://grubersjoe.github.io/react-github-calendar/
