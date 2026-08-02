import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { addCattleUseCase } from '../../di/container';
import { Cattle } from '../../domain/entities/cattle';

interface AddCattleScreenProps {
  onCattleAdded: () => void;
  onCancel: () => void;
}

const BREED_CATEGORIES = [
  {
    category: 'Exotic Breeds',
    icon: '✨',
    breeds: ['Holstein-Friesian', 'Jersey', 'Ayrshire'],
  },
  {
    category: 'Tropical Breeds',
    icon: '🌴',
    breeds: ['Sahiwal', 'Red Sindhi', 'Tharparkar'],
  },
  {
    category: 'Other Breeds',
    icon: '🐮',
    breeds: ['Crossbreed', 'Other'],
  },
];

export const AddCattleScreen: React.FC<AddCattleScreenProps> = ({ onCattleAdded, onCancel }) => {
  // Basic Info
  const [tagNumber, setTagNumber] = useState('');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('Holstein-Friesian');
  const [customBreed, setCustomBreed] = useState('');
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [gender, setGender] = useState<'female' | 'male'>('female');

  // Age
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');

  // Production & Status
  const [status, setStatus] = useState<Cattle['status']>('lactating');
  const [dailyYield, setDailyYield] = useState('');
  const [healthStatus, setHealthStatus] = useState<Cattle['healthStatus']>('healthy');

  // Photos (Up to 3 Images)
  const [photos, setPhotos] = useState<(string | undefined)[]>([
    undefined,
    undefined,
    undefined,
  ]);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [calvesDelivered, setCalvesDelivered] = useState('0');

  const [saving, setSaving] = useState(false);

  const pickImageForSlot = async (slotIndex: number) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera roll access is required to pick a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setPhotos((prev) => {
        const copy = [...prev];
        copy[slotIndex] = uri;
        return copy;
      });
    }
  };

  const takePhotoForSlot = async (slotIndex: number) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setPhotos((prev) => {
        const copy = [...prev];
        copy[slotIndex] = uri;
        return copy;
      });
    }
  };

  const showImageOptionsForSlot = (slotIndex: number) => {
    const slotLabels = ['Photo 1 (Front View)', 'Photo 2 (Side Profile)', 'Photo 3 (Tag / Health)'];
    Alert.alert(
      `Set ${slotLabels[slotIndex]}`,
      'Choose source for this photo slot:',
      [
        { text: 'Camera', onPress: () => takePhotoForSlot(slotIndex) },
        { text: 'Gallery', onPress: () => pickImageForSlot(slotIndex) },
        photos[slotIndex]
          ? {
              text: 'Remove Photo',
              style: 'destructive',
              onPress: () =>
                setPhotos((prev) => {
                  const copy = [...prev];
                  copy[slotIndex] = undefined;
                  return copy;
                }),
            }
          : { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!tagNumber.trim()) {
      Alert.alert('Validation Error', 'Tag Number is required.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Cow Name is required.');
      return;
    }

    setSaving(true);
    try {
      const finalBreed = breed === 'Other' ? (customBreed.trim() || 'Other') : breed;
      const validImages = photos.filter((p): p is string => Boolean(p));

      await addCattleUseCase.execute({
        tagNumber: tagNumber.trim(),
        name: name.trim(),
        breed: finalBreed,
        ageYears: parseInt(ageYears) || 0,
        ageMonths: parseInt(ageMonths) || 0,
        gender,
        status,
        dailyMilkYieldLiters: parseFloat(dailyYield) || 0,
        healthStatus,
        imageUri: validImages[0] || undefined,
        images: validImages.length > 0 ? validImages : undefined,
        medicalHistory: medicalHistory.trim(),
        calvesDelivered: parseInt(calvesDelivered) || 0,
      });

      Alert.alert('Success', `${name.trim()} has been registered!`, [
        { text: 'OK', onPress: onCattleAdded },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to register cattle.');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: { value: Cattle['status']; label: string; icon: string }[] = [
    { value: 'lactating', label: 'Lactating', icon: '🥛' },
    { value: 'dry', label: 'Dry', icon: '🌾' },
    { value: 'pregnant', label: 'Pregnant', icon: '🤰' },
    { value: 'calf', label: 'Calf', icon: '🐮' },
    { value: 'sick', label: 'Sick', icon: '🤒' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register New Cattle</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cow Photos (3 Slots) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Cow Photos (3 Photo Slots)</Text>
          <Text style={styles.photoSectionSubtext}>
            Upload up to 3 photos to display in the profile image slider.
          </Text>

          <View style={styles.slotsRow}>
            {[
              { title: 'Photo 1', sub: 'Front View', badge: 'Main' },
              { title: 'Photo 2', sub: 'Side Profile', badge: 'Side' },
              { title: 'Photo 3', sub: 'Ear Tag / Health', badge: 'Tag' },
            ].map((slot, idx) => {
              const uri = photos[idx];
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.slotCard, uri ? styles.slotCardFilled : null]}
                  onPress={() => showImageOptionsForSlot(idx)}
                  activeOpacity={0.8}
                >
                  {uri ? (
                    <View style={styles.slotImageContainer}>
                      <Image source={{ uri }} style={styles.slotImage} />
                      <View style={styles.slotBadge}>
                        <Text style={styles.slotBadgeText}>{slot.badge}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.slotEmpty}>
                      <Text style={styles.slotCameraIcon}>📷</Text>
                      <Text style={styles.slotTitle}>{slot.title}</Text>
                      <Text style={styles.slotSub}>{slot.sub}</Text>
                      <View style={styles.slotAddTag}>
                        <Text style={styles.slotAddTagText}>+ Add</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tag Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BVX-106"
              placeholderTextColor="#666"
              value={tagNumber}
              onChangeText={setTagNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cow Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Daisy"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Breed *</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setShowBreedModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownBtnText}>
                {breed === 'Other' && customBreed ? `${customBreed} (Custom)` : breed}
              </Text>
              <Text style={styles.dropdownChevron}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, gender === 'female' && styles.toggleBtnActive]}
                onPress={() => setGender('female')}
              >
                <Text style={[styles.toggleText, gender === 'female' && styles.toggleTextActive]}>
                  ♀ Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, gender === 'male' && styles.toggleBtnActive]}
                onPress={() => setGender('male')}
              >
                <Text style={[styles.toggleText, gender === 'male' && styles.toggleTextActive]}>
                  ♂ Male
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Age */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Age</Text>
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Years</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={ageYears}
                onChangeText={setAgeYears}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Months</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 6"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={ageMonths}
                onChangeText={setAgeMonths}
              />
            </View>
          </View>
        </View>

        {/* Status & Health */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Status & Production</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Status</Text>
            <View style={styles.chipRow}>
              {statusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, status === opt.value && styles.chipActive]}
                  onPress={() => setStatus(opt.value)}
                >
                  <Text style={styles.chipIcon}>{opt.icon}</Text>
                  <Text style={[styles.chipText, status === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Health Status</Text>
            <View style={styles.toggleRow}>
              {(['healthy', 'needs_attention', 'under_treatment'] as const).map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.toggleBtnSmall, healthStatus === h && styles.toggleBtnActive]}
                  onPress={() => setHealthStatus(h)}
                >
                  <Text
                    style={[styles.toggleTextSmall, healthStatus === h && styles.toggleTextActive]}
                  >
                    {h === 'healthy' ? '💚' : h === 'needs_attention' ? '⚠️' : '🩺'}{' '}
                    {h === 'healthy'
                      ? 'Healthy'
                      : h === 'needs_attention'
                      ? 'Attention'
                      : 'Treatment'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Est. Daily Milk Yield (Liters)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 22.5"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={dailyYield}
              onChangeText={setDailyYield}
            />
          </View>
        </View>

        {/* Reproduction */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Reproduction</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>No. of Calves Delivered</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={calvesDelivered}
              onChangeText={setCalvesDelivered}
            />
          </View>
        </View>

        {/* Medical History */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Medical History</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vaccination & Treatment Records</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Vaccinated for FMD (Jan 2026). Treated for mastitis (Sep 2025)..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={medicalHistory}
              onChangeText={setMedicalHistory}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Register Cattle</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Breed Selection Modal */}
      <Modal
        visible={showBreedModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBreedModal(false)}
      >
        <View style={styles.breedModalOverlay}>
          <View style={styles.breedModalContent}>
            <View style={styles.breedModalHeader}>
              <Text style={styles.breedModalTitle}>Select Cattle Breed</Text>
              <TouchableOpacity onPress={() => setShowBreedModal(false)}>
                <Text style={styles.breedModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {BREED_CATEGORIES.map((group) => (
                <View key={group.category} style={styles.breedGroup}>
                  <Text style={styles.breedGroupTitle}>
                    {group.icon} {group.category}
                  </Text>
                  {group.breeds.map((b) => {
                    const isSelected = breed === b;
                    return (
                      <TouchableOpacity
                        key={b}
                        style={[
                          styles.breedOption,
                          isSelected && styles.breedOptionSelected,
                        ]}
                        onPress={() => {
                          setBreed(b);
                          if (b !== 'Other') {
                            setShowBreedModal(false);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.breedOptionText,
                            isSelected && styles.breedOptionTextSelected,
                          ]}
                        >
                          {b}
                        </Text>
                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {breed === 'Other' && (
                <View style={styles.customBreedInputContainer}>
                  <Text style={styles.inputLabel}>Specify Custom Breed Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Gir / Brown Swiss"
                    placeholderTextColor="#666"
                    value={customBreed}
                    onChangeText={setCustomBreed}
                    autoFocus
                  />
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneBreedBtn}
              onPress={() => setShowBreedModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBreedBtnText}>Done / Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  imagePickerArea: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  cowImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imagePlaceholderIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholderHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  changePhotoBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  changePhotoText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  toggleBtnSmall: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  toggleText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextSmall: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 12,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  // Breed Dropdown & Modal
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownChevron: {
    color: '#10B981',
    fontSize: 12,
  },
  breedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  breedModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '85%',
  },
  breedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  breedModalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  breedModalCloseText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
    padding: 4,
  },
  breedGroup: {
    marginBottom: 16,
  },
  breedGroupTitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  breedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  breedOptionSelected: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  breedOptionText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
  },
  breedOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkIcon: {
    color: '#34D399',
    fontWeight: '800',
    fontSize: 16,
  },
  customBreedInputContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  doneBreedBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  doneBreedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // 3 Photo Slots styles
  photoSectionSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: -6,
    marginBottom: 12,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  slotCard: {
    flex: 1,
    height: 120,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  slotCardFilled: {
    borderStyle: 'solid',
    borderColor: '#10B981',
  },
  slotImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  slotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  slotBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  slotBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  slotEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  slotCameraIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  slotTitle: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  slotSub: {
    color: '#64748B',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
  slotAddTag: {
    marginTop: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slotAddTagText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
});
