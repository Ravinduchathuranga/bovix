import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AppDatePicker, formatDateToISO } from './AppDatePicker';

interface DateTabBarProps {
  selectedDate: string; // YYYY-MM-DD or '' for all
  onSelectDate: (date: string) => void;
  datesWithData?: string[]; // array of YYYY-MM-DD strings that have entries
  daysCount?: number; // default 14
}

export const DateTabBar: React.FC<DateTabBarProps> = ({
  selectedDate,
  onSelectDate,
  datesWithData = [],
  daysCount = 14,
}) => {
  // Generate recent dates array
  const dateOptions = useMemo(() => {
    const list: { iso: string; dayName: string; dayNum: string; label: string }[] = [];
    const today = new Date();

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = formatDateToISO(d);

      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Yesterday';
      else {
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const day = d.getDate();
        label = `${month} ${day}`;
      }

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = String(d.getDate());

      list.push({ iso, dayName, dayNum, label });
    }

    // Ensure selectedDate is present if it's outside the past N days
    if (selectedDate && selectedDate !== '' && !list.some((item) => item.iso === selectedDate)) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = String(d.getDate());
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        list.push({ iso: selectedDate, dayName, dayNum, label: `${month} ${dayNum}` });
      }
    }

    return list;
  }, [daysCount, selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>📅 Select Log Date:</Text>
        {selectedDate !== '' && (
          <TouchableOpacity
            style={styles.allDatesBtn}
            onPress={() => onSelectDate('')}
            activeOpacity={0.7}
          >
            <Text style={styles.allDatesText}>Show All 📋</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Scrollable Date Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Dates Chip Option */}
        <TouchableOpacity
          style={[
            styles.dateChip,
            selectedDate === '' && styles.dateChipActive,
          ]}
          onPress={() => onSelectDate('')}
          activeOpacity={0.8}
        >
          <Text style={[styles.dayNameText, selectedDate === '' && styles.activeText]}>ALL</Text>
          <Text style={[styles.dayNumText, selectedDate === '' && styles.activeText]}>∞</Text>
          <Text style={[styles.chipSubLabel, selectedDate === '' && styles.activeText]}>All Logs</Text>
        </TouchableOpacity>

        {dateOptions.map((item) => {
          const isActive = selectedDate === item.iso;
          const hasData = datesWithData.includes(item.iso);

          return (
            <TouchableOpacity
              key={item.iso}
              style={[
                styles.dateChip,
                isActive && styles.dateChipActive,
                hasData && !isActive && styles.dateChipHasData,
              ]}
              onPress={() => onSelectDate(item.iso)}
              activeOpacity={0.8}
            >
              {hasData && <View style={[styles.dataDot, isActive && styles.dataDotActive]} />}
              <Text style={[styles.dayNameText, isActive && styles.activeText]}>
                {item.dayName.toUpperCase()}
              </Text>
              <Text style={[styles.dayNumText, isActive && styles.activeText]}>{item.dayNum}</Text>
              <Text style={[styles.chipSubLabel, isActive && styles.activeText]} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Calendar Picker inline helper */}
      <View style={styles.pickerWrapper}>
        <AppDatePicker
          label=""
          value={selectedDate}
          onChange={onSelectDate}
          placeholder="Pick specific date from calendar 📆"
          allowClear={true}
          showPresets={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  allDatesBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allDatesText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  dateChip: {
    width: 68,
    height: 74,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  dateChipHasData: {
    borderColor: '#059669',
    backgroundColor: '#112922',
  },
  dateChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dataDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  dataDotActive: {
    backgroundColor: '#FFFFFF',
  },
  dayNameText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dayNumText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 1,
  },
  chipSubLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  activeText: {
    color: '#FFFFFF',
  },
  pickerWrapper: {
    marginTop: 8,
  },
});
