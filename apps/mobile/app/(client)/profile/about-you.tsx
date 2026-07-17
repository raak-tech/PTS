import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  apiAnswerProfileFieldRequest,
  apiGetClientProfile,
  apiSetProfileConsent,
  apiUpdateClientProfile,
  type ClientProfileView,
} from '@/lib/api';

export default function AboutYouScreen() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ClientProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [requestAnswers, setRequestAnswers] = useState<Record<string, string>>({});
  const [consentBusy, setConsentBusy] = useState(false);

  const styles = useThemedStyles((c) => ({
    body: { fontSize: 15, color: c.muted, lineHeight: 22 },
    meterTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: c.border,
      overflow: 'hidden' as const,
      marginTop: 8,
    },
    meterFill: { height: '100%' as const, backgroundColor: c.accent, borderRadius: 5 },
    meterLabel: { fontSize: 14, color: c.text, fontWeight: '600' as const, marginTop: 12 },
    fieldLabel: { fontSize: 14, fontWeight: '600' as const, color: c.text, marginBottom: 6 },
    locked: { fontSize: 13, color: c.muted, fontStyle: 'italic' as const, marginBottom: 8 },
    consentRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    consentText: { flex: 1, fontSize: 14, color: c.text, lineHeight: 20, paddingRight: 12 },
    error: { fontSize: 14, color: c.danger, marginBottom: 12 },
  }));

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetClientProfile(token);
      setProfile(res.profile);
      const nextDrafts: Record<string, string> = {};
      for (const field of res.profile.fields) {
        nextDrafts[field.key] = field.value ?? '';
      }
      setDrafts(nextDrafts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveField = async (key: string) => {
    if (!token || !profile) return;
    const field = profile.fields.find((f) => f.key === key);
    if (!field?.editable) return;
    setSavingKey(key);
    try {
      const res = await apiUpdateClientProfile(token, { [key]: drafts[key]?.trim() || null });
      setProfile(res.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingKey(null);
    }
  };

  const toggleMedicalConsent = async (granted: boolean) => {
    if (!token) return;
    setConsentBusy(true);
    try {
      const res = await apiSetProfileConsent(token, 'medical', granted);
      setProfile((prev) => (prev ? { ...prev, consentGrants: res.consentGrants, fields: prev.fields.map((f) => {
        if (f.consentScope !== 'medical') return f;
        return {
          ...f,
          editable: granted,
          lockedReason: granted ? undefined : 'Enable medical sharing consent below to edit this field.',
        };
      }) } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Consent update failed');
    } finally {
      setConsentBusy(false);
    }
  };

  const answerRequest = async (requestId: string) => {
    if (!token) return;
    const value = requestAnswers[requestId]?.trim();
    if (!value) return;
    setSavingKey(requestId);
    try {
      const res = await apiAnswerProfileFieldRequest(token, requestId, value);
      setProfile(res.profile);
      setRequestAnswers((prev) => ({ ...prev, [requestId]: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send answer');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <Screen title="About you" subtitle="Build your profile over time">
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen title="About you" subtitle="Build your profile over time">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Try again" onPress={() => void load()} />
      </Screen>
    );
  }

  const nonSensitive = profile.fields.filter((f) => !f.sensitive);
  const sensitive = profile.fields.filter((f) => f.sensitive);
  const medicalConsent = profile.consentGrants.find((g) => g.scope === 'medical');

  return (
    <Screen title="About you" subtitle="Build your profile over time">
      <Text style={styles.body}>
        A fuller picture helps your counselor personalise your plan. Add what feels comfortable — you can update anytime.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card title="Profile completeness">
        <Text style={styles.meterLabel}>{profile.completenessLabel}</Text>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${Math.round(profile.completeness * 100)}%` }]} />
        </View>
        {profile.microPrompt ? (
          <Text style={[styles.body, { marginTop: 12 }]}>
            Suggested next: {profile.microPrompt.prompt}
          </Text>
        ) : null}
      </Card>

      {profile.pendingFieldRequests.length > 0 ? (
        <Card title="From your counselor">
          {profile.pendingFieldRequests.map((req) => (
            <View key={req.id} style={{ marginBottom: 16 }}>
              <Text style={styles.fieldLabel}>{req.fieldLabel}</Text>
              <Text style={styles.body}>{req.prompt}</Text>
              <TextField
                value={requestAnswers[req.id] ?? ''}
                onChangeText={(text) => setRequestAnswers((prev) => ({ ...prev, [req.id]: text }))}
                multiline
                placeholder="Your answer"
              />
              <Button
                label={savingKey === req.id ? 'Sending…' : 'Send answer'}
                variant="secondary"
                onPress={() => void answerRequest(req.id)}
                loading={savingKey === req.id}
              />
            </View>
          ))}
        </Card>
      ) : null}

      <Card title="Life & goals">
        {nonSensitive.map((field) => (
          <View key={field.key} style={{ marginBottom: 16 }}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextField
              value={drafts[field.key] ?? ''}
              onChangeText={(text) => setDrafts((prev) => ({ ...prev, [field.key]: text }))}
              multiline
              placeholder="Optional"
            />
            <Button
              label={savingKey === field.key ? 'Saving…' : 'Save'}
              variant="ghost"
              onPress={() => void saveField(field.key)}
              loading={savingKey === field.key}
            />
          </View>
        ))}
      </Card>

      <Card title="Medical details (optional)">
        <View style={styles.consentRow}>
          <Text style={styles.consentText}>
            Share medical details with your counselor for safer personalisation. You can revoke anytime.
          </Text>
          <Switch
            value={Boolean(medicalConsent?.granted)}
            onValueChange={(v) => void toggleMedicalConsent(v)}
            disabled={consentBusy}
          />
        </View>
        {sensitive.map((field) => (
          <View key={field.key} style={{ marginTop: 16 }}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            {field.lockedReason ? <Text style={styles.locked}>{field.lockedReason}</Text> : null}
            <TextField
              value={drafts[field.key] ?? ''}
              onChangeText={(text) => setDrafts((prev) => ({ ...prev, [field.key]: text }))}
              multiline
              placeholder="Optional"
              editable={field.editable}
            />
            {field.editable ? (
              <Button
                label={savingKey === field.key ? 'Saving…' : 'Save'}
                variant="ghost"
                onPress={() => void saveField(field.key)}
                loading={savingKey === field.key}
              />
            ) : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
