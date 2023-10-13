import Center from "../layout/center";
import Heading from "../ui/typography/heading";
import { Badge } from "@/components/ui/badge";
import Job from "./job";
import { jobs } from "@/data/jobs";
import { techSkills } from "@/data/tech-skills";

export default function Experience() {
  return (
    <Center className="flex-col">
      <Heading as="h1" className="pb-5">
        Experience
      </Heading>
      <div className="flex flex-row flex-wrap justify-center space-x-1 pb-5">
        {techSkills.map((skill) => (
          <div key={skill}>
            <Badge>{skill}</Badge>
          </div>
        ))}
      </div>
      <div className="flex flex-col space-y-3 md:flex-row md:space-x-3 md:space-y-0">
        {jobs.map((job, i) => (
          <Job key={i} {...job} />
        ))}
      </div>
    </Center>
  );
}
