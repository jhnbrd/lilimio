import { useParams, Link, useNavigate } from "react-router-dom";
import { Back } from "../ui";
import { useApp } from "../state";
import {
  LegalText,
  legalDocuments,
  type LegalDocument,
} from "../components/legal";
export default function Legal() {
  const navigate = useNavigate();
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

      <h1>{legalDocuments[key].title}</h1>
      <label className="sr-only" htmlFor="legal-document">
        Document
      </label>
      <select
        id="legal-document"
        className="document-select"
        value={key}
        onChange={(event) => navigate(`/legal/${event.target.value}`)}
      >
        {Object.entries(legalDocuments).map(([id, value]) => (
          <option key={id} value={id}>
            {value.title}
          </option>
        ))}
      </select>
      <LegalText document={key} />
      <footer className="article-footer">
        <Link to="/settings/privacy">Manage local data</Link>
        <Link to="/settings/install">Installation preferences</Link>
      </footer>
    </article>
  );
}
