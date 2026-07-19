import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiGetClinicEnrollment,
  apiGetPhysioSelfReport,
  apiSubmitPhysioSelfReport,
} from '@/lib/api';

type Status = 'yes' | 'partly' | 'no';

const OPTIONS: { value: Status; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'partly', label: 'Partly' },
  { value: 'no', label: 'No' },
];

/**
 * Patient self-report of the physiotherapist's home exercises. This is a
 * SEPARATE signal from PTS program engagement, and clearly labelled as such.
 * Renders only for patients who enrolled with a clinic and consented to sharing.
 */
export function PhysioSelfReportCard() {
  const { token } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [saving, setSaving] = useState(false);

  const styles = useThemedStyles((c) => ({
    meta: { fontSize: 14, color: c.muted, lineHeight: 20 },
    note: { fontSize: 12, color: c.faint, marginTop: 6 },
    row: { flexDirection: 'row' as const, gap: 8, marginTop: 8 },
    chip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center' as const,
    },
    chipActive: { borderColor: c.primary, backgroundColor: c.primary + '18' },
    chipText: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    done: { fontSize: 14, color: c.success, fontWeight: '600' as const, marginTop: 8 },
  }));

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const { enrollment } = await apiGetClinicEnrollment(token);
        if (!enrollment || !enrollment.consentSharedWithClinic) return;
        setEnabled(true);
        const { report } = await apiGetPhysioSelfReport(token);
        if (report) setStatus(report.status as Status);
      } catch {
        // silent — clinic self-report is optional
      }
    })();
  }, [token]);

  if (!enabled) return null;

  const onPick = async (value: Status) => {
    if (!token) return;
    setSaving(true);
    const previous = status;
    setStatus(value);
    try {
      await apiSubmitPhysioSelfReport(token, value);
    } catch {
      setStatus(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Physio exercises today">
      <Text style={styles.meta}>Did you do your physiotherapist&apos;s home exercises today?</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => void onPick(opt.value)}
            disabled={saving}
            style={[styles.chip, status === opt.value && styles.chipActive]}
          >
            <Text style={styles.chipText}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
      {status ? <Text style={styles.done}>✓ Saved for today</Text> : null}
      <Text style={styles.note}>Your own record — this is separate from your PTS practices.</Text>
    </Card>
  );
}
