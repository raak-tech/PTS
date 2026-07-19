import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { API_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiGetClinicEnrollment,
  apiSetClinicSharingConsent,
  type ClinicEnrollment,
} from '@/lib/api';

const PRIVACY_URL = `${API_URL}/privacy`;

export default function DataScreen() {
  const styles = useThemedStyles((c) => ({
    body: { fontSize: 15, color: c.muted, lineHeight: 22, marginBottom: 12 },
  }));

  return (
    <Screen title="Privacy & data" subtitle="How PTS handles your information">
      <Text style={styles.body}>
        You agreed to data retention at sign-in. PTS stores program responses, messages, and daily notes so your
        counselor can support your recovery.
      </Text>

      <ClinicSharingSection />

      <Button
        label="Read full privacy policy"
        variant="secondary"
        onPress={() => void Linking.openURL(PRIVACY_URL)}
      />
      <Button
        label="Terms of use"
        variant="ghost"
        onPress={() => void Linking.openURL(`${API_URL}/terms`)}
      />
    </Screen>
  );
}

function ClinicSharingSection() {
  const { token } = useAuth();
  const [enrollment, setEnrollment] = useState<ClinicEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useThemedStyles((c) => ({
    clinicName: { fontSize: 16, fontWeight: '700' as const, color: c.text, marginBottom: 6 },
    sharing: { fontSize: 14, color: c.success, fontWeight: '600' as const, marginBottom: 12, lineHeight: 20 },
    notSharing: { fontSize: 14, color: c.muted, fontWeight: '600' as const, marginBottom: 12, lineHeight: 20 },
    note: { fontSize: 12, color: c.faint, marginTop: 10, lineHeight: 18 },
    error: { fontSize: 12, color: c.danger, marginTop: 10, lineHeight: 18 },
  }));

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const { enrollment: e } = await apiGetClinicEnrollment(token);
        setEnrollment(e);
      } catch {
        // silent — clinic sharing is optional and absent for non-clinic patients
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading || !enrollment) return null;

  const sharing = enrollment.consentSharedWithClinic;

  const toggle = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiSetClinicSharingConsent(token, enrollment.enrollmentId, !sharing);
      setEnrollment({ ...enrollment, consentSharedWithClinic: res.consentSharedWithClinic });
    } catch {
      setError('Could not update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Sharing with your clinic">
      <Text style={styles.clinicName}>{enrollment.clinicName}</Text>
      <Text style={sharing ? styles.sharing : styles.notSharing}>
        {sharing
          ? 'You are sharing your progress with this clinic.'
          : 'You are not sharing your progress with this clinic.'}
      </Text>
      <Button
        label={sharing ? 'Stop sharing with my clinic' : 'Share my progress with my clinic'}
        variant={sharing ? 'secondary' : 'primary'}
        onPress={() => void toggle()}
        disabled={saving}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.note}>
        Your clinic can see your engagement and high-level progress — never your messages, notes, or plan detail.
        Stopping does not affect your PTS program. You can turn this back on anytime.
      </Text>
    </Card>
  );
}
