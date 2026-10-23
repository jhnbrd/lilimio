import { useState, useId, useEffect } from "react";
import { useApp } from "../state";
import type { Hour } from "../lib/heat";
import { dateLabel, timeLabel } from "../lib/weather";
export function Chart({
  hours,
  onSelect,
}: {
  hours: Hour[];
  onSelect?: (h: Hour) => void;
}) {
  const [narrow, setNarrow] = useState(window.innerWidth < 768);
  useEffect(() => {
    const media = window.matchMedia("(max-width:767px)");
    const change = () => setNarrow(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const width = narrow ? 320 : 560;
  const { temp, units } = useApp();
  const id = useId().replace(/:/g, "");
  if (!hours.length) return <p>No upcoming hourly estimates are available.</p>;
  const values = hours.map((h) =>
      units === "F" ? (h.heatIndex * 9) / 5 + 32 : h.heatIndex,
    ),
    min = Math.floor((Math.min(...values) - 3) / 5) * 5,
    max = Math.ceil((Math.max(...values) + 3) / 5) * 5;
  const points = values.map((v, i) => [
    30 +
      (hours.length === 1
        ? (width - 60) / 2
        : (i * (width - 60)) / (hours.length - 1)),
    190 - ((v - min) / (max - min)) * 150,
  ]);
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  return (
    <div className="chart">
      <p className="chart-unit">Estimated heat index (°{units})</p>
      <svg
        viewBox={`0 0 ${width} 240`}
        role="img"
        aria-label="Upcoming heat-index forecast. Read the values listed below."
      >
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb63f" stopOpacity=".24" />
            <stop offset="100%" stopColor="#ffb63f" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="30"
              y1={40 + i * 50}
              x2={width - 30}
              y2={40 + i * 50}
              stroke="#dfe2d9"
            />
            <text x="2" y={46 + i * 50} fill="#647184" fontSize="14">
              {Math.round(max - (i * (max - min)) / 3)}
            </text>
          </g>
        ))}
        <path
          d={`${path}L${points.at(-1)![0]},190L${points[0][0]},190Z`}
          fill={`url(#fill-${id})`}
        />
        <path
          d={path}
          fill="none"
          stroke="#f4a124"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <g key={hours[i].time}>
            <circle
              cx={x}
              cy={y}
              r="5.5"
              fill="#ffaa26"
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x={x}
              y={y - 15}
              textAnchor="middle"
              fontSize={narrow ? 18 : 15}
              fill="#142d32"
            >
              {Math.round(values[i])}°
            </text>
            <text
              x={x}
              y="222"
              textAnchor="middle"
              fontSize={narrow ? 14 : 12}
              fill="#647184"
            >
              {timeLabel(hours[i].time).replace(":00", "")}
            </text>
          </g>
        ))}
      </svg>
      <details className="chart-values">
        <summary>Read chart values</summary>
        {hours.map((h) => (
          <div className="chart-value" key={h.time}>
            {onSelect ? (
              <button onClick={() => onSelect(h)}>
                {dateLabel(h.time, {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                : {temp(h.heatIndex)}
              </button>
            ) : (
              <span>
                {dateLabel(h.time, {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                : {temp(h.heatIndex)}
              </span>
            )}
          </div>
        ))}
      </details>
    </div>
  );
}
