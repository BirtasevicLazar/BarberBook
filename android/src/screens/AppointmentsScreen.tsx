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
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { 
  listAppointments, 
  confirmAppointment, 
  cancelAppointment,
  deleteAppointment, 
  listWorkingHours, 
  createAppointment,
  listBarberServices,
  getBarberProfile,
  BarberProfile,
} from '../api/barber';
import { Appointment, AppointmentStatus, BarberWorkingHour, BarberService } from '../types/backend';

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  appointment?: Appointment;
}

export default function AppointmentsScreen() {
  const { credentials } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [workingHours, setWorkingHours] = useState<BarberWorkingHour[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Create appointment modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [services, setServices] = useState<BarberService[]>([]);
  const [barberProfile, setBarberProfile] = useState<BarberProfile | null>(null);
  const [formData, setFormData] = useState({
    serviceId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  });

  // Load working hours, services, and barber profile (once)
  useEffect(() => {
    if (!credentials) return;
    
    const loadBarberProfile = async () => {
      try {
        const profile = await getBarberProfile(credentials);
        setBarberProfile(profile);
      } catch (error: any) {
        console.error('Failed to load barber profile:', error);
      }
    };
    
    const loadWorkingHours = async () => {
      try {
        const hours = await listWorkingHours(credentials);
        setWorkingHours(hours);
      } catch (error: any) {
        console.error('Failed to load working hours:', error);
      }
    };
    
    const loadServices = async () => {
      try {
        const servicesList = await listBarberServices(credentials);
        setServices(servicesList.filter(s => s.active));
      } catch (error: any) {
        console.error('Failed to load services:', error);
      }
    };
    
    loadBarberProfile();
    loadWorkingHours();
    loadServices();
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
    if (workingHours.length === 0 || !barberProfile) return;

    const dayOfWeek = selectedDate.getDay();
    const todayWorkingHours = workingHours.filter(wh => wh.dayOfWeek === dayOfWeek);

    if (todayWorkingHours.length === 0) {
      setTimeSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];
    const slotDuration = barberProfile.slotDurationMinutes; // Use barber's configured slot duration

    todayWorkingHours.forEach(wh => {
      // Parse time string directly - backend sends "2000-01-01T10:00:00Z"
      // Extract hour and minute from the ISO string
      const startMatch = wh.startTime.match(/T(\d{2}):(\d{2})/);
      const endMatch = wh.endTime.match(/T(\d{2}):(\d{2})/);
      
      if (!startMatch || !endMatch) return;
      
      const startHour = parseInt(startMatch[1], 10);
      const startMinute = parseInt(startMatch[2], 10);
      const endHour = parseInt(endMatch[1], 10);
      const endMinute = parseInt(endMatch[2], 10);
      
      // Convert to minutes for easier calculation
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
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
  }, [workingHours, selectedDate, appointments, barberProfile]);

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
              console.log('Canceling and deleting appointment:', appointmentId);
              
              // First cancel the appointment
              await cancelAppointment(credentials, appointmentId);
              console.log('Appointment canceled');
              
              // Then delete it from database
              await deleteAppointment(credentials, appointmentId);
              console.log('Appointment deleted');
              
              // Remove from local state
              setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
              setSelectedAppointment(null);
              Alert.alert('Uspeh', 'Termin je otkazan i obrisan');
            } catch (error: any) {
              console.error('Error canceling/deleting appointment:', error);
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

  const handleCreateAppointment = async () => {
    if (!credentials || !selectedTimeSlot || !barberProfile) return;
    
    if (!formData.serviceId) {
      Alert.alert('Greška', 'Morate izabrati uslugu');
      return;
    }
    
    if (!formData.customerName.trim()) {
      Alert.alert('Greška', 'Morate uneti ime klijenta');
      return;
    }

    try {
      setActionLoading(true);
      
      // Create start time from selected date and time slot
      const startAt = new Date(selectedDate);
      startAt.setHours(selectedTimeSlot.hour, selectedTimeSlot.minute, 0, 0);
      
      const newAppointment = await createAppointment(credentials, {
        salonId: barberProfile.salonId,
        barberId: barberProfile.id,
        barberServiceId: formData.serviceId,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim() || undefined,
        customerEmail: formData.customerEmail.trim() || undefined,
        startAt: startAt.toISOString(),
        notes: formData.notes.trim() || undefined,
      });
      
      // Automatically confirm appointments created by barber
      const confirmedAppointment = await confirmAppointment(credentials, newAppointment.id);
      
      setAppointments(prev => [...prev, confirmedAppointment]);
      setCreateModalVisible(false);
      setFormData({ serviceId: '', customerName: '', customerPhone: '', customerEmail: '', notes: '' });
      Alert.alert('Uspeh', 'Termin je uspešno kreiran i potvrđen');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      Alert.alert('Greška', error.message || 'Nije moguće kreirati termin');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setCreateModalVisible(true);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date: Date): string => {
    const daysOfWeek = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
    const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
    
    const dayName = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day}. ${month} ${year}`;
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
    const isEmpty = !slot.appointment;
    
    return (
      <View key={slot.time} style={styles.timeSlot}>
        <View style={styles.slotTime}>
          <Text style={styles.slotTimeText}>{slot.time}</Text>
        </View>
        {isEmpty ? (
          <TouchableOpacity
            style={styles.slotContent}
            onPress={() => openCreateModal(slot)}
            activeOpacity={0.7}
          >
            <Text style={styles.slotEmptyText}>+</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.slotContent} />
        )}
      </View>
    );
  };

  const renderAppointmentBlock = (appointment: Appointment) => {
    if (!barberProfile) return null;
    
    const aptStart = new Date(appointment.startAt);
    const aptEnd = new Date(appointment.endAt);
    
    // Find the index of the first slot for this appointment
    const startSlotIndex = timeSlots.findIndex(
      slot => slot.hour === aptStart.getHours() && slot.minute === aptStart.getMinutes()
    );
    
    if (startSlotIndex === -1) return null;
    
    // Calculate how many slots this appointment spans
    const durationMin = appointment.durationMin;
    const slotsSpanned = Math.ceil(durationMin / barberProfile.slotDurationMinutes);
    
    // Calculate position and height
    const slotHeight = 50;
    const topPosition = startSlotIndex * slotHeight + 2;
    const blockHeight = (slotsSpanned * slotHeight) - 4;
    
    const startTime = formatTime(appointment.startAt);
    const endTime = formatTime(appointment.endAt);
    
    // If single slot, use horizontal layout
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
            source={require('../assets/icons/ArrowIcon.png')}
            style={[styles.arrowIcon, styles.arrowLeft]}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.dateDisplay}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeDate(1)}
        >
          <Image
            source={require('../assets/icons/ArrowIcon.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          textColor="#fff"
        />
      )}

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

                <ScrollView 
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
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

                    {selectedAppointment.customerEmail && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>📧</Text>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Email</Text>
                          <Text style={styles.detailValue}>{selectedAppointment.customerEmail}</Text>
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
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Appointment Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCreateModalVisible(false);
          setFormData({ serviceId: '', customerName: '', customerPhone: '', customerEmail: '', notes: '' });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novi termin</Text>
              <TouchableOpacity 
                style={styles.closeIcon}
                onPress={() => {
                  setCreateModalVisible(false);
                  setFormData({ serviceId: '', customerName: '', customerPhone: '', customerEmail: '', notes: '' });
                }}
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              {selectedTimeSlot && (
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Vreme</Text>
                  <Text style={styles.formValue}>
                    {selectedTimeSlot.time} - {formatDate(selectedDate)}
                  </Text>
                </View>
              )}

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Usluga *</Text>
                <View style={styles.servicesGrid}>
                  {services.map(service => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceChip,
                        formData.serviceId === service.id && styles.serviceChipSelected,
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, serviceId: service.id }))}
                    >
                      <Text style={[
                        styles.serviceChipText,
                        formData.serviceId === service.id && styles.serviceChipTextSelected,
                      ]}>
                        {service.name}
                      </Text>
                      <Text style={styles.serviceChipPrice}>{service.price} RSD</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Ime klijenta *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.customerName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, customerName: text }))}
                  placeholder="Unesite ime"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Telefon</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.customerPhone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, customerPhone: text }))}
                  placeholder="Unesite telefon"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="phone-pad"
                />
              </View>


              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Napomena</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Dodatne informacije"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleCreateAppointment}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.actionIcon}>✓</Text>
                    <Text style={styles.actionButtonText}>Kreiraj</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  arrowIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
  arrowLeft: {
    transform: [{ rotate: '180deg' }],
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing(2),
  },
  dateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  calendarIcon: {
    fontSize: 18,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotEmptyText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.15)',
    fontWeight: '300',
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: theme.spacing(5),
    maxHeight: '85%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: theme.spacing(2),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(4),
    paddingBottom: theme.spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  closeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(2),
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: theme.spacing(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  detailsContainer: {
    gap: theme.spacing(3.5),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
    paddingVertical: theme.spacing(1),
  },
  detailIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: theme.spacing(0.75),
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: theme.spacing(5),
    gap: theme.spacing(3),
    paddingTop: theme.spacing(3),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing(3),
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1.5),
  },
  confirmButton: {
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.3)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  actionIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  formContainer: {
    maxHeight: 400,
  },
  formSection: {
    marginBottom: theme.spacing(4),
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing(2),
    letterSpacing: 0.3,
  },
  formValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: theme.spacing(3.5),
    paddingVertical: theme.spacing(3),
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    letterSpacing: 0.2,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(2.5),
  },
  serviceChip: {
    paddingHorizontal: theme.spacing(3.5),
    paddingVertical: theme.spacing(2.5),
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  serviceChipSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: '#fff',
    borderWidth: 2,
  },
  serviceChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: theme.spacing(0.75),
    letterSpacing: 0.2,
  },
  serviceChipTextSelected: {
    color: '#fff',
  },
  serviceChipPrice: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
});
