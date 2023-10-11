import { Introduction, Projects, Section } from "@/components";

export default function Home() {
  return (
    <main className="flex flex-col justify-center px-6 md:px-0">
      <Section>
        <Introduction />
      </Section>
      <Section id="projects">
        <Projects />
      </Section>
    </main>
  );
}
