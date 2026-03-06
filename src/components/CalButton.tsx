import { useEffect } from "react";

const CAL_LINK = "PLACEHOLDER/intro-call";

export default function CalButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    (async () => {
      const cal = await import("@calcom/embed-react");
      cal.getCalApi().then((api) => {
        api("ui", {
          theme: "dark",
          hideEventTypeDetails: false,
        });
      });
    })();
  }, []);

  return (
    <button data-cal-link={CAL_LINK} className={className}>
      {children}
    </button>
  );
}
