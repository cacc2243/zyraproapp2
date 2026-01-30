import { useEffect } from "react";

type Offender = {
  el: HTMLElement;
  overflowPx: number;
  rect: DOMRect;
  selector: string;
};

function getSelector(el: HTMLElement) {
  const parts: string[] = [];
  let cur: HTMLElement | null = el;
  let safety = 0;
  while (cur && safety < 5) {
    const tag = cur.tagName.toLowerCase();
    const id = cur.id ? `#${cur.id}` : "";
    const cls = cur.className
      ? `.${String(cur.className)
          .trim()
          .split(/\s+/)
          .slice(0, 3)
          .join(".")}`
      : "";
    parts.unshift(`${tag}${id}${cls}`);
    cur = cur.parentElement;
    safety++;
  }
  return parts.join(" > ");
}

/**
 * DEV helper: logs and outlines elements whose bounding rect exceeds viewport width.
 * Enable via: /checkout?debugOverflow=1
 */
export function useOverflowDebug(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const clear = () => {
      document.querySelectorAll<HTMLElement>("[data-overflow-debug='1']").forEach((n) => {
        n.style.outline = "";
        n.style.outlineOffset = "";
        n.removeAttribute("data-overflow-debug");
      });
    };

    const run = () => {
      clear();
      const vw = window.innerWidth;
      const offenders: Offender[] = [];

      document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
        // Skip elements that don't render boxes
        const rect = el.getBoundingClientRect?.();
        if (!rect || rect.width === 0 || rect.height === 0) return;

        const overflowRight = rect.right - vw;
        const overflowLeft = 0 - rect.left;
        const overflowPx = Math.max(overflowRight, overflowLeft);
        if (overflowPx > 1) {
          offenders.push({ el, overflowPx, rect, selector: getSelector(el) });
        }
      });

      offenders.sort((a, b) => b.overflowPx - a.overflowPx);
      const top = offenders.slice(0, 12);

      // Outline offenders
      top.forEach((o) => {
        o.el.setAttribute("data-overflow-debug", "1");
        o.el.style.outline = "2px solid hsl(var(--destructive))";
        o.el.style.outlineOffset = "2px";
      });

      // Log summary
      // eslint-disable-next-line no-console
      console.groupCollapsed(
        `[overflow-debug] vw=${vw}px | offenders=${offenders.length} (showing ${top.length})`,
      );
      top.forEach((o) => {
        // eslint-disable-next-line no-console
        console.warn(
          `[overflow-debug] +${Math.round(o.overflowPx)}px | right=${Math.round(o.rect.right)} left=${Math.round(
            o.rect.left,
          )} | ${o.selector}`,
          o.el,
        );
      });
      // eslint-disable-next-line no-console
      console.groupEnd();
    };

    // Run a couple times (after paint / images)
    const t1 = window.setTimeout(run, 50);
    const t2 = window.setTimeout(run, 600);
    window.addEventListener("resize", run);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", run);
      clear();
    };
  }, [enabled]);
}
