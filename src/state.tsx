import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { cities, type City } from "./lib/data";
import { type Weather } from "./lib/heat";
import { fetchForecast, validWeather, weatherKey } from "./lib/weather";
import { readStored, writeStored } from "./lib/storage";

export function validCity(v: unknown): v is City {
  if (!v || typeof v !== "object") return false;
  const c = v as City;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    c.name.length < 100 &&
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    c.latitude >= 4 &&
    c.latitude <= 22 &&
    c.longitude >= 116 &&
    c.longitude <= 127
  );
}
function useStateValue() {
  const [onboarded,setOnboarded]=useState(()=>readStored("lilimio-onboarded",false,v=>typeof v==="boolean"));
  const [city, setCityState] = useState<City | null>(() =>
    readStored("lilimio-city", null, validCity),
  );
  const [units, setUnitsState] = useState<"C" | "F">(() =>
    readStored("lilimio-units-v2", "C", (v) => v === "C" || v === "F"),
  );
  const [motionPreference, setMotionState] = useState<"system" | "reduced">(
    () =>
      readStored(
        "lilimio-motion-v2",
        "system",
        (v) => v === "system" || v === "reduced",
      ),
  );
  const [online, setOnline] = useState(navigator.onLine);
  const [tick, setTick] = useState(0);
  const manualRefresh = useRef<string | null>(null);
  const [toast, setToast] = useState("");
  const [chooser, setChooser] = useState(false);
  const [forecast, setForecast] = useState<{
    key: string;
    weather: Weather | null;
    loading: boolean;
    error: string;
  }>({ key: "", weather: null, loading: false, error: "" });
  const notify = useCallback((text: string) => setToast(text), []);
  const completeOnboarding=()=>{setOnboarded(true);if(!writeStored("lilimio-onboarded",true))notify("You can continue. Browser storage is unavailable.");};
  const refresh = useCallback(() => {
    manualRefresh.current = city ? weatherKey(city) : null;
    setTick((t) => t + 1);
  }, [city]);
  const revalidate = useCallback(() => setTick((t) => t + 1), []);
  const setCity = useCallback(
    (value: City) => {
      if (!validCity(value)) return;
      setCityState(value);
      if (!writeStored("lilimio-city", value))
        notify(
          "Location changed for this visit. Browser storage is unavailable.",
        );
    },
    [notify],
  );
  const setUnits = (value: "C" | "F") => {
    setUnitsState(value);
    if (!writeStored("lilimio-units-v2", value))
      notify("This preference could not be saved.");
  };
  const setMotionPreference = (value: "system" | "reduced") => {
    setMotionState(value);
    if (!writeStored("lilimio-motion-v2", value))
      notify("This preference could not be saved.");
  };
  useEffect(() => {
    document.documentElement.dataset.motion = motionPreference;
  }, [motionPreference]);
  useEffect(() => {
    const on = () => {
        setOnline(true);
        revalidate();
      },
      off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const timer = setInterval(revalidate, 15 * 60000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [revalidate]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(id);
  }, [toast]);
  const key = city ? weatherKey(city) : "";
  useEffect(() => {
    if (!city) return;
    const requestedManually = manualRefresh.current === key;
    manualRefresh.current = null;
    const controller = new AbortController();
    let active = true;
    const cached = readStored<Weather | null>(key, null, validWeather);
    setForecast((prev) => ({
      key,
      weather: prev.key === key ? prev.weather : cached,
      loading: true,
      error: "",
    }));
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetchForecast(city, controller.signal)
      .then((weather) => {
        if (active) {
          setForecast({ key, weather, loading: false, error: "" });
          writeStored(key, weather);
          if (requestedManually)
            notify("Forecast refreshed. Readings may stay the same between model updates.");
        }
      })
      .catch(() => {
        if (active)
          setForecast((prev) => ({
            ...prev,
            loading: false,
            error: navigator.onLine
              ? "We couldn’t load the latest forecast."
              : "You’re offline. Saved readings may be out of date.",
          }));
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [city, key, tick, notify]);
  const weather = forecast.key === key ? forecast.weather : null;
  const temp = (v: number) =>
    `${Math.round(units === "F" ? (v * 9) / 5 + 32 : v)}°${units}`;
  return {
    onboarded,
    completeOnboarding,
    city,
    setCity,
    units,
    setUnits,
    motionPreference,
    setMotionPreference,
    online,
    weather,
    loading: !!city && (forecast.key !== key || forecast.loading),
    error: forecast.key === key ? forecast.error : "",
    refresh,
    notify,
    toast,
    chooser,
    setChooser,
    temp,
    cities,
  };
}
type State = ReturnType<typeof useStateValue>;
const Context = createContext<State | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const state = useStateValue();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useApp() {
  const state = useContext(Context);
  if (!state) throw new Error("AppProvider missing");
  return state;
}
