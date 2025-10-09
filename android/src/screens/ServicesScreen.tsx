import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Modal,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ImageSourcePropType,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import {
  createBarberService,
  deleteBarberService,
  listBarberServices,
  updateBarberService,
} from '../api/barber';
import {
  BarberService,
  CreateServicePayload,
  UpdateServicePayload,
} from '../types/backend';
import { formatCurrency, formatDuration } from '../utils/format';
import { ApiError } from '../api/client';
import { palette, theme } from '../styles/theme';

const addIcon: ImageSourcePropType = require('../assets/icons/Add.png');
const editIcon: ImageSourcePropType = require('../assets/icons/Edit.png');
const deleteIcon: ImageSourcePropType = require('../assets/icons/Delete.png');

interface ServiceFormData {
  name: string;
  price: string;
  duration: string;
  active: boolean;
}

function sortServices(items: BarberService[]): BarberService[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function ServicesScreen() {
  const { token, tokenType } = useAuth();
  const auth = useMemo(() => ({ token: token ?? '', tokenType }), [token, tokenType]);
  
  // State
  const [services, setServices] = useState<BarberService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchServices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listBarberServices(auth);
      setServices(sortServices(response));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Ne možemo da učitamo usluge.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [auth, token]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const response = await listBarberServices(auth);
      setServices(sortServices(response));
      setError(null);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Ne možemo da osvežimo usluge.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [auth, token]);

  const handleCreateService = useCallback(async (values: CreateServicePayload) => {
    try {
      const created = await createBarberService(auth, values);
      setServices(prev => sortServices([created, ...prev]));
      setShowAddModal(false);
      setError(null);
    } catch (e) {
      throw e; // Let the form handle the error
    }
  }, [auth]);

  const handleUpdateService = useCallback(async (id: string, payload: UpdateServicePayload) => {
    const updated = await updateBarberService(auth, id, payload);
    setServices(prev => sortServices(prev.map(item => (item.id === id ? updated : item))));
    return updated;
  }, [auth]);

  const handleDeleteService = useCallback(async (id: string) => {
    await deleteBarberService(auth, id);
    setServices(prev => prev.filter(service => service.id !== id));
  }, [auth]);

  const currency = useMemo(() => services.find(s => s.currency)?.currency ?? 'RSD', [services]);

  const keyExtractor = useCallback((item: BarberService) => item.id, []);

  const renderItem = useCallback<ListRenderItem<BarberService>>(
    ({ item, index }) => (
      <ServiceCard
        service={item}
        currency={currency}
        onUpdate={handleUpdateService}
        onDelete={handleDeleteService}
        isFirst={index === 0}
        isLast={index === services.length - 1}
      />
    ),
    [currency, handleUpdateService, handleDeleteService, services.length],
  );

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Nema usluga</Text>
      <Text style={styles.emptySubtitle}>
        Dodajte prve usluge koje nudite u vašem salonu
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton} 
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.emptyButtonText}>Dodajte prvu uslugu</Text>
      </TouchableOpacity>
    </View>
  ), []);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Usluge</Text>
        <Text style={styles.headerSubtitle}>
          Upravljajte cenama i trajanjima vaših tretmana
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Image 
          source={addIcon}
          style={styles.addIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  ), []);

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingText}>Učitavamo vaše usluge...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchServices} style={styles.retryButton}>
              <Text style={styles.retryText}>Pokušajte ponovo</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          style={styles.list}
          data={services}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            services.length === 0 && styles.listContentEmpty
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
          bounces={true}
        />



        {/* Add Service Modal */}
        <AddServiceModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateService}
          currency={currency}
        />
      </SafeAreaView>
    </View>
  );
}

// Service Card Component
interface ServiceCardProps {
  service: BarberService;
  currency: string;
  onUpdate: (id: string, payload: UpdateServicePayload) => Promise<BarberService>;
  onDelete: (id: string) => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

function ServiceCard({ service, currency, onUpdate, onDelete, isFirst, isLast }: ServiceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>(() => ({
    name: service.name,
    price: service.price.toString(),
    duration: service.durationMin.toString(),
    active: service.active,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setFormData({
        name: service.name,
        price: service.price.toString(),
        duration: service.durationMin.toString(),
        active: service.active,
      });
      setError(null);
    }
  }, [isEditing, service]);

  const hasChanges = useMemo(() => {
    const normalizedPrice = parseFloat(formData.price.replace(',', '.'));
    const normalizedDuration = parseInt(formData.duration, 10);
    return (
      formData.name.trim() !== service.name ||
      normalizedPrice !== service.price ||
      normalizedDuration !== service.durationMin ||
      formData.active !== service.active
    );
  }, [formData, service]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    
    const name = formData.name.trim();
    const price = parseFloat(formData.price.replace(',', '.'));
    const duration = parseInt(formData.duration, 10);

    if (!name) {
      setError('Naziv je obavezan.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Cena mora biti pozitivan broj.');
      return;
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      setError('Trajanje mora biti pozitivan ceo broj.');
      return;
    }

    setError(null);
    setSaving(true);
    
    try {
      await onUpdate(service.id, {
        name,
        price,
        durationMin: duration,
        active: formData.active,
      });
      setIsEditing(false);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Izmena nije uspela.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [formData, onUpdate, service.id, saving]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Obriši uslugu',
      'Usluga će biti trajno obrisana. Ova akcija se ne može poništiti.',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await onDelete(service.id);
              setIsEditing(false);
            } catch (e) {
              const message = e instanceof ApiError ? e.message : 'Brisanje nije uspelo.';
              setError(message);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }, [onDelete, service.id]);

  const cardStyle = [
    styles.serviceCard,
    isFirst && styles.serviceCardFirst,
    isLast && styles.serviceCardLast,
  ];

  return (
    <View style={cardStyle}>
      {/* Service Header */}
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.serviceMetadata}>
            <View style={[styles.statusBadge, service.active ? styles.statusActive : styles.statusInactive]}>
              <View style={[styles.statusDot, service.active ? styles.statusDotActive : styles.statusDotInactive]} />
              <Text style={styles.statusText}>
                {service.active ? 'Aktivna' : 'Neaktivna'}
              </Text>
            </View>
            <Text style={styles.serviceDuration}>{formatDuration(service.durationMin)}</Text>
          </View>
        </View>
        
        <View style={styles.serviceActions}>
          <Text style={styles.servicePrice}>
            {formatCurrency(service.price, service.currency ?? currency)}
          </Text>
          {!isEditing && (
            <TouchableOpacity 
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Image 
                source={editIcon}
                style={styles.editIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Edit Form */}
      {isEditing && (
        <View style={styles.editForm}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Naziv usluge</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Naziv usluge"
              placeholderTextColor={theme.colors.tertiary}
              editable={!saving}
            />
          </View>
          
          <View style={styles.formRow}>
            <View style={[styles.formField, styles.formFieldHalf]}>
              <Text style={styles.fieldLabel}>Cena ({currency})</Text>
              <TextInput
                style={styles.fieldInput}
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                placeholder="1500"
                placeholderTextColor={theme.colors.tertiary}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>
            
            <View style={[styles.formField, styles.formFieldHalf]}>
              <Text style={styles.fieldLabel}>Trajanje (min)</Text>
              <TextInput
                style={styles.fieldInput}
                value={formData.duration}
                onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                placeholder="30"
                placeholderTextColor={theme.colors.tertiary}
                keyboardType="number-pad"
                editable={!saving}
              />
            </View>
          </View>
          
          <View style={styles.switchField}>
            <Text style={styles.fieldLabel}>Aktivna usluga</Text>
            <Switch
              value={formData.active}
              onValueChange={(value) => setFormData(prev => ({ ...prev, active: value }))}
              trackColor={{ 
                true: theme.colors.accent, 
                false: theme.colors.fill 
              }}
              thumbColor={palette.white}
              disabled={saving}
            />
          </View>
          
          <View style={styles.formActions}>
            <TouchableOpacity 
              onPress={() => setIsEditing(false)}
              style={styles.cancelButton}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Otkaži</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSave}
              style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={palette.white} />
              ) : (
                <Text style={styles.saveButtonText}>Sačuvaj</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {service.active && (
            <TouchableOpacity 
              onPress={handleDelete}
              style={styles.deleteButton}
              disabled={saving}
            >
              <Image 
                source={deleteIcon}
                style={styles.deleteIcon}
                resizeMode="contain"
              />
              <Text style={styles.deleteButtonText}>Obriši uslugu</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// Add Service Modal Component
interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: CreateServicePayload) => Promise<void>;
  currency: string;
}

function AddServiceModal({ visible, onClose, onCreate, currency }: AddServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFormData({ name: '', price: '', duration: '' });
    setError(null);
    setSaving(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const handleCreate = useCallback(async () => {
    if (saving) return;
    
    const name = formData.name.trim();
    const price = parseFloat(formData.price.replace(',', '.'));
    const duration = parseInt(formData.duration, 10);

    if (!name) {
      setError('Naziv usluge je obavezan.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Cena mora biti pozitivan broj.');
      return;
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      setError('Trajanje mora biti pozitivan ceo broj.');
      return;
    }

    setError(null);
    setSaving(true);
    
    try {
      await onCreate({ name, price, durationMin: duration });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Kreiranje usluge nije uspelo.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [formData, onCreate, saving]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancelText}>Otkaži</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Nova usluga</Text>
            
            <TouchableOpacity 
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.accent} />
              ) : (
                <Text style={[styles.modalDoneText, saving && styles.modalDoneTextDisabled]}>
                  Dodaj
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Modal Content */}
          <View style={styles.modalContent}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}
            
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Naziv usluge</Text>
              <TextInput
                style={styles.fieldInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="npr. Muško šišanje"
                placeholderTextColor={theme.colors.tertiary}
                editable={!saving}
                autoFocus
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formField, styles.formFieldHalf]}>
                <Text style={styles.fieldLabel}>Cena ({currency})</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  placeholder="1500"
                  placeholderTextColor={theme.colors.tertiary}
                  keyboardType="decimal-pad"
                  editable={!saving}
                />
              </View>
              
              <View style={[styles.formField, styles.formFieldHalf]}>
                <Text style={styles.fieldLabel}>Trajanje (min)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.duration}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                  placeholder="30"
                  placeholderTextColor={theme.colors.tertiary}
                  keyboardType="number-pad"
                  editable={!saving}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.largeTitle,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    ...theme.typography.footnote,
    color: theme.colors.secondary,
    marginTop: theme.spacing(0.25),
  },
  addButton: {
    width: theme.spacing(5.5),
    height: theme.spacing(5.5),
    borderRadius: theme.radius.continuous.md,
    backgroundColor: theme.colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addIcon: {
    width: theme.spacing(2.5),
    height: theme.spacing(2.5),
    tintColor: theme.colors.primary,
  },
  
  // Loading & Error States
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
  },
  loadingText: {
    ...theme.typography.footnote,
    color: theme.colors.secondary,
  },
  errorContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing(1),
    marginVertical: theme.spacing(1),
    padding: theme.spacing(2.5),
    borderRadius: theme.radius.continuous.md,
    borderColor: theme.colors.danger,
    borderWidth: 1,
  },
  errorText: {
    ...theme.typography.footnote,
    color: theme.colors.danger,
    marginBottom: theme.spacing(1),
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  retryText: {
    ...theme.typography.footnote,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  
  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing(12),
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing(6),
    paddingVertical: theme.spacing(8),
  },
  emptyTitle: {
    ...theme.typography.title2,
    color: theme.colors.primary,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing(4),
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.continuous.md,
  },
  emptyButtonText: {
    ...theme.typography.headline,
    color: palette.white,
    fontWeight: '600',
  },
  
  // Service Card
  serviceCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing(1),
    marginVertical: theme.spacing(0.75),
    borderRadius: theme.radius.continuous.lg,
    padding: theme.spacing(2.5),
    ...theme.shadows.sm,
  },
  serviceCardFirst: {
    marginTop: theme.spacing(2),
  },
  serviceCardLast: {
    marginBottom: theme.spacing(2),
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
    marginRight: theme.spacing(2),
  },
  serviceName: {
    ...theme.typography.headline,
    color: theme.colors.primary,
    marginBottom: theme.spacing(1),
  },
  serviceMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radius.sm,
    gap: theme.spacing(0.75),
  },
  statusActive: {
    backgroundColor: `${theme.colors.success}15`,
  },
  statusInactive: {
    backgroundColor: `${theme.colors.secondary}15`,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: theme.colors.success,
  },
  statusDotInactive: {
    backgroundColor: theme.colors.secondary,
  },
  statusText: {
    ...theme.typography.caption1,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  serviceDuration: {
    ...theme.typography.caption1,
    color: theme.colors.tertiary,
  },
  serviceActions: {
    alignItems: 'flex-end',
    gap: theme.spacing(1),
  },
  servicePrice: {
    ...theme.typography.title3,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  editButton: {
    padding: theme.spacing(0.5),
  },
  editIcon: {
    width: theme.spacing(2.25),
    height: theme.spacing(2.25),
    tintColor: theme.colors.accent,
  },
  
  // Edit Form
  editForm: {
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(3),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing(2.5),
  },
  formField: {
    gap: theme.spacing(0.75),
  },
  formFieldHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
  fieldLabel: {
    ...theme.typography.footnote,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  fieldInput: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1.25),
    ...theme.typography.body,
    color: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing(1.5),
    alignItems: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  cancelButtonText: {
    ...theme.typography.headline,
    color: theme.colors.secondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: theme.spacing(1.5),
    alignItems: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...theme.typography.headline,
    color: palette.white,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: theme.spacing(1.5),
    borderRadius: theme.radius.continuous.sm,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
  },
  deleteIcon: {
    width: 18,
    height: 18,
    marginRight: theme.spacing(1),
    tintColor: theme.colors.danger,
  },
  deleteButtonText: {
    ...theme.typography.footnote,
    color: theme.colors.danger,
    fontWeight: '600',
  },
  
  // Error Banner
  errorBanner: {
    backgroundColor: `${theme.colors.danger}15`,
    borderColor: `${theme.colors.danger}30`,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
  },
  errorBannerText: {
    ...theme.typography.footnote,
    color: theme.colors.danger,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.headline,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalCancelText: {
    ...theme.typography.body,
    color: theme.colors.accent,
  },
  modalDoneText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  modalDoneTextDisabled: {
    opacity: 0.6,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing(3),
    gap: theme.spacing(3),
  },
});