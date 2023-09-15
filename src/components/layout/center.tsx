type CenterProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

const Center = ({ children, style, className = "" }: CenterProps) => {
  return (
    <div
      style={style}
      className={`flex justify-center items-center ${className}`}
    >
      {children}
    </div>
  );
};

export default Center;
