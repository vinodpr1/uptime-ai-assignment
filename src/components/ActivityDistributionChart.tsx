import type { ActivityDistributionModel } from "../activity/overviewData";

interface ActivityDistributionChartProps {
  model: ActivityDistributionModel;
}

export function ActivityDistributionChart({ model }: ActivityDistributionChartProps) {
  const { center, radius, polygonPath, labels } = model;
  const { x: cx, y: cy } = center;

  return (
    <svg
      className="block h-auto w-full max-w-[360px]"
      viewBox="0 0 400 224"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={cx - radius}
        y1={cy}
        x2={cx + radius}
        y2={cy}
        stroke="#d0d7de"
        strokeWidth="1.5"
      />
      <line
        x1={cx}
        y1={cy - radius}
        x2={cx}
        y2={cy + radius}
        stroke="#d0d7de"
        strokeWidth="1.5"
      />
      {polygonPath && (
        <path
          d={polygonPath}
          fill="rgba(26,127,55,0.16)"
          stroke="#1a7f37"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {labels.map((item) => (
        <text key={item.key} x={item.x} y={item.y} textAnchor={item.textAnchor} fill={item.color}>
          {item.active && (
            <tspan x={item.x} dy={0} fontSize="13" fontWeight="600">
              {item.percent}%
            </tspan>
          )}
          <tspan x={item.x} dy={item.labelDy} fontSize="12">
            {item.label}
          </tspan>
        </text>
      ))}
    </svg>
  );
}
