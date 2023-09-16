import Center from "@/components/layout/center";
import Heading from "@/components/ui/typography/heading";
import Text from "@/components/ui/typography/text";
import { headerHeight } from "@/lib/constants";
import Image from "next/image";

const Landing = () => {
  return (
    <Center
      id="home"
      style={{ height: `calc(100vh - ${headerHeight})` }}
      className="w-full flex-col"
    >
      <div className="flex flex-col md:flex-row">
        <Image
          src="/jim-computer.png"
          alt="memoji behind macbook"
          height={200}
          width={200}
        />
        <Center className="flex-col">
          <Heading as="h1">Jim Burch</Heading>
          <Text as="p">Software Engineer & Creative Pro</Text>
        </Center>
      </div>
      <Text as="code">{"<p>Some code here I dunno</p>"}</Text>
    </Center>
  );
};

export default Landing;
