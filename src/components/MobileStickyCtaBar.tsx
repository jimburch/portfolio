import { useEffect, useState } from "react";
import CalButton from "./CalButton";

export default function MobileStickyCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const cta = document.getElementById("cta");
    if (!hero || !cta) return;

    const observer = new IntersectionObserver(
      () => {
        const heroRect = hero.getBoundingClientRect();
        const ctaRect = cta.getBoundingClientRect();
        const heroOut = heroRect.bottom < 0;
        const ctaVisible = ctaRect.top < window.innerHeight;
        setVisible(heroOut && !ctaVisible);
      },
      { threshold: 0 },
    );

    observer.observe(hero);
    observer.observe(cta);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0f0f1a]/90 backdrop-blur-sm border-t border-[var(--color-border)] px-4 pt-3 pb-8">
      <CalButton className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-rose)] text-white font-semibold py-3 rounded-lg text-center cursor-pointer cta-glow">
        Let's talk about your idea →
      </CalButton>
    </div>
  );
}
