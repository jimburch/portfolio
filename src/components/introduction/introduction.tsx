import Image from "next/image";
import Heading from "../ui/typography/heading";

export default function Introduction() {
  return (
    <div className="flex flex-row">
      <Image
        src="/jim-computer.png"
        alt="jim burch behind a computer"
        width={200}
        height={200}
      />
      <div className="flex flex-col justify-center space-y-2">
        <Heading as="h1">Jim Burch</Heading>
        <Heading as="h3">Software Engineer & Creative Pro</Heading>
      </div>
    </div>
  );
}
