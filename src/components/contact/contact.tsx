"use client";

import Center from "../layout/center";
import Heading from "../ui/typography/heading";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(100),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Must be a valid email" }),
  message: z.string().min(1, { message: "Leave a message please!" }).max(500),
});

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await fetch(`https://formspree.io/f/${process.env.NEXT_PUBLIC_FORM}`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.status === 200) {
          toast({
            title: "Message sent",
            description: "Thanks for reaching out! I'll get back to you ASAP.",
          });
          form.reset();
        } else {
          toast({
            title: "Message failed to send",
            description: "Please try again later.",
          });
          throw new Error(`Contact message failed with status ${res.status}`);
        }
      })
      .catch((err) => {
        toast({
          title: "Message failed to send",
          description: "Please try again later.",
        });
        throw err;
      });
  }

  return (
    <Center className="flex-col">
      <Heading as="h1" className="pb-5">
        Talk to Me 🗣️
      </Heading>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 w-full md:w-[34rem]"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full md:w-min">
            Submit
          </Button>
        </form>
      </Form>
      <Toaster />
    </Center>
  );
}
