import {
  MapPin,
  ShieldCheck,
  Bell,
  Settings,
  BarChart3,
  Bookmark,
  Download,
} from "lucide-react";
import { Row, Art } from "../ui";
export default function More() {
  return (
    <div className="more-page">
      <h1>More</h1>
      <div className="more-links">
        <Row icon={<MapPin />} to="/explore">
          Find relief
        </Row>
        <Row icon={<ShieldCheck />} to="/learn">
          Safety guides
        </Row>
        <Row icon={<Bell />} to="/updates">
          Local updates
        </Row>
        <Row icon={<Settings />} to="/settings">
          Settings
        </Row>
      </div>
    </div>
  );
}
