import { Fragment } from "react";
import { Link } from "react-router-dom";
import terms from "../../TERMS.md?raw";
import privacy from "../../PRIVACY.md?raw";
import license from "../../LICENSE.md?raw";
import sources from "../../THIRD_PARTY_NOTICES.md?raw";
import fontLicense from "../assets/fonts/LICENSE?raw";

export const legalDocuments = {
  terms: { title: "Terms of use", text: terms },
  privacy: { title: "Privacy & storage", text: privacy },
  sources: { title: "Data & licenses", text: sources },
  license: { title: "Application license", text: license },
};
export type LegalDocument = keyof typeof legalDocuments;
function inline(text: string) {
  return text.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (!match) return part;
    const href = match[2];
    if (href.startsWith("/"))
      return (
        <Link key={i} to={href}>
          {match[1]}
        </Link>
      );
    if (href.endsWith(".md")) {
      const route = href === "TERMS.md" ? "terms" : "sources";
      return (
        <Link key={i} to={`/legal/${route}`}>
          {match[1]}
        </Link>
      );
    }
    return (
      <a key={i} href={href} target="_blank" rel="noreferrer">
        {match[1]}
      </a>
    );
  });
}
export function LegalText({ document }: { document: LegalDocument }) {
  return (
    <div className="legal-prose">
      {legalDocuments[document].text
        .split(/\r?\n\r?\n/)
        .filter(Boolean)
        .map((block, i) => {
          if (block.startsWith("# ")) return null;
          if (block.startsWith("## ")) return <h2 key={i}>{block.slice(3)}</h2>;
          return <p key={i}>{inline(block.replace(/\r?\n/g, " "))}</p>;
        })}
      {document === "sources" && (
        <details>
          <summary>Complete Plus Jakarta Sans font license</summary>
          <pre>{fontLicense}</pre>
        </details>
      )}
    </div>
  );
}
export function LegalLinks({
  onSelect,
}: {
  onSelect?: (document: LegalDocument) => void;
}) {
  return (
    <nav className="legal-links" aria-label="Legal information">
      {(Object.keys(legalDocuments) as LegalDocument[]).map((key, i) => (
        <Fragment key={key}>
          {i > 0 && <span aria-hidden="true">·</span>}
          {onSelect ? (
            <button onClick={() => onSelect(key)}>
              {legalDocuments[key].title}
            </button>
          ) : (
            <Link to={`/legal/${key}`}>{legalDocuments[key].title}</Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
