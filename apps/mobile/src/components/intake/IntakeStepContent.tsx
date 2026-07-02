import { Text, View } from 'react-native';

import { HitTarget } from '@/components/HitTarget';

import { TextField } from '@/components/TextField';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { IntakeFormData } from '@/lib/intake';
import { spacing } from '@/theme';

type SetFn = (partial: Partial<IntakeFormData>) => void;

function RadioOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((c) => ({
    row: {
      padding: spacing.sm,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: 'transparent',
      minHeight: 48,
      justifyContent: 'center' as const,
    },
    rowSelected: {
      borderColor: c.accent,
      backgroundColor: c.successBg,
    },
    text: { fontSize: 15, color: c.text, fontWeight: '400' as const },
    textSelected: { fontWeight: '700' as const, color: c.text },
  }));
  return (
    <HitTarget
      style={[styles.row, selected ? styles.rowSelected : null]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.text, selected ? styles.textSelected : null]}>{label}</Text>
    </HitTarget>
  );
}

function CheckboxOption({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((c) => ({
    row: {
      padding: spacing.sm,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: 'transparent',
      minHeight: 48,
      justifyContent: 'center' as const,
    },
    rowSelected: {
      borderColor: c.accent,
      backgroundColor: c.successBg,
    },
    text: { fontSize: 15, color: c.text, fontWeight: '400' as const },
    textSelected: { fontWeight: '700' as const, color: c.text },
  }));
  return (
    <HitTarget
      style={[styles.row, checked ? styles.rowSelected : null]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <Text style={[styles.text, checked ? styles.textSelected : null]}>{label}</Text>
    </HitTarget>
  );
}

function Step1({ data, set }: { data: IntakeFormData; set: SetFn }) {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    label: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    hint: { fontSize: 13, color: c.muted },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing.md,
      backgroundColor: c.surface,
      fontSize: 15,
      minHeight: 100,
      textAlignVertical: 'top' as const,
    },
  }));
  return (
    <View style={styles.section}>
      <Text style={styles.label}>What brought you here?</Text>
      {[
        { value: 'workplace', label: 'Workplace injury or incident' },
        { value: 'accident', label: 'Road accident or trauma' },
        { value: 'sports', label: 'Sports or physical activity' },
        { value: 'general', label: 'Health condition or gradual onset' },
        { value: 'other', label: 'Something else' },
      ].map((s) => (
        <RadioOption
          key={s.value}
          label={s.label}
          selected={data.painSource === s.value}
          onPress={() => set({ painSource: s.value })}
        />
      ))}
      {data.painSource === 'other' ? (
        <TextField
          style={styles.input}
          placeholder="Tell us briefly"
          value={data.painSourceOther}
          onChangeText={(painSourceOther) => set({ painSourceOther })}
        />
      ) : null}
      <Text style={styles.label}>Tell us what happened or what you're dealing with.</Text>
      <TextField
        style={styles.input}
        multiline
        placeholder="A few sentences is plenty."
        value={data.painDescription}
        onChangeText={(painDescription) => set({ painDescription })}
      />
      <Text style={styles.label}>How long has this been affecting you?</Text>
      {[
        { value: 'under1m', label: 'Less than a month' },
        { value: '1to3m', label: '1 – 3 months' },
        { value: '3to6m', label: '3 – 6 months' },
        { value: '6to12m', label: '6 months to a year' },
        { value: 'over1y', label: 'More than a year' },
      ].map((d) => (
        <RadioOption
          key={d.value}
          label={d.label}
          selected={data.painDuration === d.value}
          onPress={() => set({ painDuration: d.value })}
        />
      ))}
    </View>
  );
}

function Step2({ data, set }: { data: IntakeFormData; set: SetFn }) {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    label: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing.md,
      backgroundColor: c.surface,
      fontSize: 15,
    },
  }));
  const ages = ['under18', '18to25', '26to35', '36to50', '51to65', 'over65'];
  const ageLabels: Record<string, string> = {
    under18: 'Under 18',
    '18to25': '18 – 25',
    '26to35': '26 – 35',
    '36to50': '36 – 50',
    '51to65': '51 – 65',
    over65: '65+',
  };
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Age range</Text>
      {ages.map((value) => (
        <RadioOption
          key={value}
          label={ageLabels[value]}
          selected={data.ageRange === value}
          onPress={() => set({ ageRange: value })}
        />
      ))}
      <Text style={styles.label}>Gender</Text>
      {[
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'nonbinary', label: 'Non-binary' },
        { value: 'other', label: 'Other / prefer not to say' },
      ].map((g) => (
        <RadioOption
          key={g.value}
          label={g.label}
          selected={data.gender === g.value}
          onPress={() => set({ gender: g.value })}
        />
      ))}
      <Text style={styles.label}>Occupation / main activity</Text>
      <TextField
        style={styles.input}
        placeholder="e.g. Teacher, footballer"
        value={data.occupation}
        onChangeText={(occupation) => set({ occupation })}
      />
      <Text style={styles.label}>Is this affecting your ability to work or earn?</Text>
      {[
        { value: 'yes', label: "Yes — it's affecting my work or income" },
        { value: 'somewhat', label: 'Somewhat — some impact' },
        { value: 'no', label: 'No — not affecting my work' },
      ].map((o) => (
        <RadioOption
          key={o.value}
          label={o.label}
          selected={data.affectsWork === o.value}
          onPress={() => set({ affectsWork: o.value })}
        />
      ))}
      <Text style={styles.label}>Do you have dependents?</Text>
      <RadioOption label="Yes" selected={data.hasDependents === 'yes'} onPress={() => set({ hasDependents: 'yes' })} />
      <RadioOption label="No" selected={data.hasDependents === 'no'} onPress={() => set({ hasDependents: 'no' })} />
      <Text style={styles.label}>Worked with a therapist or counselor before?</Text>
      <RadioOption label="Yes" selected={data.priorTherapy === 'yes'} onPress={() => set({ priorTherapy: 'yes' })} />
      <RadioOption label="No" selected={data.priorTherapy === 'no'} onPress={() => set({ priorTherapy: 'no' })} />
      <Text style={styles.label}>Where are you based?</Text>
      <TextField
        style={styles.input}
        placeholder="e.g. India, Singapore"
        value={data.countryRegion}
        onChangeText={(countryRegion) => set({ countryRegion })}
      />
    </View>
  );
}

function Step3({ data, set }: { data: IntakeFormData; set: SetFn }) {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    label: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing.md,
      backgroundColor: c.surface,
      fontSize: 15,
      minHeight: 100,
      textAlignVertical: 'top' as const,
    },
  }));
  const toggle = (value: string) => {
    const cur = data.activitiesAffected;
    set({
      activitiesAffected: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value],
    });
  };
  return (
    <View style={styles.section}>
      <Text style={styles.label}>What has this stopped you from doing?</Text>
      {[
        { value: 'work', label: 'Work or study' },
        { value: 'sport', label: 'Sport or physical activity' },
        { value: 'social', label: 'Social life and relationships' },
        { value: 'family', label: 'Caring for family' },
        { value: 'sleep', label: 'Sleep' },
        { value: 'independence', label: 'Getting around independently' },
        { value: 'hobbies', label: 'Hobbies and interests' },
      ].map((a) => (
        <CheckboxOption
          key={a.value}
          label={a.label}
          checked={data.activitiesAffected.includes(a.value)}
          onPress={() => toggle(a.value)}
        />
      ))}
      <Text style={styles.label}>What's the biggest thing that's changed?</Text>
      <TextField
        style={styles.input}
        multiline
        value={data.biggestChange}
        onChangeText={(biggestChange) => set({ biggestChange })}
        placeholder="What matters most to you?"
      />
    </View>
  );
}

function Step4({ data, set }: { data: IntakeFormData; set: SetFn }) {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    label: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing.md,
      backgroundColor: c.surface,
      fontSize: 15,
      minHeight: 100,
      textAlignVertical: 'top' as const,
    },
  }));
  return (
    <View style={styles.section}>
      <Text style={styles.label}>What does getting back to living look like for you?</Text>
      <TextField
        style={styles.input}
        multiline
        value={data.recoveryGoal}
        onChangeText={(recoveryGoal) => set({ recoveryGoal })}
      />
      <Text style={styles.label}>How long do you think this journey might take?</Text>
      {[
        { value: 'weeks', label: 'A few weeks' },
        { value: 'months3', label: 'A few months' },
        { value: 'months6', label: 'Around 6 months' },
        { value: 'year', label: 'About a year' },
        { value: 'ongoing', label: "I'm not sure — it might be ongoing" },
      ].map((t) => (
        <RadioOption
          key={t.value}
          label={t.label}
          selected={data.recoveryTimeline === t.value}
          onPress={() => set({ recoveryTimeline: t.value })}
        />
      ))}
    </View>
  );
}

function Step5({ data, set }: { data: IntakeFormData; set: SetFn }) {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    label: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing.md,
      backgroundColor: c.surface,
      fontSize: 15,
    },
  }));
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Are you currently seeing anyone for this? (optional)</Text>
      <TextField
        style={styles.input}
        value={data.currentTreatment}
        onChangeText={(currentTreatment) => set({ currentTreatment })}
        placeholder="e.g. Seeing a physio weekly"
      />
      <Text style={styles.label}>How much support do you have from people around you?</Text>
      {[
        { value: 'yes', label: "Yes — people understand what I'm going through" },
        { value: 'somewhat', label: "Somewhat — some people get it, some don't" },
        { value: 'no', label: 'Not really — I feel quite alone with this' },
      ].map((s) => (
        <RadioOption
          key={s.value}
          label={s.label}
          selected={data.socialSupport === s.value}
          onPress={() => set({ socialSupport: s.value })}
        />
      ))}
    </View>
  );
}

function Step6({ data, set }: { data: IntakeFormData; set: SetFn }) {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.sm },
    label: { fontSize: 15, fontWeight: '700' as const, color: c.text },
  }));
  return (
    <View style={styles.section}>
      <Text style={styles.label}>How much structure do you want?</Text>
      {[
        { value: 'structured', label: 'Very structured — clear daily tasks' },
        { value: 'mix', label: 'A mix — structure with room to adjust' },
        { value: 'flexible', label: 'Flexible — guidance rather than strict schedule' },
      ].map((s) => (
        <RadioOption
          key={s.value}
          label={s.label}
          selected={data.structurePreference === s.value}
          onPress={() => set({ structurePreference: s.value })}
        />
      ))}
      <Text style={styles.label}>When are you most likely to engage?</Text>
      {[
        { value: 'morning', label: 'Morning (before 10am)' },
        { value: 'midday', label: 'Midday (10am – 2pm)' },
        { value: 'evening', label: 'Evening (after 5pm)' },
        { value: 'varies', label: "It varies — I'll engage when I can" },
      ].map((t) => (
        <RadioOption
          key={t.value}
          label={t.label}
          selected={data.engagementTime === t.value}
          onPress={() => set({ engagementTime: t.value })}
        />
      ))}
      <Text style={styles.label}>When is your energy strongest? (optional)</Text>
      {[
        { value: 'morning', label: 'Morning person' },
        { value: 'evening', label: 'Evening person' },
        { value: 'variable', label: 'Varies day to day' },
      ].map((s) => (
        <RadioOption
          key={s.value}
          label={s.label}
          selected={data.energyPattern === s.value}
          onPress={() => set({ energyPattern: s.value })}
        />
      ))}
      <Text style={styles.label}>Open to gentle daily rhythm practices? (optional)</Text>
      {[
        { value: 'yes', label: 'Yes — I like a steady routine' },
        { value: 'curious', label: 'Curious — willing to try lightly' },
        { value: 'no', label: 'Prefer flexibility only' },
      ].map((s) => (
        <RadioOption
          key={s.value}
          label={s.label}
          selected={data.dinacharyaOpenness === s.value}
          onPress={() => set({ dinacharyaOpenness: s.value })}
        />
      ))}
      <Text style={styles.label}>Open to breath / stillness practices? (optional)</Text>
      {[
        { value: 'yes', label: 'Yes' },
        { value: 'gentle', label: 'Gentle only' },
        { value: 'no', label: 'Not for me' },
      ].map((s) => (
        <RadioOption
          key={s.value}
          label={s.label}
          selected={data.breathStillnessOpenness === s.value}
          onPress={() => set({ breathStillnessOpenness: s.value })}
        />
      ))}
      <Text style={styles.label}>Open to yoga principles? (optional)</Text>
      <Text style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
        Principles and gentle confidence — not exercise prescriptions.
      </Text>
      {[
        { value: 'yes', label: 'Yes — principles and small trials' },
        { value: 'curious', label: 'Curious — keep movement very small' },
        { value: 'no', label: 'Prefer breath/stillness only' },
      ].map((s) => (
        <RadioOption
          key={s.value}
          label={s.label}
          selected={data.yogaOpenness === s.value}
          onPress={() => set({ yogaOpenness: s.value })}
        />
      ))}
      <Text style={styles.label}>Movement vs stillness this week? (optional)</Text>
      {[
        { value: 'stillness', label: 'Mostly stillness and breath' },
        { value: 'balanced', label: 'Balance of stillness and tiny movement' },
        { value: 'movement', label: 'Ready for slightly more movement trials' },
      ].map((s) => (
        <RadioOption
          key={s.value}
          label={s.label}
          selected={data.movementPreference === s.value}
          onPress={() => set({ movementPreference: s.value })}
        />
      ))}
    </View>
  );
}

// Step 7 (index 6) — Red flags, shown one per item with warm copy
function Step7RedFlags({ data, set }: { data: IntakeFormData; set: SetFn }) {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.md },
    intro: { fontSize: 15, color: c.text, lineHeight: 23 },
    flagCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      padding: spacing.md,
    },
    flagText: { fontSize: 14, color: c.text, lineHeight: 21 },
    note: { fontSize: 13, color: c.muted, lineHeight: 20, fontStyle: 'italic' as const },
  }));

  const redFlags = [
    'Severe or sudden new weakness in your arms or legs',
    'Loss of bladder or bowel control',
    'Fever alongside severe pain',
    'Pain that followed a major trauma in the last 48 hours',
    'Numbness in your inner thighs or around the groin',
    'Unexplained significant weight loss',
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.intro}>
        We want to make sure our program is right for you. Take a moment to check if any of these apply to you right now.
      </Text>
      {redFlags.map((f) => (
        <View key={f} style={styles.flagCard}>
          <Text style={styles.flagText}>• {f}</Text>
        </View>
      ))}
      <CheckboxOption
        label="One or more of the above apply to me right now"
        checked={data.hasRedFlags}
        onPress={() => set({ hasRedFlags: !data.hasRedFlags })}
      />
      <Text style={styles.note}>
        If any of these apply, your counselor will review your assessment before your program begins — they'll make sure everything is safe and appropriate for you.
      </Text>
    </View>
  );
}

// Step 8 (index 7) — Safety check + consent confirmation
function Step8Consent({ data, set }: { data: IntakeFormData; set: SetFn }) {
  const styles = useThemedStyles((c) => ({
    section: { gap: spacing.md },
    label: { fontSize: 15, fontWeight: '700' as const, color: c.text },
    body: { fontSize: 14, color: c.muted, lineHeight: 22 },
    crisisCard: {
      backgroundColor: c.dangerBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.danger,
      padding: spacing.md,
      gap: spacing.sm,
    },
    crisisText: { fontSize: 14, color: c.text, lineHeight: 21 },
    crisisLink: { fontSize: 14, color: '#c62828', fontWeight: '600' as const },
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Are you safe right now?</Text>
      <Text style={styles.body}>
        This program is counseling support — it isn't emergency care. If you're in danger right now, please contact a crisis line.
      </Text>
      <RadioOption label="Yes, I'm safe" selected={data.isSafe} onPress={() => set({ isSafe: true })} />
      <RadioOption
        label="I need support right now"
        selected={!data.isSafe}
        onPress={() => set({ isSafe: false })}
      />
      {!data.isSafe && (
        <View style={styles.crisisCard}>
          <Text style={styles.crisisText}>Please reach out to a crisis line now — they are there to help.</Text>
          <Text style={styles.crisisLink}>iCall: 9152987821</Text>
          <Text style={styles.crisisLink}>Aasra: 9820466527</Text>
          <Text style={styles.crisisText}>
            You can still continue your assessment — your counselor will be in touch as soon as possible.
          </Text>
        </View>
      )}
      <CheckboxOption
        label="I understand this is counseling support, not medical advice or emergency care, and I consent to my responses being used to build my personalised program."
        checked={data.consentGiven}
        onPress={() => set({ consentGiven: !data.consentGiven })}
      />
    </View>
  );
}

export function IntakeStepContent({
  step,
  data,
  set,
}: {
  step: number;
  data: IntakeFormData;
  set: SetFn;
}) {
  switch (step) {
    case 0:
      return <Step1 data={data} set={set} />;
    case 1:
      return <Step2 data={data} set={set} />;
    case 2:
      return <Step3 data={data} set={set} />;
    case 3:
      return <Step4 data={data} set={set} />;
    case 4:
      return <Step5 data={data} set={set} />;
    case 5:
      return <Step6 data={data} set={set} />;
    case 6:
      return <Step7RedFlags data={data} set={set} />;
    case 7:
      return <Step8Consent data={data} set={set} />;
    default:
      return null;
  }
}
