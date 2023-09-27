import { Github, Introduction } from "@/components";

export default function Home() {
  return (
    <main>
      <section className="flex flex-row">
        <Introduction />
        <Github />
      </section>
    </main>
  );
}
