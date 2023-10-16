import { cn } from "@/lib/utils";

export default function Section({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("flex justify-center py-10 md:py-16", className)}
    >
      {children}
    </section>
  );
}
