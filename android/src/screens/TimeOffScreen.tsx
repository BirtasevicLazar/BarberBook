import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useAuth } from '../contexts/AuthContext';
import {
  createTimeOff,
  deleteTimeOff,
  listTimeOff,
  updateTimeOff,
} from '../api/barber';
import {
  BarberTimeOff,
  CreateTimeOffPayload,
  UpdateTimeOffPayload,
} from '../types/backend';
import { ApiError } from '../api/client';
import { palette, theme } from '../styles/theme';

const addIcon: ImageSourcePropType = require('../assets/icons/Add.png');
const editIcon: ImageSourcePropType = require('../assets/icons/Edit.png');
const deleteIcon: ImageSourcePropType = require('../assets/icons/Delete.png');

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function calculateDays(startAt: string, endAt: string): number {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

interface TimeOffFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTimeOffPayload | UpdateTimeOffPayload) => Promise<void>;
  initialData?: BarberTimeOff;
}

function TimeOffForm({ visible, onClose, onSubmit, initialData }: TimeOffFormProps) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setStartDate(new Date(initialData.startAt));
        setEndDate(new Date(initialData.endAt));
        setReason(initialData.reason || '');
      } else {
        const today = new Date();
        setStartDate(today);
        setEndDate(today);
        setReason('');
      }
    }
  }, [visible, initialData]);

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    } else if (event.type === 'dismissed') {
      setShowStartPicker(false);
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setEndDate(selectedDate);
    } else if (event.type === 'dismissed') {
      setShowEndPicker(false);
    }
  };

  const handleSubmit = async () => {
    if (endDate < startDate) {
      Alert.alert('Greška', 'Datum završetka mora biti posle datuma početka');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Greška pri čuvanju';
      Alert.alert('Greška', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {initialData ? 'Izmeni neradni period' : 'Dodaj neradni period'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {/* Start Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Datum početka</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(startDate.toISOString())}</Text>
              </TouchableOpacity>
            </View>

            {/* End Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Datum završetka</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(endDate.toISOString())}</Text>
              </TouchableOpacity>
            </View>

            {/* Duration info */}
            <View style={styles.durationInfo}>
              <Text style={styles.durationText}>
                Trajanje: {calculateDays(startDate.toISOString(), endDate.toISOString())} dana
              </Text>
            </View>

            {/* Reason */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Razlog (opciono)</Text>
              <TextInput
                style={styles.textInput}
                value={reason}
                onChangeText={setReason}
                placeholder="npr. Godišnji odmor, Bolovanje..."
                placeholderTextColor={theme.colors.tertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.modalButtonTextCancel}>Otkaži</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSubmit]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={palette.white} />
              ) : (
                <Text style={styles.modalButtonTextSubmit}>
                  {initialData ? 'Sačuvaj' : 'Dodaj'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="spinner"
              onChange={handleStartDateChange}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="spinner"
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

interface TimeOffCardProps {
  timeOff: BarberTimeOff;
  onEdit: () => void;
  onDelete: () => void;
}

function TimeOffCard({ timeOff, onEdit, onDelete }: TimeOffCardProps) {
  const days = calculateDays(timeOff.startAt, timeOff.endAt);
  const daysText = days === 1 ? 'dan' : days < 5 ? 'dana' : 'dana';

  const handleDelete = () => {
    Alert.alert(
      'Potvrda brisanja',
      `Da li ste sigurni da želite da obrišete ovaj neradni period?\n${formatDate(timeOff.startAt)} - ${formatDate(timeOff.endAt)}`,
      [
        { text: 'Otkaži', style: 'cancel' },
        { text: 'Obriši', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.timeOffCard}>
      <View style={styles.timeOffMain}>
        <View style={styles.timeOffDates}>
          <Text style={styles.timeOffDateRange}>
            {formatDate(timeOff.startAt)} - {formatDate(timeOff.endAt)}
          </Text>
          <Text style={styles.timeOffDuration}>
            {days} {daysText}
          </Text>
        </View>
        {timeOff.reason && <Text style={styles.timeOffReason}>{timeOff.reason}</Text>}
      </View>

      <View style={styles.timeOffActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Image source={editIcon} style={styles.actionIcon} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Image source={deleteIcon} style={styles.deleteIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TimeOffScreen() {
  const { token, tokenType } = useAuth();
  const auth = useMemo(() => ({ token: token ?? '', tokenType }), [token, tokenType]);

  const [timeOffs, setTimeOffs] = useState<BarberTimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTimeOff, setEditingTimeOff] = useState<BarberTimeOff | undefined>();

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listTimeOff(auth);
      setTimeOffs(data);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Ne možemo da učitamo neradne dane.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [auth, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const data = await listTimeOff(auth);
      setTimeOffs(data);
      setError(null);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Ne možemo da osvežimo podatke.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [auth, token]);

  const handleCreate = useCallback(
    async (payload: CreateTimeOffPayload) => {
      const created = await createTimeOff(auth, payload);
      setTimeOffs((prev) =>
        [...prev, created].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      );
    },
    [auth]
  );

  const handleUpdate = useCallback(
    async (payload: UpdateTimeOffPayload) => {
      if (!editingTimeOff) return;
      const updated = await updateTimeOff(auth, editingTimeOff.id, payload);
      setTimeOffs((prev) =>
        prev
          .map((item) => (item.id === editingTimeOff.id ? updated : item))
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      );
      setEditingTimeOff(undefined);
    },
    [auth, editingTimeOff]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteTimeOff(auth, id);
        setTimeOffs((prev) => prev.filter((item) => item.id !== id));
      } catch (e) {
        const message = e instanceof ApiError ? e.message : 'Greška pri brisanju';
        Alert.alert('Greška', message);
      }
    },
    [auth]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingText}>Učitavanje...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Neradni dani</Text>
              <Text style={styles.headerSubtitle}>Organizujte godišnje odmore</Text>
            </View>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
              <Text style={styles.retryText}>Pokušajte ponovo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>📅</Text>
      </View>
      <Text style={styles.emptyTitle}>Nema neradnih dana</Text>
      <Text style={styles.emptySubtitle}>Dodajte periode kada nećete biti dostupni</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Neradni dani</Text>
            <Text style={styles.headerSubtitle}>
              {timeOffs.length} {timeOffs.length === 1 ? 'period' : 'perioda'}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowForm(true)}>
            <Image source={addIcon} style={styles.headerButtonIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {timeOffs.length === 0 ? (
          renderEmpty()
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {timeOffs.map((timeOff) => (
              <TimeOffCard
                key={timeOff.id}
                timeOff={timeOff}
                onEdit={() => {
                  setEditingTimeOff(timeOff);
                  setShowForm(true);
                }}
                onDelete={() => handleDelete(timeOff.id)}
              />
            ))}
          </ScrollView>
        )}

        <TimeOffForm
          visible={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingTimeOff(undefined);
          }}
          onSubmit={editingTimeOff ? handleUpdate : handleCreate}
          initialData={editingTimeOff}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing(2),
    fontSize: 16,
    color: theme.colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonIcon: {
    width: 20,
    height: 20,
    tintColor: palette.white,
  },
  errorContainer: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.danger,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    marginBottom: theme.spacing(1),
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  retryText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing(2),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing(1),
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  timeOffCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeOffMain: {
    flex: 1,
  },
  timeOffDates: {
    marginBottom: theme.spacing(0.5),
  },
  timeOffDateRange: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  timeOffDuration: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  timeOffReason: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.spacing(0.5),
    fontStyle: 'italic',
  },
  timeOffActions: {
    flexDirection: 'row',
    gap: theme.spacing(1),
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.accent,
  },
  deleteIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: theme.colors.secondary,
  },
  modalForm: {
    padding: theme.spacing(3),
  },
  formGroup: {
    marginBottom: theme.spacing(2.5),
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing(1),
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  durationInfo: {
    backgroundColor: theme.colors.accent + '15',
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(2.5),
  },
  durationText: {
    fontSize: 14,
    color: theme.colors.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing(2),
    fontSize: 15,
    color: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.surface,
  },
  modalButtonSubmit: {
    backgroundColor: theme.colors.accent,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  modalButtonTextSubmit: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
});
