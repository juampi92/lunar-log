import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Pressable } from 'react-native';
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
import theme, { colors, spacing, borderRadius, typography } from '../theme/theme';
import { Feather } from '@expo/vector-icons';

const DAYS_IN_WEEK = 7;

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  entries: Record<string, { image?: string; notSeen?: boolean; date: string }>;
}

function getWeekDates(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(start, i));
}

export default function Calendar({ onDateSelect, selectedDate, entries }: CalendarProps) {
  const [currentDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<
    Record<string, { image?: string; notSeen?: boolean }>
  >({});
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const mapped: Record<string, { image?: string; notSeen?: boolean }> = {};
    for (const entry of Object.values(entries)) {
      if (entry.date) {
        mapped[entry.date] = {
          image: entry.image,
          notSeen: entry.notSeen,
        };
      }
    }
    setCalendarData(mapped);
  }, [entries]);

  useEffect(() => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }, 100);
  }, [calendarData]);

  function getWeeksToDisplay(): Date[] {
    const weeks: Date[] = [];
    
    // Find the earliest entry date
    let earliestEntryDate = new Date();
    Object.keys(calendarData).forEach(dateStr => {
      const entryDate = new Date(dateStr);
      if (isBefore(entryDate, earliestEntryDate)) {
        earliestEntryDate = entryDate;
      }
    });
    
    // Start from one week before the earliest entry
    const earliestWeekStart = startOfWeek(subWeeks(earliestEntryDate, 1), { weekStartsOn: 0 });
    // End at current week
    const latestWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });

    let cursor = earliestWeekStart;
    while (isBefore(cursor, addDays(latestWeekStart, 1))) {
      weeks.push(cursor);
      cursor = addWeeks(cursor, 1);
    }

    return weeks;
  }

  const weeksArray = getWeeksToDisplay();

  const renderMonthSeparator = (month: number) => (
    <View style={styles.monthSeparator} key={`month-separator-${month}`}>
      <View style={styles.monthLine} />
      <Text style={styles.monthLabel}>
        {format(new Date(currentDate.getFullYear(), month), 'MMMM')}
      </Text>
      <View style={styles.monthLine} />
    </View>
  );

  const handleDatePress = (date: Date) => {
    onDateSelect(date);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={weeksArray}
        keyExtractor={item => item.toISOString()}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        windowSize={5} // Only render a few windows worth of content
        maxToRenderPerBatch={2} // Render fewer items per batch
        initialNumToRender={4} // Render fewer items initially
        removeClippedSubviews={true} // Remove items outside of the viewport
        renderItem={({ item: weekStart, index }) => {
          const days = getWeekDates(weekStart);
          const currentMonth = getMonth(days[0]);
          const nextWeek =
            index < weeksArray.length - 1 ? getWeekDates(weeksArray[index + 1])[0] : null;
          const isMonthChange = nextWeek ? getMonth(nextWeek) !== currentMonth : false;

          const rows: JSX.Element[] = [];
          let currentWeekCells: JSX.Element[] = [];

          days.forEach((day, idx) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayNum = parseInt(format(day, 'd'));
            const weekDayIndex = parseInt(format(day, 'i')) - 1; // 0-6, Sunday is 0
            const entryData = calendarData[dayStr];

            if (idx > 0 && dayNum < parseInt(format(days[idx - 1], 'd'))) {
              // Fill remaining cells with ghosts
              for (let i = currentWeekCells.length; i < DAYS_IN_WEEK; i++) {
                currentWeekCells.push(
                  <View style={[styles.dayCell, styles.ghostCell]} key={`ghost-${i}`} />
                );
              }

              // Add current row
              rows.push(
                <View key={`row-${dayStr}-end`} style={styles.weekRow}>
                  {currentWeekCells}
                </View>
              );

              if (isMonthChange && nextWeek) {
                rows.push(renderMonthSeparator(getMonth(nextWeek)));
              }

              // Create ghost cells up to the current weekday
              currentWeekCells = Array(weekDayIndex + 1)
                .fill(null)
                .map((_, i) => (
                  <View style={[styles.dayCell, styles.ghostCell]} key={`ghost-new-${i}`} />
                ));
            }

            const isToday = dayStr === format(currentDate, 'yyyy-MM-dd');
            const isFutureDate = isAfter(day, currentDate);

            currentWeekCells.push(
              <Pressable
                style={({ pressed }) => [
                  styles.dayCell,
                  isToday && styles.dayCurrent,
                  dayStr === format(selectedDate, 'yyyy-MM-dd') && styles.daySelected,
                  !isFutureDate && pressed && styles.dayHover,
                  isFutureDate && { opacity: 0.5 },
                ]}
                key={dayStr}
                onPress={() => {
                  if (!isFutureDate) {
                    handleDatePress(day);
                  }
                }}
                disabled={isFutureDate}
              >
                {entryData?.notSeen ? (
                  <Feather name="eye-off" size={18} color="#fff" />
                ) : entryData?.image ? (
                  <Image source={{ uri: entryData.image }} style={styles.dayImage as any} />
                ) : (
                  <Text style={styles.dayLabel}>{dayNum}</Text>
                )}
              </Pressable>
            );
          });

          if (currentWeekCells.length > 0) {
            // Fill remaining cells with ghosts
            for (let i = currentWeekCells.length; i < DAYS_IN_WEEK; i++) {
              currentWeekCells.push(
                <View style={[styles.dayCell, styles.ghostCell]} key={`ghost-final-${i}`} />
              );
            }

            rows.push(
              <View key={`row-final-${weekStart}`} style={styles.weekRow}>
                {currentWeekCells}
              </View>
            );
          }

          return <View>{rows}</View>;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.calendarBorder,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs / 2,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  dayCurrent: {
    backgroundColor: colors.calendarToday,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  daySelected: {
    backgroundColor: colors.calendarSelected,
    borderWidth: 2,
    borderColor: colors.calendarSelectedBorder,
    transform: [{ scale: 1.05 }],
  },
  dayHover: {
    backgroundColor: colors.calendarHover,
    borderColor: colors.primaryLight,
  },
  dayLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  dayImage: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
    maxWidth: 40,
    maxHeight: 40,
  },
  ghostCell: {
    opacity: 0,
    borderColor: colors.transparent,
  },
  monthSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  monthLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  monthLabel: {
    color: colors.textPrimary,
    marginHorizontal: spacing.md,
    fontSize: typography.fontSizes.md,
    fontWeight: "500",
  },
});
