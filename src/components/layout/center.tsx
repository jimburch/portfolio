import { cn } from "@/lib/utils";

type CenterProps = {
  id?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

const Center = ({ id, children, style, className = "" }: CenterProps) => {
  return (
    <div
      id={id}
      style={style}
      className={cn("flex justify-center items-center w-full", className)}
    >
      {children}
    </div>
  );
};

export default Center;
