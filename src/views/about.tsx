import Center from "@/components/layout/center";
import Heading from "@/components/ui/typography/heading";
import Text from "@/components/ui/typography/text";
import Image from "next/image";

const About = () => {
  return (
    <Center id="about" className="w-full h-screen">
      <div className="flex flex-col md:flex-row">
        <Image
          src="/jim-computer.png"
          alt="memoji behind macbook"
          height={200}
          width={200}
        />
        <Center className="flex-col">
          <Heading as="h1">About</Heading>
          <Text as="p">This is where all my shit goes</Text>
        </Center>
      </div>
    </Center>
  );
};

export default About;
