import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { MoonEntry } from '../storage/types';
import theme, { colors, spacing, borderRadius, typography } from '../theme/theme';

interface DateActionsMenuProps {
  selectedDate: Date;
  entry: MoonEntry | null;
  onMarkNotSeen: () => void;
  onTakePicture: () => void;
  onPickFromGallery: () => void;
  onRemoveEntry: () => void;
}

export default function DateActionsMenu({
  selectedDate,
  entry,
  onMarkNotSeen,
  onTakePicture,
  onPickFromGallery,
  onRemoveEntry,
}: DateActionsMenuProps) {
  const formattedDate = format(selectedDate, 'MMMM d, yyyy');

  // If there's an entry for this date, show the entry and a remove button
  if (entry) {
    return (
      <View style={styles.container}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <View style={styles.actionContent}>
          {entry.notSeen ? (
            <View style={styles.entryContent}>
              <Feather name="eye-off" size={24} color="#fff" />
              <Text style={styles.notSeenText}>Not seen</Text>
            </View>
          ) : entry.image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: entry.image }} style={styles.entryImage} resizeMode="cover" />
            </View>
          ) : null}
          <TouchableOpacity style={styles.removeButton} onPress={onRemoveEntry}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If there's no entry, show the action buttons
  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{formattedDate}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={onMarkNotSeen}>
          <Feather name="eye-off" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onPickFromGallery}>
          <Feather name="image" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onTakePicture}>
          <Feather name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...theme.shadows.small,
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
    ...theme.shadows.small,
  },
  actionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notSeenText: {
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontSize: typography.fontSizes.md,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryImage: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: borderRadius.sm,
    ...theme.shadows.small,
  },
  removeButton: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: borderRadius.round,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
});
