import {
  ClipboardCheck,
  Compass,
  MessageSquareText,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  formatAnalysisSummary,
  type SummarySectionTone,
} from "@/lib/analysis/summary-format";

type AiSummaryCardProps = {
  dataSource: string;
  indicators: string[];
  recommendation: string;
  summary: string;
  timeframe: string;
  weights: {
    fundamental: number;
    sentiment: number;
    technical: number;
  };
};

const toneStyles: Record<
  SummarySectionTone,
  { accent: string; icon: typeof Compass; iconWrap: string; section: string }
> = {
  action: {
    accent: "text-primary",
    icon: ClipboardCheck,
    iconWrap: "bg-primary/10 text-primary",
    section: "border-primary/20 bg-primary/5",
  },
  neutral: {
    accent: "text-surface-tint",
    icon: Compass,
    iconWrap: "bg-muted text-surface-tint",
    section: "border-border bg-white",
  },
  positive: {
    accent: "text-finance-success",
    icon: TrendingUp,
    iconWrap: "bg-finance-success/10 text-finance-success",
    section: "border-finance-success/20 bg-finance-success/5",
  },
  risk: {
    accent: "text-destructive",
    icon: ShieldAlert,
    iconWrap: "bg-destructive/10 text-destructive",
    section: "border-destructive/20 bg-destructive/5",
  },
};

export function AiSummaryCard({
  dataSource,
  indicators,
  recommendation,
  summary,
  timeframe,
  weights,
}: AiSummaryCardProps) {
  const formattedSummary = formatAnalysisSummary(summary);

  return (
    <div className="rounded-[24px] border border-border bg-white p-6 shadow-[0_12px_32px_rgba(55,49,45,0.04)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-muted p-3 text-surface-tint">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-on-surface">Summary</h2>
          <p className="text-sm text-muted-foreground">
            Blended output from analysis services.
          </p>
        </div>
      </div>

      {formattedSummary.headline ? (
        <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            AI thesis
          </p>
          <h3 className="mt-2 text-lg font-semibold leading-6 text-on-surface">
            {formattedSummary.headline}
          </h3>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {formattedSummary.sections.map((section) => {
          const tone = toneStyles[section.tone];
          const Icon = tone.icon;

          return (
            <section
              key={`${section.title}-${section.body.slice(0, 24)}`}
              className={`rounded-2xl border p-4 ${tone.section}`}
            >
              <div className="flex gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.iconWrap}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm font-semibold ${tone.accent}`}>
                    {section.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface">
                    {section.body}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <dl className="mt-6 grid gap-4 rounded-[20px] bg-card p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Timeframe</dt>
          <dd className="mt-1 font-medium text-on-surface">{timeframe}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Weights</dt>
          <dd className="mt-1 font-medium text-on-surface">
            F {weights.fundamental}% / T {weights.technical}% / S{" "}
            {weights.sentiment}%
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Indicators</dt>
          <dd className="mt-1 font-medium text-on-surface">
            {indicators.length > 0 ? indicators.join(", ") : "None enabled"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Recommendation</dt>
          <dd className="mt-1 font-medium text-on-surface">
            {recommendation}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Data source</dt>
          <dd className="mt-1 font-medium text-on-surface">{dataSource}</dd>
        </div>
      </dl>
    </div>
  );
}
