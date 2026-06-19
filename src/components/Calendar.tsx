import { useEffect, useMemo, useRef, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  subWeeks,
  getDay,
} from 'date-fns';
import { EyeOff } from 'lucide-react';
import { MoonEntry } from '../storage/types';
import { getObjectUrl } from '../storage/objectUrlCache';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  entries: Record<string, MoonEntry>;
}

interface DayCellInfo {
  date: Date;
  dayStr: string;
  dayNum: number;
  entry?: MoonEntry;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
}

interface Week {
  key: string;
  days: (DayCellInfo | null)[];
  separatorLabel: string | null;
}

// A month-week segment is a maximal run of consecutive days that are both in
// the same calendar month and within the same Sun-Sat week. The calendar is
// the flat chronological sequence of these segments. A new segment begins on
// Sunday (week boundary) or whenever the month changes.
function splitIntoMonthWeekSegments(days: Date[]): Date[][] {
  return days.reduce<Date[][]>((segments, day) => {
    const current = segments[segments.length - 1];
    const last = current?.[current.length - 1];
    const startsNewSegment = !last || getDay(day) === 0 || !isSameMonth(day, last);
    if (startsNewSegment) segments.push([day]);
    else current!.push(day);
    return segments;
  }, []);
}

// A separator label appears on the first segment of each new month; the year
// suffix appears on the first label overall and on the first segment of each
// subsequent calendar year. Both decisions compare only to the prior segment.
function labelFor(prevFirst: Date | undefined, first: Date): string | null {
  if (prevFirst && isSameMonth(prevFirst, first)) return null;
  const showYear = !prevFirst || prevFirst.getFullYear() !== first.getFullYear();
  return format(first, showYear ? 'MMMM yyyy' : 'MMMM');
}

function buildWeeks({
  entries,
  today,
  selectedDate,
}: {
  entries: Record<string, MoonEntry>;
  today: Date;
  selectedDate: Date;
}): Week[] {
  const byDate = new Map<string, MoonEntry>();
  for (const entry of Object.values(entries)) {
    if (entry.date) byDate.set(entry.date, entry);
  }

  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedStr = format(selectedDate, 'yyyy-MM-dd');

  let earliestEntryDate = new Date();
  for (const dateStr of byDate.keys()) {
    const entryDate = new Date(dateStr);
    if (isBefore(entryDate, earliestEntryDate)) earliestEntryDate = entryDate;
  }

  const start = startOfWeek(subWeeks(earliestEntryDate, 1), { weekStartsOn: 0 });
  const end = endOfWeek(today, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start, end });

  const segments = splitIntoMonthWeekSegments(allDays);

  const toDayCell = (day: Date): DayCellInfo => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return {
      date: day,
      dayStr,
      dayNum: Number(format(day, 'd')),
      entry: byDate.get(dayStr),
      isToday: dayStr === todayStr,
      isSelected: dayStr === selectedStr,
      isFuture: isAfter(day, today),
    };
  };

  return segments.map((segmentDays, i) => {
    const first = segmentDays[0];
    const last = segmentDays[segmentDays.length - 1];
    const prev = segments[i - 1];

    // Each row is a full 7-slot Sun-Sat row. Days outside this segment's month
    // (belonging to the adjacent month's segment) are null ghost placeholders,
    // positioned by weekday index so columns stay aligned across rows.
    const days: (DayCellInfo | null)[] = [
      ...Array.from({ length: getDay(first) }, () => null),
      ...segmentDays.map(toDayCell),
      ...Array.from({ length: 6 - getDay(last) }, () => null),
    ];

    return {
      key: first.toISOString(),
      days,
      separatorLabel: labelFor(prev?.[0], first),
    };
  });
}

function DayThumbnail({ imageId }: { imageId: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getObjectUrl(imageId).then(u => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [imageId]);

  if (!url) return null;
  return <img className="calendar__cell-img" src={url} alt="" />;
}

function MonthSeparator({ label }: { label: string }) {
  return (
    <div className="calendar__month-sep">
      <div className="calendar__month-line" />
      <span className="calendar__month-label">{label}</span>
      <div className="calendar__month-line" />
    </div>
  );
}

function DayCell({ day, onDateSelect }: { day: DayCellInfo; onDateSelect: (date: Date) => void }) {
  const classes = ['calendar__cell'];
  if (day.isToday) classes.push('calendar__cell--today');
  if (day.isSelected) classes.push('calendar__cell--selected');
  if (day.isFuture) classes.push('calendar__cell--future');

  return (
    <button
      key={day.dayStr}
      className={classes.join(' ')}
      disabled={day.isFuture}
      onClick={() => !day.isFuture && onDateSelect(day.date)}
    >
      {day.entry?.notSeen ? (
        <EyeOff size={18} color="#fff" />
      ) : day.entry?.image ? (
        <DayThumbnail imageId={day.entry.image} />
      ) : (
        <span>{day.dayNum}</span>
      )}
    </button>
  );
}

function WeekRow({
  days,
  onDateSelect,
}: {
  days: (DayCellInfo | null)[];
  onDateSelect: (date: Date) => void;
}) {
  return (
    <div className="calendar__week">
      {days.map((day, i) =>
        day === null ? (
          <div
            key={`ghost-${i}`}
            className="calendar__cell calendar__cell--ghost"
            aria-hidden="true"
          />
        ) : (
          <DayCell key={day.dayStr} day={day} onDateSelect={onDateSelect} />
        )
      )}
    </div>
  );
}

export default function Calendar({ onDateSelect, selectedDate, entries }: CalendarProps) {
  const today = useRef(new Date()).current;
  const scrollRef = useRef<HTMLDivElement>(null);
  const weeks = useMemo(
    () => buildWeeks({ entries, today, selectedDate }),
    [entries, today, selectedDate]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      window.setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }, []);

  return (
    <div className="calendar" ref={scrollRef}>
      {weeks.map(week => (
        <div key={week.key}>
          {week.separatorLabel && <MonthSeparator label={week.separatorLabel} />}
          <WeekRow days={week.days} onDateSelect={onDateSelect} />
        </div>
      ))}
    </div>
  );
}
