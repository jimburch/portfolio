import Landing from "@/views/landing";
import About from "@/views/about";
import Experience from "@/views/experience";
import Projects from "@/views/projects";
import Contact from "@/views/contact";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Landing />
      <About />
      <Experience />
      <Projects />
      <Contact />
    </main>
  );
}
