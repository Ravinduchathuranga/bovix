import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { firebaseConfig } from '../../data/config/firebase';

export const LoginScreen: React.FC = () => {
  const { login, signUp, loginWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      Alert.alert(
        'Google OAuth Provider',
        'Google Sign-In requires an active Web Client ID configured in Google Cloud Console & Firebase OAuth settings. Please use Email/Password sign in for demo authentication.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🐄</Text>
            </View>
            <Text style={styles.title}>Bovix</Text>
            <Text style={styles.subtitle}>Dairy Cattle Management System</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, !isSignUp && styles.toggleBtnActive]}
                onPress={() => {
                  setIsSignUp(false);
                  setErrorMessage('');
                }}
              >
                <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, isSignUp && styles.toggleBtnActive]}
                onPress={() => {
                  setIsSignUp(true);
                  setErrorMessage('');
                }}
              >
                <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name / Farm Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. farmer@bovix.com"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Log In to Dashboard'}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.googleBtnContent}>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  innerContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#334155',
  },
  toggleText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#451A1A',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748B',
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    marginRight: 10,
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  securityNote: {
    marginTop: 24,
    alignItems: 'center',
  },
  securityText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
});
