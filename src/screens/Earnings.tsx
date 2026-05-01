import { ChevronLeft, Download, TrendingUp, ChevronRight, Wallet } from 'lucide-react';
import { earnings } from '../data/mock';
import type { ScreenId } from '../App';

export function Earnings({ goto }: { goto: (id: ScreenId) => void }) {
  const change = ((earnings.thisWeek - earnings.lastWeek) / earnings.lastWeek) * 100;
  const max = Math.max(...earnings.weeks.map((w) => w.gross));

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-12 scrollbar-none">
        <div className="px-4 pt-12">
          <div className="flex items-center justify-between">
            <button
              onClick={() => goto('instructor-dashboard')}
              className="press-soft -ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-stone-soft"
            >
              <ChevronLeft size={18} />
            </button>
            <button className="press-soft -mr-2 inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[12px] font-medium">
              <Download size={13} />
              Statements
            </button>
          </div>
        </div>

        <header className="px-5 pt-2">
          <div className="label-eyebrow">Earnings</div>
          <h1 className="font-display mt-1 text-[28px] leading-tight">Year to date</h1>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display num text-[44px] leading-none">${earnings.ytd.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1 text-[12px] text-sage">
              <TrendingUp size={12} />
              <span className="num">+{change.toFixed(0)}%</span>
              <span className="text-ink-60">vs last week</span>
            </span>
          </div>
        </header>

        {/* Bar chart */}
        <section className="mt-7 mx-5 rounded-[20px] border border-stone p-5">
          <div className="flex items-baseline justify-between">
            <div className="label-eyebrow">Last 5 weeks</div>
            <span className="num text-[12px] text-ink-60">USD</span>
          </div>
          <div className="mt-5 grid grid-cols-5 items-end gap-2 h-32">
            {[...earnings.weeks].reverse().map((w) => {
              const pct = (w.gross / max) * 100;
              const isCurrent = w.label === 'This week';
              return (
                <div key={w.label} className="flex flex-col items-center gap-2">
                  <span className="num text-[10px] text-ink-60">${w.gross}</span>
                  <div
                    className={[
                      'w-full rounded-t-md transition-all',
                      isCurrent ? 'bg-clay' : 'bg-sand',
                    ].join(' ')}
                    style={{ height: `${pct}%`, minHeight: 4 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {[...earnings.weeks].reverse().map((w) => (
              <div key={w.label} className="text-center text-[10px] text-ink-60 num">
                {w.start.split(' ')[1]}
              </div>
            ))}
          </div>
        </section>

        {/* Next payout */}
        <section className="mt-5 mx-5 rounded-[20px] bg-ink p-5 text-bone">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-eyebrow !text-bone/60">Next payout</div>
              <div className="mt-1 font-display num text-[28px] leading-none">
                ${earnings.nextPayout.amount}
              </div>
              <div className="mt-1.5 text-[12px] text-bone/70">
                {earnings.nextPayout.date} · {earnings.nextPayout.method}
              </div>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-bone/10">
              <Wallet size={20} />
            </span>
          </div>
          <button className="press-soft mt-5 inline-flex h-9 items-center rounded-full bg-bone/12 px-4 text-[12px] font-medium text-bone">
            Change payout method
          </button>
        </section>

        {/* Weekly statements */}
        <section className="mt-7 px-5">
          <div className="label-eyebrow">Statements</div>
          <ul className="mt-3 space-y-2">
            {earnings.weeks.map((w) => (
              <li key={w.label}>
                <button className="press-soft flex w-full items-center gap-3 rounded-2xl bg-bone p-4 text-start hairline-b">
                  <div className="flex-1">
                    <div className="text-[14px] font-medium">{w.label}</div>
                    <div className="mt-0.5 text-[12px] text-ink-60 num">
                      {w.classes} classes · {w.hours.toFixed(1)} hrs
                      {w.paidOn ? ` · paid ${w.paidOn}` : ''}
                    </div>
                  </div>
                  <span className="num text-[15px] font-medium">${w.gross}</span>
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      w.status === 'paid' ? 'bg-sage/15 text-sage' : 'bg-rose/60 text-ink',
                    ].join(' ')}
                  >
                    {w.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                  <ChevronRight size={14} className="text-ink-60" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Notes */}
        <section className="mt-7 mx-5 rounded-2xl bg-sand p-5">
          <div className="label-eyebrow">How payouts work</div>
          <p className="mt-2 text-[13px] leading-[1.55] text-ink/85">
            Earnings are tallied each Sunday at 23:59. Payouts are sent the following Monday by 18:00,
            via Whish or bank transfer (your choice in Settings). Statements are downloadable as PDF
            for the last 12 months.
          </p>
        </section>
      </div>
    </div>
  );
}
