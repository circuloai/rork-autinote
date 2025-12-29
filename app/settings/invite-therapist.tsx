import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, User, Briefcase, Send } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useMemo, useState } from 'react';
import { getColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const THERAPIST_ROLES: import('@/types').TherapistRole[] = [
  'ABA',
  'OT',
  'Psychologist',
  'SLP',
  'Behavioral Therapist',
  'Other',
];

export default function InviteTherapistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeChild, preferences, addSharedAccess } = useApp();
  const Colors = useMemo(() => getColors(preferences), [preferences]);
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const [therapistName, setTherapistName] = useState('');
  const [therapistEmail, setTherapistEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<import('@/types').TherapistRole | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendInvitation = async () => {
    if (!therapistName.trim()) {
      Alert.alert('Error', 'Please enter therapist name');
      return;
    }

    if (!therapistEmail.trim()) {
      Alert.alert('Error', 'Please enter therapist email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(therapistEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!selectedRole) {
      Alert.alert('Error', 'Please select a therapist role');
      return;
    }

    if (!activeChild) {
      Alert.alert('Error', 'No child profile selected');
      return;
    }

    setIsSubmitting(true);

    try {
      addSharedAccess({
        childId: activeChild.id,
        therapistName: therapistName.trim(),
        therapistEmail: therapistEmail.trim().toLowerCase(),
        therapistRole: selectedRole,
        status: 'pending',
        canViewLogs: true,
        canViewProgress: true,
        canViewProfile: true,
        canAddNotes: true,
        canAddSessions: true,
        canComment: true,
        canExport: true,
        readonlyMode: false,
      });

      Alert.alert(
        'Invitation Sent',
        `An invitation has been sent to ${therapistEmail}. They will appear in your shared access list once they accept.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeChild) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite Therapist</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No child profile selected</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Therapist</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.childCard}>
          <Text style={styles.childCardTitle}>Inviting for</Text>
          <Text style={styles.childCardName}>{activeChild.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Therapist Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <View style={styles.inputContainer}>
              <User size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter therapist's full name"
                placeholderTextColor={Colors.textLight}
                value={therapistName}
                onChangeText={setTherapistName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="therapist@example.com"
                placeholderTextColor={Colors.textLight}
                value={therapistEmail}
                onChangeText={setTherapistEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role *</Text>
            <View style={styles.rolesContainer}>
              {THERAPIST_ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleChip,
                    selectedRole === role && styles.roleChipSelected,
                  ]}
                  onPress={() => setSelectedRole(role)}
                  activeOpacity={0.7}
                >
                  <Briefcase
                    size={16}
                    color={selectedRole === role ? Colors.surface : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.roleChipText,
                      selectedRole === role && styles.roleChipTextSelected,
                    ]}
                  >
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Default Permissions</Text>
          <Text style={styles.infoText}>
            By default, invited therapists will have access to:
          </Text>
          <View style={styles.infoBullet}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.infoText}>View logs and progress</Text>
          </View>
          <View style={styles.infoBullet}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.infoText}>View insights and reports</Text>
          </View>
          <View style={styles.infoBullet}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.infoText}>Add professional notes</Text>
          </View>
          <View style={styles.infoBullet}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.infoText}>View calendar events</Text>
          </View>
          <Text style={[styles.infoText, { marginTop: 12 }]}>
            You can customize these permissions after they accept the invitation.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!therapistName || !therapistEmail || !selectedRole || isSubmitting) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSendInvitation}
          disabled={!therapistName || !therapistEmail || !selectedRole || isSubmitting}
          activeOpacity={0.7}
        >
          <Send size={20} color={Colors.surface} />
          <Text style={styles.sendButtonText}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: Colors.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    childCard: {
      backgroundColor: Colors.primary + '15',
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: Colors.primary + '30',
    },
    childCardTitle: {
      fontSize: 13,
      color: Colors.textSecondary,
      marginBottom: 4,
    },
    childCardName: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: Colors.primary,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: Colors.text,
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: Colors.text,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 12,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: Colors.text,
    },
    rolesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    roleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    roleChipSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    roleChipText: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: Colors.text,
    },
    roleChipTextSelected: {
      color: Colors.surface,
      fontWeight: '600' as const,
    },
    infoCard: {
      backgroundColor: Colors.secondary + '10',
      borderRadius: 16,
      padding: 20,
      marginTop: 24,
      borderWidth: 1,
      borderColor: Colors.secondary + '30',
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: Colors.text,
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: Colors.text,
      lineHeight: 20,
    },
    infoBullet: {
      flexDirection: 'row',
      marginTop: 8,
      paddingLeft: 8,
    },
    bulletPoint: {
      fontSize: 14,
      color: Colors.secondary,
      marginRight: 8,
      fontWeight: '700' as const,
    },
    sendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: Colors.primary,
      paddingVertical: 16,
      borderRadius: 14,
      marginTop: 24,
    },
    sendButtonDisabled: {
      backgroundColor: Colors.textLight,
      opacity: 0.5,
    },
    sendButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: Colors.surface,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: Colors.textSecondary,
    },
  });
