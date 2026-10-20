import { useEffect, useRef, type ReactNode } from "react";
import { useApp } from "./state";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/** Each engine owns separate elements; cleanup also handles React StrictMode. */
export function WelcomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const deviceReduced = useReducedMotion();
  const { motionPreference } = useApp();
  const reduced = motionPreference === "reduced" || deviceReduced;
  useEffect(() => {
    if (reduced !== false || !root.current) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import("animejs"), import("gsap")])
      .then(([anime, { gsap }]) => {
        if (disposed || !root.current) return;
        const scope = anime.createScope({ root: root.current }).add(() => {
          anime.animate(".welcome-copy > *", {
            opacity: { from: 0, to: 1 },
            translateY: { from: 10, to: 0 },
            duration: 380,
            delay: anime.stagger(45),
            ease: "outCubic",
          });
        });
        const context = gsap.context(() => {
          const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
          timeline.fromTo(
            ".landscape",
            { opacity: 0, scale: 1.025 },
            { opacity: 1, scale: 1, duration: 0.65 },
          );
        }, root.current);
        cleanup = () => {
          scope.revert();
          context.revert();
        };
      })
      .catch(() => {
        /* Content stays visible if optional animation chunks fail. */
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduced]);
  return <div ref={root}>{children}</div>;
}

/** React owns routes/notices; CSS owns hover/focus effects. */
export function RouteMotion({
  children,
  routeKey,
}: {
  children: ReactNode;
  routeKey: string;
}) {
  const deviceReduced = useReducedMotion();
  const { motionPreference } = useApp();
  const reduced = motionPreference === "reduced" || deviceReduced;
  return (
    <motion.div
      key={routeKey}
      className="page-stage"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
export function NoticeMotion({
  children,
  visible,
}: {
  children: ReactNode;
  visible: boolean;
}) {
  const deviceReduced = useReducedMotion();
  const { motionPreference } = useApp();
  const reduced = motionPreference === "reduced" || deviceReduced;
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          className="notice-motion"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : 8 }}
          transition={{ duration: reduced ? 0 : 0.16 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
