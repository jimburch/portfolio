import Center from "../layout/center";
import Heading from "../ui/typography/heading";
import { Badge } from "@/components/ui/badge";

const techSkills = [
  "TypeScript",
  "Node.js",
  "CSS",
  "React",
  "PostgreSQL",
  "MongoDB",
  "Express",
  "Knex.js",
  "OpenAI",
  "AWS (S3, EC2)",
  "Docker",
  "Redis",
  "Retool",
  "Mixpanel",
  "Twilio",
  "Contentful",
  "Postman",
  "TDD (Jest, React Testing Library, Cypress)",
  "Zod",
];

export default function Experience() {
  return (
    <Center className="flex-col">
      <Heading as="h1">Experience</Heading>
      <div className="flex flex-row flex-wrap justify-center space-x-1">
        {techSkills.map((skill) => (
          <div key={skill}>
            <Badge>{skill}</Badge>
          </div>
        ))}
      </div>
    </Center>
  );
}
