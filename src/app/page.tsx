import { Contact, Introduction, Projects, Section } from "@/components";

export default function Home() {
  return (
    <main className="flex flex-col justify-center px-6 md:px-4">
      <Section>
        <Introduction />
      </Section>
      <Section id="projects">
        <Projects />
      </Section>
      <Section id="contact">
        <Contact />
      </Section>
    </main>
  );
}
