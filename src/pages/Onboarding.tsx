import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Info } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useApp } from "../state";
import { writeStored } from "../lib/storage";
import { Art, Button, CityPicker, Wordmark, Modal } from "../ui";
import { WelcomeMotion } from "../motion";
import {
  LegalLinks,
  LegalText,
  legalDocuments,
  type LegalDocument,
} from "../components/legal";
import { acknowledgement, TERMS_KEY } from "../lib/notices";
export default function Onboarding() {
  const { city, setCity, notify, motionPreference, completeOnboarding } =
    useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [destination, setDestination] = useState("/");
  useEffect(() => {
    const h = document.querySelector<HTMLElement>(".onboarding-copy h1");
    h?.setAttribute("tabindex", "-1");
    h?.focus({ preventScroll: true });
  }, [step]);
  const reduce = useReducedMotion() || motionPreference === "reduced";
  function finish() {
    if (!agreed) return;
    if (!writeStored(TERMS_KEY, acknowledgement()))
      notify(
        "You can continue. Your agreement could not be saved on this device.",
      );
    completeOnboarding();
    navigate(destination, { replace: true });
  }
  return (
    <div className="onboarding-shell">
      <div className="onboarding-frame">
        <header>
          {step === 0 ? (
            <Wordmark />
          ) : (
            <button
              className="icon-button"
              aria-label="Previous step"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft />
            </button>
          )}
          <div className="progress-dots" aria-label={`Step ${step + 1} of 3`}>
            {[0, 1, 2].map((n) => (
              <span className={n === step ? "current" : ""} key={n} />
            ))}
          </div>
        </header>
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
        >
          <WelcomeMotion>
            <div className="onboarding-art landscape">
              <Art
                scene={step === 0 ? "welcome" : step === 1 ? "city" : "ready"}
              />
            </div>
            <section className="onboarding-copy welcome-copy">
              {step === 0 ? (
                <>
                  <h1>
                    Know the heat.
                    <br />
                    Find your shade.
                  </h1>
                  <p>A little guidance for everyday outdoor plans.</p>
                  <Button onClick={() => setStep(1)}>
                    Get started <ArrowRight size={21} />
                  </Button>
                  <Button variant="text" onClick={() => setStep(2)}>
                    Explore first
                  </Button>
                </>
              ) : step === 1 ? (
                <>
                  <h1>Where’s your day?</h1>
                  <p>Choose a city for your heat outlook.</p>
                  <CityPicker
                    chosen={city}
                    onChoose={(c) => {
                      setCity(c);
                      setStep(2);
                    }}
                    onBrowse={() => {
                      setDestination("/learn");
                      setStep(2);
                    }}
                  />
                </>
              ) : (
                <>
                  <h1>Make room for shade.</h1>
                  <p>
                    Check the outlook, compare outdoor times, and find places to
                    cool down.
                  </p>
                  <button
                    className="onboarding-city row"
                    onClick={() => setStep(1)}
                  >
                    <MapPin />
                    <span className="row-copy">
                      Your city<strong>{city?.name || "Choose later"}</strong>
                    </span>
                    <span>Change</span>
                  </button>
                  <div className="info-line">
                    <Info size={25} />
                    <p>Heat estimates guide planning. Conditions can change.</p>
                  </div>
                  <label className="terms-choice">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span>
                      I agree to the terms of use and have read the privacy
                      notice.
                    </span>
                  </label>
                  <div className="agreement-links">
                    <button onClick={() => setLegal("terms")}>
                      Read terms
                    </button>
                    <button onClick={() => setLegal("privacy")}>
                      Read privacy notice
                    </button>
                  </div>
                  <Button onClick={finish} disabled={!agreed}>
                    {destination === "/learn"
                      ? "Open safety guides"
                      : "Open lilimio"}{" "}
                    <ArrowRight size={21} />
                  </Button>
                  <p className="muted agreement-note">
                    Location, notifications and installation stay optional. You
                    can also <Link to="/learn">read safety guides</Link> without
                    completing setup.
                  </p>
                </>
              )}
            </section>
          </WelcomeMotion>
        </motion.div>
        <footer className="onboarding-legal">
          <p>Free for public use. No account needed.</p>
          <LegalLinks onSelect={setLegal} />
        </footer>
      </div>
      <Art scene="bottom" className="onboarding-bottom" />
      {legal && (
        <Modal
          title={legalDocuments[legal].title}
          onClose={() => setLegal(null)}
        >
          <LegalText document={legal} />
          <Button variant="outline" onClick={() => setLegal(null)}>
            Back to setup
          </Button>
        </Modal>
      )}
    </div>
  );
}
