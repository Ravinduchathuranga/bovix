import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';

interface AppDatePickerProps {
  label?: string;
  value: string; // ISO date string "YYYY-MM-DD"
  onChange: (dateStr: string) => void;
  placeholder?: string;
  showPresets?: boolean;
  allowClear?: boolean;
  compact?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

import { formatDateToISO, formatDateFriendly } from '../utils/dateUtils';
export { formatDateToISO, formatDateFriendly };

export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select Date',
  showPresets = true,
  allowClear = false,
  compact = false,
  minDate,
  maxDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Convert current string value to Date object for picker
  const getDateObject = (): Date => {
    if (!value) return new Date();
    const parts = value.split('-');
    if (parts.length === 3) {
      const parsed = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const handleValueChange = (event: DateTimePickerChangeEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      const formatted = formatDateToISO(selectedDate);
      onChange(formatted);
    }
  };

  const handleDismiss = () => {
    setShowPicker(false);
  };

  const setPresetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    onChange(formatDateToISO(d));
  };

  const isToday = value === formatDateToISO(new Date());
  const yesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDateToISO(d);
  };
  const isYesterday = value === yesterdayStr();

  // Render Web Date Input when running on react-native-web
  if (Platform.OS === 'web') {
    return (
      <View style={compact ? styles.compactContainer : styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={[styles.dateButton, compact && styles.compactDateButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.calendarIcon}>📅</Text>
            <Text style={[styles.dateText, !value && styles.placeholderText]}>
              {value ? formatDateFriendly(value) : placeholder}
            </Text>
            {allowClear && !!value && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => onChange('')}
              >
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Hidden native HTML date input over touchable for Web */}
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            }}
          />
        </View>

        {showPresets && !compact && (
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[styles.presetChip, isToday && styles.presetChipActive]}
              onPress={() => setPresetDate(0)}
            >
              <Text style={[styles.presetText, isToday && styles.presetTextActive]}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, isYesterday && styles.presetChipActive]}
              onPress={() => setPresetDate(1)}
            >
              <Text style={[styles.presetText, isYesterday && styles.presetTextActive]}>
                Yesterday
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setPresetDate(2)}
            >
              <Text style={styles.presetText}>2 Days Ago</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Native Mobile (iOS & Android) Rendering
  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.dateButton, compact && styles.compactDateButton]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.calendarIcon}>📅</Text>
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value ? formatDateFriendly(value) : placeholder}
        </Text>
        {allowClear && !!value && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {showPresets && !compact && (
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={[styles.presetChip, isToday && styles.presetChipActive]}
            onPress={() => setPresetDate(0)}
          >
            <Text style={[styles.presetText, isToday && styles.presetTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetChip, isYesterday && styles.presetChipActive]}
            onPress={() => setPresetDate(1)}
          >
            <Text style={[styles.presetText, isYesterday && styles.presetTextActive]}>
              Yesterday
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setPresetDate(2)}
          >
            <Text style={styles.presetText}>2 Days Ago</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* iOS Modal / Android Native Picker */}
      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade">
            <View style={styles.iosModalOverlay}>
              <View style={styles.iosModalContent}>
                <View style={styles.iosModalHeader}>
                  <Text style={styles.iosModalTitle}>{label || 'Select Date'}</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.iosDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={getDateObject()}
                  mode="date"
                  display="spinner"
                  textColor="#FFFFFF"
                  onValueChange={handleValueChange}
                  onDismiss={handleDismiss}
                  minimumDate={minDate}
                  maximumDate={maxDate}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={getDateObject()}
            mode="date"
            display="default"
            onValueChange={handleValueChange}
            onDismiss={handleDismiss}
            minimumDate={minDate}
            maximumDate={maxDate}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  compactContainer: {
    marginVertical: 0,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  compactDateButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  calendarIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  presetChip: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  presetChipActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  presetText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#34D399',
    fontWeight: '700',
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  iosModalTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  iosDoneText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
});
