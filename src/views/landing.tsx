import Center from "@/components/layout/center";
import Heading from "@/components/ui/typography/heading";
import { headerHeight } from "@/lib/constants";

const Landing = () => {
  return (
    <Center
      id="home"
      style={{ height: `calc(100vh - ${headerHeight})` }}
      className="w-full"
    >
      <Heading as="h1">Jim Burch</Heading>
    </Center>
  );
};

export default Landing;
