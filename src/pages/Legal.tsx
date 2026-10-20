import { useParams, Link } from "react-router-dom";
import { Back } from "../ui";
import { useApp } from "../state";
import {
  LegalText,
  LegalLinks,
  legalDocuments,
  type LegalDocument,
} from "../components/legal";
export default function Legal() {
  const { document } = useParams();
  const { onboarded } = useApp();
  const key: LegalDocument =
    document && Object.hasOwn(legalDocuments, document)
      ? (document as LegalDocument)
      : "terms";
  return (
    <article className="legal-page">
      <Back
        to={onboarded ? "/settings" : "/welcome"}
        label={onboarded ? "Settings" : "Welcome"}
      />
      <p className="eyebrow">Free for public use · No account required</p>
      <h1>{legalDocuments[key].title}</h1>
      <LegalLinks />
      <LegalText document={key} />
      <footer className="article-footer">
        <Link to="/settings/privacy">Manage local data</Link>
        <Link to="/settings/install">Installation preferences</Link>
      </footer>
    </article>
  );
}
