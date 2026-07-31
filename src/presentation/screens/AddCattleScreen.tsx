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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { addCattleUseCase } from '../../di/container';
import { Cattle } from '../../domain/entities/cattle';

interface AddCattleScreenProps {
  onCattleAdded: () => void;
  onCancel: () => void;
}

export const AddCattleScreen: React.FC<AddCattleScreenProps> = ({ onCattleAdded, onCancel }) => {
  // Basic Info
  const [tagNumber, setTagNumber] = useState('');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('Holstein Friesian');
  const [gender, setGender] = useState<'female' | 'male'>('female');

  // Age
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');

  // Production & Status
  const [status, setStatus] = useState<Cattle['status']>('lactating');
  const [dailyYield, setDailyYield] = useState('');
  const [healthStatus, setHealthStatus] = useState<Cattle['healthStatus']>('healthy');

  // New Fields
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [calvesDelivered, setCalvesDelivered] = useState('0');

  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera roll access is required to pick a cow photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take a cow photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Add Cow Photo', 'How would you like to add a photo?', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
      await addCattleUseCase.execute({
        tagNumber: tagNumber.trim(),
        name: name.trim(),
        breed: breed.trim() || 'Unknown',
        ageYears: parseInt(ageYears) || 0,
        ageMonths: parseInt(ageMonths) || 0,
        gender,
        status,
        dailyMilkYieldLiters: parseFloat(dailyYield) || 0,
        healthStatus,
        imageUri,
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register New Cattle</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cow Photo Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Cow Identification Photo</Text>
          <TouchableOpacity style={styles.imagePickerArea} onPress={showImageOptions}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.cowImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                <Text style={styles.imagePlaceholderText}>Tap to add cow photo</Text>
                <Text style={styles.imagePlaceholderHint}>Camera or Gallery</Text>
              </View>
            )}
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity style={styles.changePhotoBtn} onPress={showImageOptions}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
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
            <Text style={styles.inputLabel}>Breed</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Holstein Friesian"
              placeholderTextColor="#666"
              value={breed}
              onChangeText={setBreed}
            />
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
});
