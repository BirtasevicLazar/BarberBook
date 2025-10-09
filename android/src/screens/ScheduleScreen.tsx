import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useAuth } from '../contexts/AuthContext';
import {
  createWorkingHour,
  deleteWorkingHour,
  listWorkingHours,
  updateWorkingHour,
  createBreak,
  deleteBreak,
  listBreaks,
  updateBreak,
} from '../api/barber';
import {
  BarberWorkingHour,
  CreateWorkingHourPayload,
  UpdateWorkingHourPayload,
  BarberBreak,
  CreateBreakPayload,
  UpdateBreakPayload,
} from '../types/backend';
import { ApiError } from '../api/client';
import { palette, theme } from '../styles/theme';

const addIcon: ImageSourcePropType = require('../assets/icons/Add.png');
const editIcon: ImageSourcePropType = require('../assets/icons/Edit.png');
const deleteIcon: ImageSourcePropType = require('../assets/icons/Delete.png');
const workingHoursIcon: ImageSourcePropType = require('../assets/icons/WorkingHours.png');

// Day names - starting from Monday
const DAY_NAMES = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja'];
const DAY_NAMES_SHORT = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

// Map display index (0-6, Mon-Sun) to backend day_of_week (0=Sun, 1=Mon, ...)
const DISPLAY_TO_BACKEND_DAY: number[] = [1, 2, 3, 4, 5, 6, 0];
const BACKEND_TO_DISPLAY_DAY: number[] = [6, 0, 1, 2, 3, 4, 5];

// Helper functions
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function timeToISO(hours: number, minutes: number): string {
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes, 0, 0));
  return date.toISOString();
}

function isoToTime(isoString: string): { hours: number; minutes: number } {
  const date = new Date(isoString);
  return { hours: date.getUTCHours(), minutes: date.getUTCMinutes() };
}

interface TimeFormData {
  startTime: Date;
  endTime: Date;
}

interface WorkingHourFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateWorkingHourPayload | UpdateWorkingHourPayload) => Promise<void>;
  dayOfWeek: number;
  initialData?: BarberWorkingHour;
}

function WorkingHourForm({ visible, onClose, onSubmit, dayOfWeek, initialData }: WorkingHourFormProps) {
  const [startHours, setStartHours] = useState(9);
  const [startMinutes, setStartMinutes] = useState(0);
  const [endHours, setEndHours] = useState(17);
  const [endMinutes, setEndMinutes] = useState(0);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        const start = isoToTime(initialData.startTime);
        const end = isoToTime(initialData.endTime);
        setStartHours(start.hours);
        setStartMinutes(start.minutes);
        setEndHours(end.hours);
        setEndMinutes(end.minutes);
      } else {
        setStartHours(9);
        setStartMinutes(0);
        setEndHours(17);
        setEndMinutes(0);
      }
      setError(null);
    }
  }, [visible, initialData]);

  const handleStartTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate && event.type === 'set') {
      setStartHours(selectedDate.getHours());
      setStartMinutes(selectedDate.getMinutes());
    }
  };

  const handleEndTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate && event.type === 'set') {
      setEndHours(selectedDate.getHours());
      setEndMinutes(selectedDate.getMinutes());
    }
  };

  const handleSubmit = async () => {
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    if (startTotal >= endTotal) {
      setError('Početno vreme mora biti pre krajnjeg vremena');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        dayOfWeek,
        startTime: timeToISO(startHours, startMinutes),
        endTime: timeToISO(endHours, endMinutes),
      });
      onClose();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Došlo je do greške';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {initialData ? 'Izmeni' : 'Dodaj'} radno vreme
            </Text>
            <Text style={styles.modalSubtitle}>{DAY_NAMES[dayOfWeek]}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Početno vreme</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Image source={workingHoursIcon} style={styles.timeButtonIcon} resizeMode="contain" />
                <Text style={styles.timeButtonText}>
                  {startHours.toString().padStart(2, '0')}:{startMinutes.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Krajnje vreme</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Image source={workingHoursIcon} style={styles.timeButtonIcon} resizeMode="contain" />
                <Text style={styles.timeButtonText}>
                  {endHours.toString().padStart(2, '0')}:{endMinutes.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.formError}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.danger} />
                <Text style={styles.formErrorText}>{error}</Text>
              </View>
            )}
          </View>

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
              value={new Date(2000, 0, 1, startHours, startMinutes)}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleStartTimeChange}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={new Date(2000, 0, 1, endHours, endMinutes)}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleEndTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

interface BreakFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateBreakPayload | UpdateBreakPayload) => Promise<void>;
  dayOfWeek: number;
  initialData?: BarberBreak;
}

function BreakForm({ visible, onClose, onSubmit, dayOfWeek, initialData }: BreakFormProps) {
  const [startHours, setStartHours] = useState(13);
  const [startMinutes, setStartMinutes] = useState(0);
  const [endHours, setEndHours] = useState(14);
  const [endMinutes, setEndMinutes] = useState(0);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        const start = isoToTime(initialData.startTime);
        const end = isoToTime(initialData.endTime);
        setStartHours(start.hours);
        setStartMinutes(start.minutes);
        setEndHours(end.hours);
        setEndMinutes(end.minutes);
      } else {
        setStartHours(13);
        setStartMinutes(0);
        setEndHours(14);
        setEndMinutes(0);
      }
      setError(null);
    }
  }, [visible, initialData]);

  const handleStartTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setStartHours(selectedDate.getHours());
      setStartMinutes(selectedDate.getMinutes());
    } else if (event.type === 'dismissed') {
      setShowStartPicker(false);
    }
  };

  const handleEndTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setEndHours(selectedDate.getHours());
      setEndMinutes(selectedDate.getMinutes());
    } else if (event.type === 'dismissed') {
      setShowEndPicker(false);
    }
  };

  const handleSubmit = async () => {
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    if (startTotal >= endTotal) {
      setError('Početno vreme mora biti pre krajnjeg vremena');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        dayOfWeek,
        startTime: timeToISO(startHours, startMinutes),
        endTime: timeToISO(endHours, endMinutes),
      });
      onClose();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Došlo je do greške';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {initialData ? 'Izmeni' : 'Dodaj'} pauzu
            </Text>
            <Text style={styles.modalSubtitle}>{DAY_NAMES[dayOfWeek]}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Početno vreme</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Image source={workingHoursIcon} style={styles.timeButtonIcon} resizeMode="contain" />
                <Text style={styles.timeButtonText}>
                  {startHours.toString().padStart(2, '0')}:{startMinutes.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Krajnje vreme</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Image source={workingHoursIcon} style={styles.timeButtonIcon} resizeMode="contain" />
                <Text style={styles.timeButtonText}>
                  {endHours.toString().padStart(2, '0')}:{endMinutes.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.formError}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.danger} />
                <Text style={styles.formErrorText}>{error}</Text>
              </View>
            )}
          </View>

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
              value={new Date(2000, 0, 1, startHours, startMinutes)}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleStartTimeChange}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={new Date(2000, 0, 1, endHours, endMinutes)}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleEndTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

interface TimeSlotCardProps {
  startTime: string;
  endTime: string;
  type: 'working' | 'break';
  onEdit: () => void;
  onDelete: () => void;
}

function TimeSlotCard({ startTime, endTime, type, onEdit, onDelete }: TimeSlotCardProps) {
  const handleDelete = () => {
    Alert.alert(
      type === 'working' ? 'Obriši radno vreme' : 'Obriši pauzu',
      `Da li ste sigurni da želite da obrišete ${type === 'working' ? 'radno vreme' : 'pauzu'} ${formatTime(startTime)} - ${formatTime(endTime)}?`,
      [
        { text: 'Otkaži', style: 'cancel' },
        { text: 'Obriši', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={[styles.timeSlotCard, type === 'break' && styles.timeSlotCardBreak]}>
      <View style={styles.timeSlotInfo}>
        <Image 
          source={workingHoursIcon} 
          style={type === 'working' ? styles.timeSlotIcon : styles.timeSlotIconBreak} 
          resizeMode="contain" 
        />
        <View style={styles.timeSlotText}>
          <Text style={styles.timeSlotTime}>
            {formatTime(startTime)} - {formatTime(endTime)}
          </Text>
          <Text style={styles.timeSlotLabel}>
            {type === 'working' ? 'Radno vreme' : 'Pauza'}
          </Text>
        </View>
      </View>

      <View style={styles.timeSlotActions}>
        <TouchableOpacity style={styles.timeSlotAction} onPress={onEdit}>
          <Image source={editIcon} style={styles.actionIcon} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.timeSlotAction} onPress={handleDelete}>
          <Image source={deleteIcon} style={styles.deleteIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const { token, tokenType } = useAuth();
  const auth = useMemo(() => ({ token: token ?? '', tokenType }), [token, tokenType]);

  // State
  // Map current day to display index (Mon=0, Tue=1, ..., Sun=6)
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return BACKEND_TO_DISPLAY_DAY[today];
  });
  const [workingHours, setWorkingHours] = useState<BarberWorkingHour[]>([]);
  const [breaks, setBreaks] = useState<BarberBreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showWorkingHourForm, setShowWorkingHourForm] = useState(false);
  const [showBreakForm, setShowBreakForm] = useState(false);
  const [editingWorkingHour, setEditingWorkingHour] = useState<BarberWorkingHour | undefined>();
  const [editingBreak, setEditingBreak] = useState<BarberBreak | undefined>();

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [hoursData, breaksData] = await Promise.all([
        listWorkingHours(auth),
        listBreaks(auth),
      ]);
      setWorkingHours(hoursData);
      setBreaks(breaksData);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Ne možemo da učitamo raspored.';
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
      const [hoursData, breaksData] = await Promise.all([
        listWorkingHours(auth),
        listBreaks(auth),
      ]);
      setWorkingHours(hoursData);
      setBreaks(breaksData);
      setError(null);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Ne možemo da osvežimo raspored.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [auth, token]);

  // Filter by selected day (convert display index to backend day_of_week)
  const backendDay = DISPLAY_TO_BACKEND_DAY[selectedDay];
  
  const dayWorkingHours = useMemo(
    () => workingHours.filter((h) => h.dayOfWeek === backendDay).sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    ),
    [workingHours, backendDay]
  );

  const dayBreaks = useMemo(
    () => breaks.filter((b) => b.dayOfWeek === backendDay).sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    ),
    [breaks, backendDay]
  );

  // Working Hours handlers
  const handleCreateWorkingHour = useCallback(
    async (payload: CreateWorkingHourPayload) => {
      const created = await createWorkingHour(auth, payload);
      setWorkingHours((prev) => [...prev, created]);
    },
    [auth]
  );

  const handleUpdateWorkingHour = useCallback(
    async (payload: UpdateWorkingHourPayload) => {
      if (!editingWorkingHour) return;
      const updated = await updateWorkingHour(auth, editingWorkingHour.id, payload);
      setWorkingHours((prev) =>
        prev.map((item) => (item.id === editingWorkingHour.id ? updated : item))
      );
      setEditingWorkingHour(undefined);
    },
    [auth, editingWorkingHour]
  );

  const handleDeleteWorkingHour = useCallback(
    async (id: string) => {
      await deleteWorkingHour(auth, id);
      setWorkingHours((prev) => prev.filter((item) => item.id !== id));
      
      // Kaskadno brisanje - automatski obriši sve pauze za taj dan
      const deletedHour = workingHours.find((item) => item.id === id);
      if (deletedHour) {
        const breaksForDay = breaks.filter((b) => b.dayOfWeek === deletedHour.dayOfWeek);
        for (const breakItem of breaksForDay) {
          try {
            await deleteBreak(auth, breakItem.id);
          } catch (e) {
            console.error('Failed to delete break:', e);
          }
        }
        setBreaks((prev) => prev.filter((b) => b.dayOfWeek !== deletedHour.dayOfWeek));
      }
    },
    [auth, workingHours, breaks]
  );

  // Breaks handlers
  const handleCreateBreak = useCallback(
    async (payload: CreateBreakPayload) => {
      const created = await createBreak(auth, payload);
      setBreaks((prev) => [...prev, created]);
    },
    [auth]
  );

  const handleUpdateBreak = useCallback(
    async (payload: UpdateBreakPayload) => {
      if (!editingBreak) return;
      const updated = await updateBreak(auth, editingBreak.id, payload);
      setBreaks((prev) =>
        prev.map((item) => (item.id === editingBreak.id ? updated : item))
      );
      setEditingBreak(undefined);
    },
    [auth, editingBreak]
  );

  const handleDeleteBreak = useCallback(
    async (id: string) => {
      await deleteBreak(auth, id);
      setBreaks((prev) => prev.filter((item) => item.id !== id));
    },
    [auth]
  );

  const renderDayTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.dayTabs}
      contentContainerStyle={styles.dayTabsContent}
    >
      {DAY_NAMES_SHORT.map((dayShort, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.dayTab, selectedDay === index && styles.dayTabActive]}
          onPress={() => setSelectedDay(index)}
        >
          <Text style={[styles.dayTabText, selectedDay === index && styles.dayTabTextActive]}>
            {dayShort}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image source={workingHoursIcon} style={styles.emptyStateIcon} resizeMode="contain" />
      <Text style={styles.emptyTitle}>Nema rasporeda</Text>
      <Text style={styles.emptySubtitle}>
        Dodajte radno vreme za {DAY_NAMES[selectedDay]}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowWorkingHourForm(true)}
      >
        <Image source={addIcon} style={styles.emptyButtonIcon} resizeMode="contain" />
        <Text style={styles.emptyButtonText}>Dodaj radno vreme</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    const hasWorkingHours = dayWorkingHours.length > 0;
    const hasBreaks = dayBreaks.length > 0;

    if (!hasWorkingHours && !hasBreaks) {
      return renderEmptyState();
    }

    return (
      <ScrollView
        style={styles.contentScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Radno vreme sekcija - samo prikaz, bez dugmeta za dodavanje */}
        {hasWorkingHours && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Image source={workingHoursIcon} style={styles.sectionIcon} resizeMode="contain" />
                <Text style={styles.sectionTitle}>Radno vreme</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {dayWorkingHours.map((hour) => (
                <TimeSlotCard
                  key={hour.id}
                  startTime={hour.startTime}
                  endTime={hour.endTime}
                  type="working"
                  onEdit={() => {
                    setEditingWorkingHour(hour);
                    setShowWorkingHourForm(true);
                  }}
                  onDelete={() => handleDeleteWorkingHour(hour.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Pauze sekcija - dugme za dodavanje samo ako postoji radno vreme */}
        {hasBreaks && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Image source={workingHoursIcon} style={styles.sectionIconBreak} resizeMode="contain" />
                <Text style={styles.sectionTitle}>Pauze</Text>
              </View>
              {hasWorkingHours && (
                <TouchableOpacity
                  style={styles.sectionAddButton}
                  onPress={() => setShowBreakForm(true)}
                >
                  <Image source={addIcon} style={styles.sectionAddIcon} resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sectionContent}>
              {dayBreaks.map((breakItem) => (
                <TimeSlotCard
                  key={breakItem.id}
                  startTime={breakItem.startTime}
                  endTime={breakItem.endTime}
                  type="break"
                  onEdit={() => {
                    setEditingBreak(breakItem);
                    setShowBreakForm(true);
                  }}
                  onDelete={() => handleDeleteBreak(breakItem.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Quick actions - prikazi samo ako nešto nedostaje */}
        {hasWorkingHours && !hasBreaks && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setShowBreakForm(true)}
            >
              <Image source={workingHoursIcon} style={styles.quickActionIcon} resizeMode="contain" />
              <Text style={styles.quickActionText}>Dodaj pauzu</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingText}>Učitavamo vaš raspored...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Raspored</Text>
            <Text style={styles.headerSubtitle}>Organizujte radno vreme i pauze</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
              <Text style={styles.retryText}>Pokušajte ponovo</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderDayTabs()}
        {renderContent()}

        <WorkingHourForm
          visible={showWorkingHourForm}
          onClose={() => {
            setShowWorkingHourForm(false);
            setEditingWorkingHour(undefined);
          }}
          onSubmit={editingWorkingHour ? handleUpdateWorkingHour : handleCreateWorkingHour}
          dayOfWeek={backendDay}
          initialData={editingWorkingHour}
        />

        <BreakForm
          visible={showBreakForm}
          onClose={() => {
            setShowBreakForm(false);
            setEditingBreak(undefined);
          }}
          onSubmit={editingBreak ? handleUpdateBreak : handleCreateBreak}
          dayOfWeek={backendDay}
          initialData={editingBreak}
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
    padding: theme.spacing(3),
  },
  loadingText: {
    marginTop: theme.spacing(2),
    fontSize: 16,
    color: theme.colors.secondary,
    fontWeight: '500',
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
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.spacing(0.5),
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
  dayTabs: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    maxHeight: 48,
  },
  dayTabsContent: {
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1),
    gap: theme.spacing(1),
  },
  dayTab: {
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    height: 32,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayTabActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  dayTabTextActive: {
    color: palette.white,
  },
  contentScroll: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
  emptyStateIcon: {
    width: 48,
    height: 48,
    tintColor: theme.colors.tertiary,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing(1.5),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.spacing(0.5),
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  emptyButtonIcon: {
    width: 18,
    height: 18,
    tintColor: palette.white,
  },
  emptyButtonText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    marginHorizontal: theme.spacing(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1.5),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  sectionIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.accent,
  },
  sectionIconBreak: {
    width: 20,
    height: 20,
    tintColor: theme.colors.warning,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  sectionAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionAddIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.accent,
  },
  sectionContent: {
    gap: theme.spacing(1.5),
  },
  timeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
  },
  timeSlotCardBreak: {
    borderLeftColor: theme.colors.warning,
  },
  timeSlotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    flex: 1,
  },
  timeSlotIcon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.accent,
  },
  timeSlotIconBreak: {
    width: 24,
    height: 24,
    tintColor: theme.colors.warning,
  },
  timeSlotText: {
    flex: 1,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  timeSlotLabel: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  timeSlotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  timeSlotAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.accent,
  },
  deleteIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.danger,
  },
  quickActions: {
    padding: theme.spacing(2),
    gap: theme.spacing(1.5),
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  quickActionIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.warning,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.secondaryBackground,
    borderTopLeftRadius: theme.radius['3xl'],
    borderTopRightRadius: theme.radius['3xl'],
    paddingBottom: theme.spacing(4),
    maxHeight: '80%',
  },
  modalHeader: {
    padding: theme.spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing(0.5),
  },
  modalSubtitle: {
    fontSize: 15,
    color: theme.colors.secondary,
  },
  formContainer: {
    padding: theme.spacing(3),
  },
  formGroup: {
    marginBottom: theme.spacing(2.5),
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: theme.spacing(1),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeButtonIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.accent,
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    backgroundColor: `${theme.colors.danger}15`,
    borderRadius: theme.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.danger,
  },
  formErrorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.danger,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    paddingTop: theme.spacing(2),
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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
    color: theme.colors.primary,
  },
  modalButtonTextSubmit: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
});
