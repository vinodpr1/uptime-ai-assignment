import { useEffect, useMemo, useRef, useState } from "react";
import { init, use as registerEcharts, type EChartsCoreOption, type EChartsType } from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  VisualMapPiecewiseComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { buildCalendar, contributionYears, formatContributionDate } from "../calendar";
import type { ActivityData, ContributionData, GitHubOrg } from "../types";
import { cn } from "../lib/cn";
import { sectionTitle } from "../ui/layout";
import { ActivityOverview } from "./ActivityOverview";
import { CaretIcon } from "./Icons";

registerEcharts([
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  VisualMapPiecewiseComponent,
  CanvasRenderer,
]);

const LEVEL_COLORS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ContributionGraphProps {
  data: ContributionData | null;
  activity: ActivityData | null;
  orgs: GitHubOrg[];
  loading: boolean;
  activityLoading: boolean;
  error: string | null;
}

function chartOption(
  model: ReturnType<typeof buildCalendar>,
  bounds: { left: number; right: number; top: number; bottom: number },
): EChartsCoreOption {
  return {
    animation: false,
    tooltip: {
      trigger: "item",
      backgroundColor: "#24292f",
      borderWidth: 0,
      padding: [6, 10],
      textStyle: { color: "#ffffff", fontSize: 12 },
      extraCssText: "border-radius: 6px;",
      formatter: (raw: unknown) => {
        const params = raw as { data?: { count?: number; date?: string } };
        const count = params.data?.count ?? 0;
        const date = params.data?.date ? formatContributionDate(params.data.date) : "";
        if (!date) return "";
        if (count === 0) return `No contributions on ${date}`;
        const noun = count === 1 ? "contribution" : "contributions";
        return `${count} ${noun} on ${date}`;
      },
    },
    grid: {
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
    },
    xAxis: {
      type: "category",
      data: Array.from({ length: model.weekCount }, (_, index) => String(index)),
      position: "top",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        color: "#656d76",
        fontSize: 12,
        interval: 0,
        formatter: (value: string) => model.monthLabels[Number(value)] ?? "",
      },
    },
    yAxis: {
      type: "category",
      data: WEEKDAYS,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
    },
    visualMap: {
      type: "piecewise",
      show: false,
      dimension: 2,
      pieces: LEVEL_COLORS.map((color, level) => ({
        min: level,
        max: level,
        color,
      })),
    },
    series: [
      {
        type: "heatmap",
        data: model.cells.map((cell) => ({
          value: [String(cell.week), WEEKDAYS[cell.day], cell.level],
          count: cell.count,
          date: cell.date,
        })),
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 3,
          borderRadius: 2,
        },
        emphasis: {
          itemStyle: {
            borderColor: "#1f2328",
            borderWidth: 1,
          },
        },
        progressive: 0,
      },
    ],
  };
}

function YearList({
  years,
  activeYear,
  onSelect,
}: {
  years: number[];
  activeYear: number | null;
  onSelect: (year: number) => void;
}) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-stretch gap-0.5 pt-4 max-md:w-full max-md:flex-row max-md:flex-wrap max-md:gap-1 max-md:pt-0">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          className={cn(
            "rounded-md border-0 px-1.5 py-0.5 text-center text-xs leading-5 hover:bg-gray-200",
            year === activeYear
              ? "bg-blue-500 text-white"
              : "font-normal",
          )}
          onClick={() => onSelect(year)}
        >
          {year}
        </button>
      ))}
    </div>
  );
}

export function ContributionGraph({
  data,
  activity,
  orgs,
  loading,
  activityLoading,
  error,
}: ContributionGraphProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const years = useMemo(() => (data ? contributionYears(data.totalsByYear) : []), [data]);
  const activeYear = selectedYear ?? years[0] ?? null;
  const isRolling = activeYear !== null && activeYear === years[0];

  const days = useMemo(() => {
    if (!data || activeYear === null) return [];
    if (isRolling) return data.lastYear;
    return data.allDays.filter((day) => day.date.startsWith(`${activeYear}-`));
  }, [data, activeYear, isRolling]);

  const model = useMemo(() => buildCalendar(days), [days]);
  const total = isRolling ? (data?.lastYearTotal ?? 0) : (data?.totalsByYear[String(activeYear)] ?? 0);
  const heading = isRolling
    ? `${total.toLocaleString()} contributions in the last year`
    : `${total.toLocaleString()} contributions in ${activeYear}`;

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [settingsOpen]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element || model.weekCount === 0) return;

    const chart = chartRef.current ?? init(element, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    let lastWidth = 0;

    const apply = () => {
      const width = element.clientWidth;
      if (width === 0 || width === lastWidth) return;
      lastWidth = width;
      const left = 2;
      const right = 6;
      const top = 22;
      const bottom = 2;
      const cell = Math.max(10, (width - left - right) / model.weekCount);
      element.style.height = `${Math.round(top + bottom + cell * 7)}px`;
      chart.setOption(chartOption(model, { left, right, top, bottom }), true);
      chart.resize();
    };

    apply();
    const observer = new ResizeObserver(() => apply());
    observer.observe(element);
    return () => observer.disconnect();
  }, [model]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="flex min-w-0 items-start gap-2 max-md:flex-col">
      <section className="min-w-0 flex-1 rounded-md border border-border bg-canvas px-4 pt-4 pb-2">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className={sectionTitle}>{loading && !data ? "Contributions" : heading}</h2>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              className="inline-flex items-center gap-1 border-0 bg-transparent p-1 text-xs text-muted hover:text-fg [&_svg]:size-3.5"
              onClick={() => setSettingsOpen((open) => !open)}
            >
              Contribution settings
              <CaretIcon />
            </button>
            {settingsOpen && (
              <div
                className="absolute top-7 right-0 z-[5] w-[260px] rounded-md border border-border bg-white p-3 text-xs text-fg shadow-[0_8px_24px_rgba(140,149,159,0.2)]"
              >
                <p className="m-0">Showing public contributions from the GitHub contribution calendar.</p>
              </div>
            )}
          </div>
        </div>

        {loading && !data ? (
          <div className="skeleton mt-2 h-40" />
        ) : error && !data ? (
          <p className="text-danger">{error}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex min-w-[720px] items-stretch">
                <div className="grid w-[27px] shrink-0 grid-rows-[22px_repeat(7,1fr)] pb-0.5 text-[11px] leading-none text-muted">
                  <span />
                  <span />
                  <span className="flex items-center">Mon</span>
                  <span />
                  <span className="flex items-center">Wed</span>
                  <span />
                  <span className="flex items-center">Fri</span>
                  <span />
                </div>
                <div ref={canvasRef} className="min-w-0 flex-1 w-full" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <a
                href="https://docs.github.com/en/account-and-profile/how-to-contribute-to-your-profile/viewing-contributions-on-your-profile"
                target="_blank"
                rel="noreferrer"
              >
                Learn how we count contributions
              </a>
              <div className="flex shrink-0 items-center gap-1 text-muted">
                <span>Less</span>
                {LEVEL_COLORS.map((color) => (
                  <span key={color} className="inline-block size-[11px] rounded-[2px]" style={{ background: color }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </>
        )}

        <ActivityOverview activity={activity} loading={activityLoading} orgs={orgs} />
      </section>

      {!loading && data && years.length > 0 && (
        <YearList years={years} activeYear={activeYear} onSelect={setSelectedYear} />
      )}
    </div>
  );
}
