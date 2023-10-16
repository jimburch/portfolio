import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Text from "../ui/typography/text";

type JobProps = {
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string[];
  image: string;
  fallback: string;
  link: string;
  linkText: string;
};

export default function Job({
  role,
  company,
  startDate,
  endDate,
  description,
  image,
  fallback,
  link,
  linkText,
}: JobProps) {
  return (
    <Card className="w-full max-w-[332px]">
      <CardHeader>
        <div className="flex flex-row items-center space-x-2">
          <Avatar>
            <AvatarImage src={image} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <CardTitle>{company}</CardTitle>
        </div>
        <Text>{role}</Text>
        <CardDescription>{`${startDate} - ${endDate}`}</CardDescription>
        <div className="space-y-0 hidden md:block">
          {description.map((desc, i) => (
            <CardDescription key={i}>{`• ${desc}`}</CardDescription>
          ))}
        </div>
      </CardHeader>
      <CardFooter>
        <Button className="w-full md:w-fit" asChild>
          <Link href={link}>{linkText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
