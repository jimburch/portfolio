import Image from "next/image";
import Heading from "../ui/typography/heading";

export default function Introduction() {
  return (
    <div className="flex flex-col items-center md:flex-row">
      <Image
        src="/jim-computer.png"
        alt="jim burch behind a computer"
        width={200}
        height={200}
        priority
      />
      <div className="flex flex-col items-center space-y-2">
        <Heading as="h1">Jim Burch</Heading>
        <Heading as="h3" className="flex text-center">
          Software Engineer <br className="md:hidden" />& Creative Pro 👋🏻
        </Heading>
      </div>
    </div>
  );
}
