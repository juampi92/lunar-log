import { useEffect, useRef, useState } from 'react';
import {
  addDays,
  startOfWeek,
  format,
  isAfter,
  isBefore,
  addWeeks,
  subWeeks,
  getMonth,
} from 'date-fns';
import { EyeOff } from 'lucide-react';
import { MoonEntry } from '../storage/types';
import { getObjectUrl } from '../storage/objectUrlCache';

const DAYS_IN_WEEK = 7;

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  entries: Record<string, MoonEntry>;
}

interface CellEntry {
  image?: string;
  notSeen?: boolean;
}

function getWeekDates(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(start, i));
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

export default function Calendar({ onDateSelect, selectedDate, entries }: CalendarProps) {
  const today = useRef(new Date()).current;
  const [calendarData, setCalendarData] = useState<Record<string, CellEntry>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mapped: Record<string, CellEntry> = {};
    for (const entry of Object.values(entries)) {
      if (entry.date) {
        mapped[entry.date] = { image: entry.image, notSeen: entry.notSeen };
      }
    }
    setCalendarData(mapped);
  }, [entries]);

  useEffect(() => {
    // Scroll to the bottom (most recent week) on mount / data change.
    const el = scrollRef.current;
    if (el) {
      window.setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }, [calendarData]);

  function getWeeksToDisplay(): Date[] {
    const weeks: Date[] = [];

    let earliestEntryDate = new Date();
    Object.keys(calendarData).forEach(dateStr => {
      const entryDate = new Date(dateStr);
      if (isBefore(entryDate, earliestEntryDate)) {
        earliestEntryDate = entryDate;
      }
    });

    const earliestWeekStart = startOfWeek(subWeeks(earliestEntryDate, 1), { weekStartsOn: 0 });
    const latestWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });

    let cursor = earliestWeekStart;
    while (isBefore(cursor, addDays(latestWeekStart, 1))) {
      weeks.push(cursor);
      cursor = addWeeks(cursor, 1);
    }

    return weeks;
  }

  const weeksArray = getWeeksToDisplay();
  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedStr = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div className="calendar" ref={scrollRef}>
      {weeksArray.map((weekStart, index) => {
        const days = getWeekDates(weekStart);
        const currentMonth = getMonth(days[0]);
        const nextWeek =
          index < weeksArray.length - 1 ? getWeekDates(weeksArray[index + 1])[0] : null;
        const isMonthChange = nextWeek ? getMonth(nextWeek) !== currentMonth : false;

        return (
          <div key={weekStart.toISOString()}>
            <div className="calendar__week">
              {days.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayNum = Number(format(day, 'd'));
                const entryData = calendarData[dayStr];
                const isToday = dayStr === todayStr;
                const isSelected = dayStr === selectedStr;
                const isFuture = isAfter(day, today);

                const classes = ['calendar__cell'];
                if (isToday) classes.push('calendar__cell--today');
                if (isSelected) classes.push('calendar__cell--selected');
                if (isFuture) classes.push('calendar__cell--future');

                return (
                  <button
                    key={dayStr}
                    className={classes.join(' ')}
                    disabled={isFuture}
                    onClick={() => !isFuture && onDateSelect(day)}
                  >
                    {entryData?.notSeen ? (
                      <EyeOff size={18} color="#fff" />
                    ) : entryData?.image ? (
                      <DayThumbnail imageId={entryData.image} />
                    ) : (
                      <span>{dayNum}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {isMonthChange && nextWeek && (
              <div className="calendar__month-sep">
                <div className="calendar__month-line" />
                <span className="calendar__month-label">
                  {format(new Date(today.getFullYear(), getMonth(nextWeek)), 'MMMM')}
                </span>
                <div className="calendar__month-line" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
