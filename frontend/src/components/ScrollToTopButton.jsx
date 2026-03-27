import { useEffect, useState } from 'react';

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-40 rounded-full border border-theme-border bg-theme-card p-3 text-theme-primary shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-theme-accent hover:text-theme-accent ${
        visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      aria-label="Scroll to top"
    >
      <span aria-hidden="true" className="text-xl leading-none">
        ↑
      </span>
    </button>
  );
};

export default ScrollToTopButton;
