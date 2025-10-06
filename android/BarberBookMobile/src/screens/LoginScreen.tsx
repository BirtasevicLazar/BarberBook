import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { palette, theme } from '../styles/theme';

const barberIcon = require('../assets/icons/BarberIcon.png');

export default function LoginScreen() {
  const { login, isLoading: authLoading, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const tokenPreview = useMemo(() => {
    if (!token) return null;
    if (token.length <= 12) return token;
    return `${token.slice(0, 8)}…${token.slice(-4)}`;
  }, [token]);

  const validateForm = useCallback(() => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Unesite ispravnu email adresu.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera.');
      return false;
    }
    return true;
  }, [email, password]);

  const handleSubmit = useCallback(async () => {
    if (loading || authLoading) return;
    setError(null);
    setInfo(null);
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
      setInfo('Uspešno ste prijavljeni.');
      setEmail('');
      setPassword('');
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message || 'Neuspešna prijava. Proverite podatke.');
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Došlo je do greške prilikom prijave.');
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, email, loading, login, password, validateForm]);

  const isSubmitting = loading || authLoading;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Image source={barberIcon} style={styles.icon} resizeMode="contain" />
              </View>
              <Text style={styles.title}>Dobrodošli</Text>
              <Text style={styles.subtitle}>Prijavite se na vaš BarberBook nalog</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {info && <StatusMessage type="success" message={info} tokenPreview={tokenPreview} />}
              {error && <StatusMessage type="error" message={error} />}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email adresa</Text>
                <TextInput
                  style={[styles.input, isSubmitting && styles.inputDisabled]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Unesite email adresu"
                  placeholderTextColor={theme.colors.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  returnKeyType="next"
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Lozinka</Text>
                <TextInput
                  style={[styles.input, isSubmitting && styles.inputDisabled]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Unesite lozinku"
                  placeholderTextColor={theme.colors.tertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  returnKeyType="done"
                  textContentType="password"
                  onSubmitEditing={handleSubmit}
                />
              </View>

              <TouchableOpacity
                style={[styles.signInButton, isSubmitting && styles.signInButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={palette.white} />
                    <Text style={styles.signInText}>Prijavljivanje...</Text>
                  </View>
                ) : (
                  <Text style={styles.signInText}>Prijavite se</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

interface StatusMessageProps {
  type: 'success' | 'error';
  message: string;
  tokenPreview?: string | null;
}

function StatusMessage({ type, message, tokenPreview }: StatusMessageProps) {
  const isSuccess = type === 'success';
  
  return (
    <View style={[styles.statusMessage, isSuccess ? styles.statusSuccess : styles.statusError]}>
      <Text style={[styles.statusText, isSuccess ? styles.statusTextSuccess : styles.statusTextError]}>
        {message}
      </Text>
      {isSuccess && tokenPreview && (
        <Text style={[styles.statusToken, styles.statusTextSuccess]}>
          Token: {tokenPreview}
        </Text>
      )}
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
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(6),
    justifyContent: 'center',
    minHeight: '100%',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing(8),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.continuous.lg,
    backgroundColor: theme.colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(4),
  },
  icon: {
    width: 44,
    height: 44,
    tintColor: theme.colors.accent,
  },
  title: {
    ...theme.typography.largeTitle,
    color: theme.colors.primary,
    marginBottom: theme.spacing(1),
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  
  // Form
  form: {
    gap: theme.spacing(4),
  },
  inputContainer: {
    gap: theme.spacing(1),
  },
  label: {
    ...theme.typography.headline,
    color: theme.colors.primary,
    marginBottom: theme.spacing(0.5),
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.continuous.md,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: Platform.OS === 'ios' ? theme.spacing(2) : theme.spacing(1.5),
    fontSize: 17,
    lineHeight: 22,
    color: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 48,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  
  // Sign in button
  signInButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.continuous.md,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: theme.spacing(2),
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInText: {
    ...theme.typography.headline,
    color: palette.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  
  // Status messages
  statusMessage: {
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(2.5),
    marginBottom: theme.spacing(2),
  },
  statusSuccess: {
    backgroundColor: `${theme.colors.success}15`,
    borderColor: `${theme.colors.success}30`,
    borderWidth: 1,
  },
  statusError: {
    backgroundColor: `${theme.colors.danger}15`,
    borderColor: `${theme.colors.danger}30`,
    borderWidth: 1,
  },
  statusText: {
    ...theme.typography.footnote,
    fontWeight: '500',
  },
  statusTextSuccess: {
    color: theme.colors.success,
  },
  statusTextError: {
    color: theme.colors.danger,
  },
  statusToken: {
    ...theme.typography.caption2,
    marginTop: theme.spacing(0.5),
    opacity: 0.8,
  },
});
