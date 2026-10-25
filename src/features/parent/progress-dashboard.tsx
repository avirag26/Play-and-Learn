import Link from "next/link";
import { Card } from "@/components/ui/card";
import { describeLastPlayed, type GameReport, type ParentReport, type ProgressStatus } from "@/lib/parent-report";

const statusStyles: Record<ProgressStatus, { label: string; className: string; icon: string }> = {
  "not-started": { label: "Not started", className: "bg-cream text-muted-ink", icon: "○" },
  "in-progress": { label: "In progress", className: "bg-sunshine/60 text-ink", icon: "◐" },
  completed: { label: "Completed", className: "bg-mint text-ink", icon: "✓" },
};

const percentText = (value: number | null) => value === null ? "—" : `${Math.round(value * 100)}%`;

export function StatusBadge({ status }: { status: ProgressStatus }) {
  const style = statusStyles[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${style.className}`}><span aria-hidden="true">{style.icon}</span>{style.label}</span>;
}

function Meter({ done, total, label, thick = false }: { done: number; total: number; label: string; thick?: boolean }) {
  const percent = total ? Math.round(Math.min(done, total) / total * 100) : 0;
  return <div className={`overflow-hidden rounded-full bg-cream ${thick ? "h-4" : "h-2.5"}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(done, total)} aria-valuetext={`${done} of ${total}`}><div className="h-full rounded-full bg-[#6ab484] transition-[width]" style={{ width: `${percent}%` }} /></div>;
}

function Stat({ value, label, tint }: { value: string; label: string; tint: string }) {
  return <div className={`rounded-2xl p-4 ${tint}`}><p className="text-2xl font-black text-ink">{value}</p><p className="text-sm font-bold text-muted-ink">{label}</p></div>;
}

export function ProgressOverview({ report, missionsDone, missionsTotal, now }: { report: ParentReport; missionsDone: number; missionsTotal: number; now: number }) {
  return <Card className="bg-white p-6 sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-2xl font-black text-ink">Learning overview</h2><p className="mt-1 text-sm leading-6 text-muted-ink">Last played: <span className="font-black text-ink">{describeLastPlayed(report.lastPlayed, now)}</span></p></div>
      <StatusBadge status={report.status} />
    </div>
    <div className="mt-5"><div className="mb-2 flex items-baseline justify-between gap-3"><span className="text-sm font-black text-ink">Overall progress</span><span className="text-2xl font-black text-ink">{report.percent}%</span></div><Meter done={report.percent} total={100} label="Overall progress across all games" thick /></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat value={`${report.gamesStarted} / ${report.games.length}`} label={`games started (${report.gamesCompleted} completed)`} tint="bg-sky" />
      <Stat value={`${report.activitiesDone} / ${report.activitiesTotal}`} label="activities finished" tint="bg-lavender/50" />
      <Stat value={percentText(report.accuracy)} label={report.attempted ? `quiz score (${report.correct} of ${report.attempted} correct)` : "quiz score (no quizzes yet)"} tint="bg-sunshine/40" />
      <Stat value={`${missionsDone} / ${missionsTotal}`} label="home missions done" tint="bg-mint" />
    </div>
    <p className="mt-5 text-xs leading-5 text-muted-ink">Progress is saved only in this browser on this device. Percentages average each game&apos;s goals, such as activities finished and letters discovered.</p>
  </Card>;
}

export function GameProgressCard({ report, now }: { report: GameReport; now: number }) {
  return <Card className="bg-white p-6 sm:p-8">
    <div className="flex items-start gap-4">
      <span aria-hidden="true" className={`grid size-14 shrink-0 place-items-center rounded-full text-3xl ${report.tint}`}>{report.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-black text-ink">{report.title}</h3><StatusBadge status={report.status} /></div>
        <p className="mt-1 text-sm text-muted-ink">Last played: <span className="font-bold text-ink">{describeLastPlayed(report.lastPlayed, now)}</span></p>
      </div>
    </div>
    <div className="mt-5"><div className="mb-2 flex items-baseline justify-between"><span className="text-sm font-black text-ink">Game progress</span><span className="text-lg font-black text-ink">{report.percent}%</span></div><Meter done={report.percent} total={100} label={`${report.title} progress`} thick /></div>
    <ul className="mt-5 grid gap-3 sm:grid-cols-2">{report.milestones.map((item) => <li key={item.label} className="rounded-2xl bg-cream p-3"><div className="mb-2 flex items-baseline justify-between gap-2 text-sm"><span className="font-bold text-muted-ink">{item.label}</span><span className="font-black text-ink">{item.done} / {item.total}</span></div><Meter done={item.done} total={item.total} label={`${report.title}: ${item.label}`} /></li>)}</ul>
    <div className="mt-5"><h4 className="text-sm font-black text-ink">Activities</h4><ul className="mt-2 flex flex-wrap gap-2">{report.activities.map((activity) => <li key={activity.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${statusStyles[activity.status].className}`}><span aria-hidden="true">{statusStyles[activity.status].icon}</span>{activity.label}<span className="sr-only">: {statusStyles[activity.status].label}</span></li>)}</ul></div>
    <p className="mt-4 text-sm text-muted-ink">{report.summary ? <><span className="font-black text-ink">{report.summary.label}:</span> {report.summary.text}</> : <><span className="font-black text-ink">Quiz score:</span> {report.attempted ?`${percentText(report.accuracy)} (${report.correct} of ${report.attempted} questions correct)` : "No quiz questions answered yet"}</>}</p>
    {report.stillToMeet.items.length ? <details className="mt-4 rounded-2xl bg-cream p-3"><summary className="cursor-pointer text-sm font-black text-ink">{report.stillToMeet.label} ({report.stillToMeet.items.length})</summary><ul className="mt-3 flex flex-wrap gap-1.5">{report.stillToMeet.items.map((item) => <li key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-ink">{item}</li>)}</ul></details> : null}
    <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-sky p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-ink"><span className="font-black">Suggested next step:</span> {report.nextStep}</p><Link href={report.href} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white shadow-[0_3px_0_#22384c] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">Open game →</Link></div>
  </Card>;
}
