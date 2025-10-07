import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { listAppointments, confirmAppointment, cancelAppointment, listWorkingHours } from '../api/barber';
import { Appointment, AppointmentStatus, BarberWorkingHour } from '../types/backend';

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  appointment?: Appointment;
}

export default function AppointmentsScreen() {
  const { credentials } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [workingHours, setWorkingHours] = useState<BarberWorkingHour[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load working hours (once)
  useEffect(() => {
    if (!credentials) return;
    
    const loadWorkingHours = async () => {
      try {
        const hours = await listWorkingHours(credentials);
        setWorkingHours(hours);
      } catch (error: any) {
        console.error('Failed to load working hours:', error);
      }
    };
    
    loadWorkingHours();
  }, [credentials]);

  const loadAppointments = useCallback(async () => {
    if (!credentials) return;

    try {
      setLoading(true);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const data = await listAppointments(credentials, {
        from: startOfDay.toISOString(),
        to: endOfDay.toISOString(),
      });
      
      // Filter out canceled appointments
      const activeAppointments = data.filter(apt => apt.status !== 'canceled');
      setAppointments(activeAppointments);
    } catch (error: any) {
      Alert.alert('Greška', error.message || 'Nije moguće učitati termine');
    } finally {
      setLoading(false);
    }
  }, [credentials, selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Generate time slots based on working hours
  useEffect(() => {
    if (workingHours.length === 0) return;

    const dayOfWeek = selectedDate.getDay();
    const todayWorkingHours = workingHours.filter(wh => wh.dayOfWeek === dayOfWeek);

    if (todayWorkingHours.length === 0) {
      setTimeSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];
    const slotDuration = 30; // 30 minutes per slot

    todayWorkingHours.forEach(wh => {
      const startTime = new Date(wh.startTime);
      const endTime = new Date(wh.endTime);
      
      // Use UTC hours to avoid timezone issues
      const startHourUTC = startTime.getUTCHours();
      const startMinuteUTC = startTime.getUTCMinutes();
      const endHourUTC = endTime.getUTCHours();
      const endMinuteUTC = endTime.getUTCMinutes();
      
      // Convert to minutes for easier calculation
      const startMinutes = startHourUTC * 60 + startMinuteUTC;
      const endMinutes = endHourUTC * 60 + endMinuteUTC;
      
      let currentMinutes = startMinutes;
      
      // Generate slots until we reach the end time
      while (currentMinutes + slotDuration <= endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Find appointment that overlaps with this time slot
        const appointment = appointments.find(apt => {
          const aptStart = new Date(apt.startAt);
          const aptEnd = new Date(apt.endAt);
          
          // Convert to minutes for easier comparison
          const slotTimeMin = hour * 60 + minute;
          const aptStartMin = aptStart.getHours() * 60 + aptStart.getMinutes();
          const aptEndMin = aptEnd.getHours() * 60 + aptEnd.getMinutes();
          
          // Slot is occupied if it's within appointment time range
          return slotTimeMin >= aptStartMin && slotTimeMin < aptEndMin;
        });
        
        slots.push({
          time: timeString,
          hour,
          minute,
          appointment,
        });
        
        currentMinutes += slotDuration;
      }
    });

    setTimeSlots(slots);
  }, [workingHours, selectedDate, appointments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const handleConfirm = async (appointmentId: string) => {
    if (!credentials) return;

    try {
      setActionLoading(true);
      console.log('Confirming appointment:', appointmentId);
      console.log('Using credentials:', credentials);
      const updated = await confirmAppointment(credentials, appointmentId);
      console.log('Appointment confirmed:', updated);
      setAppointments(prev =>
        prev.map(apt => (apt.id === appointmentId ? updated : apt))
      );
      setSelectedAppointment(null);
      Alert.alert('Uspeh', 'Termin je potvrđen');
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error message:', error?.message);
      Alert.alert('Greška', error?.response?.data?.error || error.message || 'Nije moguće potvrditi termin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!credentials) return;

    Alert.alert(
      'Otkaži termin',
      'Da li ste sigurni da želite da otkažete ovaj termin?',
      [
        { text: 'Ne', style: 'cancel' },
        {
          text: 'Da',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              console.log('Canceling appointment:', appointmentId);
              console.log('Using credentials:', credentials);
              const updated = await cancelAppointment(credentials, appointmentId);
              console.log('Appointment canceled:', updated);
              setAppointments(prev =>
                prev.map(apt => (apt.id === appointmentId ? updated : apt))
              );
              setSelectedAppointment(null);
              Alert.alert('Uspeh', 'Termin je otkazan');
            } catch (error: any) {
              console.error('Error canceling appointment:', error);
              console.error('Error response:', error?.response?.data);
              console.error('Error message:', error?.message);
              Alert.alert('Greška', error?.response?.data?.error || error.message || 'Nije moguće otkazati termin');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('sr-RS', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'confirmed':
        return theme.colors.success;
      case 'canceled':
        return theme.colors.danger;
      case 'completed':
        return theme.colors.tertiary;
      default:
        return theme.colors.secondary;
    }
  };

  const getStatusLabel = (status: AppointmentStatus): string => {
    switch (status) {
      case 'pending':
        return '🟡 Na čekanju';
      case 'confirmed':
        return '✅ Potvrđeno';
      case 'canceled':
        return '❌ Otkazano';
      case 'completed':
        return '✔️ Završeno';
      default:
        return status;
    }
  };

  const renderTimeSlot = (slot: TimeSlot, index: number) => {
    // Only render empty slots without appointments
    return (
      <View key={slot.time} style={styles.timeSlot}>
        <View style={styles.slotTime}>
          <Text style={styles.slotTimeText}>{slot.time}</Text>
        </View>
        <View style={styles.slotContent} />
      </View>
    );
  };

  const renderAppointmentBlock = (appointment: Appointment) => {
    const aptStart = new Date(appointment.startAt);
    const aptEnd = new Date(appointment.endAt);
    
    // Find the index of the first slot for this appointment
    const startSlotIndex = timeSlots.findIndex(
      slot => slot.hour === aptStart.getHours() && slot.minute === aptStart.getMinutes()
    );
    
    if (startSlotIndex === -1) return null;
    
    // Calculate how many slots this appointment spans
    const durationMin = appointment.durationMin;
    const slotsSpanned = Math.ceil(durationMin / 30);
    
    // Calculate position and height
    const slotHeight = 50;
    const topPosition = startSlotIndex * slotHeight + 2;
    const blockHeight = (slotsSpanned * slotHeight) - 4;
    
    const startTime = formatTime(appointment.startAt);
    const endTime = formatTime(appointment.endAt);
    
    // If single slot (30 min), use horizontal layout
    const isSingleSlot = slotsSpanned === 1;
    
    return (
      <TouchableOpacity
        key={appointment.id}
        style={[
          styles.appointmentBlock,
          {
            top: topPosition,
            height: blockHeight,
            backgroundColor: getStatusBackgroundColor(appointment.status),
          },
        ]}
        onPress={() => setSelectedAppointment(appointment)}
      >
        {isSingleSlot ? (
          <View style={styles.appointmentBlockHorizontal}>
            <View style={{flex: 1}}>
              <Text style={styles.appointmentCustomerCompact} numberOfLines={1}>
                {appointment.customerName}
              </Text>
              {appointment.serviceName && (
                <Text style={styles.appointmentServiceCompact} numberOfLines={1}>
                  {appointment.serviceName}
                </Text>
              )}
            </View>
            <View style={styles.appointmentStatusCompact}>
              <Text style={[styles.statusDot, { color: getStatusColor(appointment.status) }]}>
                ●
              </Text>
              <Text style={styles.statusTextCompact} numberOfLines={1}>
                {getStatusLabel(appointment.status)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.appointmentBlockContent}>
            <Text style={styles.appointmentCustomer} numberOfLines={1}>
              {appointment.customerName}
            </Text>
            {appointment.serviceName && (
              <Text style={styles.appointmentService} numberOfLines={1}>
                {appointment.serviceName}
              </Text>
            )}
            <Text style={styles.appointmentTime} numberOfLines={1}>
              {startTime} - {endTime}
            </Text>
            <View style={styles.appointmentStatus}>
              <Text style={[styles.statusDot, { color: getStatusColor(appointment.status) }]}>
                ●
              </Text>
              <Text style={styles.statusText} numberOfLines={1}>
                {getStatusLabel(appointment.status)}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusBackgroundColor = (status: AppointmentStatus): string => {
    switch (status) {
      case 'pending':
        return 'rgba(255, 159, 10, 0.15)'; // Orange tint
      case 'confirmed':
        return 'rgba(50, 215, 75, 0.15)'; // Green tint
      case 'canceled':
        return 'rgba(255, 69, 58, 0.15)'; // Red tint
      case 'completed':
        return 'rgba(120, 120, 128, 0.15)'; // Gray tint
      default:
        return 'transparent';
    }
  };

  return (
    <View style={styles.container}>
      {/* Date Navigation */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeDate(-1)}
        >
          <Image
            source={require('../assets/icons/ArrorIcon.png')}
            style={[styles.arrowIcon, styles.arrowLeft]}
          />
        </TouchableOpacity>

        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeDate(1)}
        >
          <Image
            source={require('../assets/icons/ArrorIcon.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Učitavanje termina...</Text>
          </View>
        ) : timeSlots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>�</Text>
            <Text style={styles.emptyText}>Nemate definisano radno vreme za ovaj dan</Text>
          </View>
        ) : (
          <View style={styles.timeGridContainer}>
            <View style={styles.timeGrid}>
              {timeSlots.map((slot, index) => renderTimeSlot(slot, index))}
            </View>
            <View style={styles.appointmentsOverlay}>
              {appointments.map(apt => renderAppointmentBlock(apt))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedAppointment !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAppointment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAppointment && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalji termina</Text>
                  <TouchableOpacity 
                    style={styles.closeIcon}
                    onPress={() => setSelectedAppointment(null)}
                  >
                    <Text style={styles.closeIconText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedAppointment.status) }]}>
                    {getStatusLabel(selectedAppointment.status)}
                  </Text>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>👤</Text>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Klijent</Text>
                      <Text style={styles.detailValue}>{selectedAppointment.customerName}</Text>
                    </View>
                  </View>

                  {selectedAppointment.customerPhone && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>📱</Text>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Telefon</Text>
                        <Text style={styles.detailValue}>{selectedAppointment.customerPhone}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>🕐</Text>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Vreme</Text>
                      <Text style={styles.detailValue}>
                        {formatTime(selectedAppointment.startAt)} - {formatTime(selectedAppointment.endAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>⏱</Text>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Trajanje</Text>
                      <Text style={styles.detailValue}>{selectedAppointment.durationMin} min</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>💰</Text>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Cena</Text>
                      <Text style={styles.detailValue}>{selectedAppointment.price} RSD</Text>
                    </View>
                  </View>

                  {selectedAppointment.notes && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>📝</Text>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Napomena</Text>
                        <Text style={styles.detailValue}>{selectedAppointment.notes}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                  <View style={styles.modalActions}>
                    {selectedAppointment.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => handleConfirm(selectedAppointment.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Text style={styles.actionIcon}>✓</Text>
                            <Text style={styles.actionButtonText}>Potvrdi</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancel(selectedAppointment.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.actionIcon}>✕</Text>
                          <Text style={styles.actionButtonText}>Otkaži</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
  },
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  arrowLeft: {
    transform: [{ rotate: '180deg' }],
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing(2),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(10),
  },
  loadingText: {
    marginTop: theme.spacing(2),
    fontSize: 14,
    color: theme.colors.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(10),
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing(3),
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  timeGridContainer: {
    position: 'relative',
    backgroundColor: theme.colors.background,
  },
  timeGrid: {
    backgroundColor: theme.colors.background,
  },
  timeSlot: {
    flexDirection: 'row',
    height: 50,
  },
  slotTime: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: theme.spacing(2),
    backgroundColor: theme.colors.background,
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.tertiary,
  },
  slotContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  appointmentsOverlay: {
    position: 'absolute',
    top: 0,
    left: 70,
    right: 0,
    bottom: 0,
    paddingRight: theme.spacing(2),
  },
  appointmentBlock: {
    position: 'absolute',
    left: theme.spacing(1),
    right: 0,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appointmentBlockContent: {
    flex: 1,
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2),
    justifyContent: 'center',
    gap: theme.spacing(0.5),
  },
  appointmentBlockHorizontal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(2),
    gap: theme.spacing(2),
  },
  appointmentCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  appointmentCustomerCompact: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  appointmentService: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  appointmentServiceCompact: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  appointmentTime: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  appointmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  appointmentStatusCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flexShrink: 0,
  },
  statusDot: {
    fontSize: 8,
  },
  statusText: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  statusTextCompact: {
    fontSize: 9,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing(5),
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(3),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 18,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing(4),
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailsContainer: {
    gap: theme.spacing(3),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(3),
  },
  detailIcon: {
    fontSize: 22,
    width: 32,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: theme.spacing(0.5),
  },
  detailValue: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: theme.spacing(5),
    gap: theme.spacing(2),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing(2.5),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
  },
  confirmButton: {
    backgroundColor: theme.colors.success,
  },
  cancelButton: {
    backgroundColor: theme.colors.danger,
  },
  actionIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
