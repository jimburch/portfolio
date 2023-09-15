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
      className={`flex justify-center items-center ${className}`}
    >
      {children}
    </div>
  );
};

export default Center;
