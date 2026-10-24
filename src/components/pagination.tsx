import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Short viewports get fewer complete rows, never smaller hit targets. */
export function usePageSize(normal = 3) {
  const [size, setSize] = useState(normal);
  useEffect(() => {
    const update = () =>
      setSize(
        window.innerHeight < 650
          ? 1
          : window.innerHeight < 800
            ? Math.min(2, normal)
            : normal,
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [normal]);
  return size;
}
export function Pager({
  page,
  count,
  onChange,
  label = "Page",
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
  label?: string;
}) {
  if (count <= 1) return null;
  return (
    <nav className="pager" aria-label={`${label} navigation`}>
      <button
        aria-label={`Previous ${label.toLowerCase()}`}
        disabled={!page}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={20} />
        <span>Previous</span>
      </button>
      <span role="status">
        {page + 1} / {count}
      </span>
      <button
        aria-label={`Next ${label.toLowerCase()}`}
        disabled={page >= count - 1}
        onClick={() => onChange(page + 1)}
      >
        <span>Next</span>
        <ChevronRight size={20} />
      </button>
    </nav>
  );
}
export function Paged({
  children,
  size,
  label,
}: {
  children: ReactNode;
  size?: number;
  label?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(1);
  useLayoutEffect(() => {
    if (size) return;
    const root = container.current;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      const main = root.closest("main");
      const rows = root.querySelector<HTMLElement>(".paged-items");
      if (!main || !rows || !rows.firstElementChild) return;
      let bottom = Math.min(
        main.getBoundingClientRect().bottom,
        window.visualViewport?.height ?? window.innerHeight,
      );
      // Reserve the real space used by footers after this list, including
      // siblings of enclosing panels. Never infer capacity from screen height alone.
      let node: Element = root;
      while (node !== main && node.parentElement) {
        for (
          let next = node.nextElementSibling;
          next;
          next = next.nextElementSibling
        ) {
          const box = next.getBoundingClientRect();
          const style = getComputedStyle(next);
          if (box.height)
            bottom -=
              box.height +
              parseFloat(style.marginTop || "0") +
              parseFloat(style.marginBottom || "0");
        }
        const style = getComputedStyle(node.parentElement);
        bottom -= parseFloat(style.paddingBottom || "0");
        node = node.parentElement;
      }
      const heights = Array.from(rows.children).map((row) => {
        const style = getComputedStyle(row);
        return (
          row.getBoundingClientRect().height +
          parseFloat(style.marginTop || "0") +
          parseFloat(style.marginBottom || "0")
        );
      });
      const rowHeight = Math.max(1, ...heights);
      const gap = parseFloat(getComputedStyle(rows).rowGap) || 0;
      const available = Math.max(
        0,
        bottom - rows.getBoundingClientRect().top - 8,
      );
      const allFit = items.length * (rowHeight + gap) - gap <= available;
      setCapacity(
        Math.max(
          1,
          Math.floor((available - (allFit ? 0 : 60) + gap) / (rowHeight + gap)),
        ),
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    const main = root.closest("main");
    if (main) observer.observe(main);
    observer.observe(root);
    root
      .querySelectorAll(".paged-items > *")
      .forEach((row) => observer.observe(row));
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  });
  const [index, setIndex] = useState(0);
  const items = Children.toArray(children);
  const count = Math.max(1, Math.ceil(items.length / (size || capacity)));
  const page = Math.min(index, count - 1);
  return (
    <div className="paged-content" ref={container}>
      <div className="paged-items" key={page}>
        {items.slice(
          page * (size || capacity),
          (page + 1) * (size || capacity),
        )}
      </div>
      <Pager page={page} count={count} onChange={setIndex} label={label} />
    </div>
  );
}

/** Retain links while dividing reading into small, complete passages. */
function richWords(node: ReactNode): ReactNode[] {
  if (typeof node === "string" || typeof node === "number")
    return String(node).split(/(\s+)/).filter(Boolean);
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  if (node.type === Fragment)
    return Children.toArray(node.props.children).flatMap(richWords);
  return [node];
}
export function ReadingSections({ children }: { children: ReactNode }) {
  const size = usePageSize();
  const limit = size === 1 ? 26 : size === 2 ? 40 : 65;
  let heading: ReactNode = null;
  const pages: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === "h2") {
      heading = child;
      continue;
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === "p") {
      const tokens = Children.toArray(child.props.children).flatMap(richWords);
      let passage: ReactNode[] = [],
        words = 0;
      for (const token of tokens) {
        passage.push(token);
        words += typeof token === "string" ? (token.trim() ? 1 : 0) : 3;
        if (words >= limit) {
          pages.push(
            <section>
              {heading}
              <p>
                {passage.map((node, i) => (
                  <Fragment key={i}>{node}</Fragment>
                ))}
              </p>
            </section>,
          );
          passage = [];
          words = 0;
        }
      }
      if (passage.length)
        pages.push(
          <section>
            {heading}
            <p>
              {passage.map((node, i) => (
                <Fragment key={i}>{node}</Fragment>
              ))}
            </p>
          </section>,
        );
    } else pages.push(child);
  }
  return (
    <Paged size={1} label="Section">
      {pages.map((page, i) => (
        <Fragment key={i}>{page}</Fragment>
      ))}
    </Paged>
  );
}
