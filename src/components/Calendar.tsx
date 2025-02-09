import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList } from 'react-native';
import { addDays, subDays, startOfWeek, format, isAfter, isBefore, addWeeks, subWeeks, getMonth } from 'date-fns';
import { MoonStorage } from '../storage/moonStorage';

const DAYS_IN_WEEK = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(start, i));
}

export default function Calendar() {
  const [currentDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, string | undefined>>({});
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    loadMoonData();
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }, 100);
  }, []);

  async function loadMoonData() {
    try {
      const storage = MoonStorage.getInstance();
      await storage.init();
      const allEntries = await storage.getAllEntries();
      const mapped: Record<string, string> = {};

      for (const entry of Object.values(allEntries)) {
        if (entry.date && entry.image) {
          mapped[entry.date] = entry.image;
        }
      }
      setCalendarData(mapped);
    } catch (err) {
      console.error('Error loading moon data:', err);
    }
  }

  function getWeeksToDisplay(): Date[] {
    const weeks: Date[] = [];
    const WEEKS_IN_PAST = 2;
    let earliestWeekStart = startOfWeek(subWeeks(new Date(), WEEKS_IN_PAST), { weekStartsOn: 0 });
    let latestWeekStart = startOfWeek(addWeeks(new Date(), 0), { weekStartsOn: 0 });

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

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={weeksArray}
        keyExtractor={(item) => item.toISOString()}
        renderItem={({ item: weekStart, index }) => {
          const days = getWeekDates(weekStart);
          const currentMonth = getMonth(days[0]);
          const nextWeek = index < weeksArray.length - 1 ? getWeekDates(weeksArray[index + 1])[0] : null;
          const isMonthChange = nextWeek ? getMonth(nextWeek) !== currentMonth : false;

          let rows: JSX.Element[] = [];
          let currentWeekCells: JSX.Element[] = [];

          days.forEach((day, idx) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayNum = parseInt(format(day, 'd'));
            const weekDayIndex = parseInt(format(day, 'i')) - 1; // 0-6, Sunday is 0
            const imageUri = calendarData[dayStr];
            
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
              currentWeekCells = Array(weekDayIndex + 1).fill(null).map((_, i) => (
                <View style={[styles.dayCell, styles.ghostCell]} key={`ghost-new-${i}`} />
              ));
            }
            
            const isToday = dayStr === format(currentDate, 'yyyy-MM-dd');
            currentWeekCells.push(
              <View style={[styles.dayCell, isToday && styles.dayCurrent ]} key={dayStr}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.dayImage} />
                ) : (
                  <Text style={styles.dayLabel}>{dayNum}</Text>
                )}
              </View>
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
    padding: 10,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  dayCurrent: {
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: 14,
    color: '#FFF',
  },
  dayImage: {
    width: 40,
    height: 40,
    resizeMode: 'center',
    maxWidth: 40,
    maxHeight: 40,
  },
  ghostCell: {
    opacity: 0,
  },
  monthSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  monthLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  monthLabel: {
    color: '#FFF',
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});