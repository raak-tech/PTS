import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { apiGetContacts, apiGetMessages, apiSendMessage } from '@/lib/api';
import { spacing } from '@/theme';

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const threadRef = useRef<ScrollView>(null);
  const [title, setTitle] = useState('Messages');
  const [messages, setMessages] = useState<{ id: string; fromUserId: string; body: string }[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const styles = useThemedStyles((c) => ({
    thread: { gap: 10, paddingVertical: 8 },
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
    theirs: { alignSelf: 'flex-start' as const, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    mine: { alignSelf: 'flex-end' as const, backgroundColor: c.primary },
    mineText: { color: c.onPrimary },
    text: { color: c.text, fontSize: 15, lineHeight: 22 },
    composer: { gap: 8 },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: c.surface,
      fontSize: 15,
    },
    send: { alignSelf: 'flex-end' as const, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    sendText: { color: c.accent, fontWeight: '700' as const, fontSize: 15 },
    sendDisabled: { color: c.faint },
  }));

  const scrollThreadToEnd = useCallback(() => {
    threadRef.current?.scrollToEnd({ animated: true });
  }, []);

  const load = useCallback(async () => {
    if (!token || !id) return;
    const [{ messages: rows }, contacts] = await Promise.all([
      apiGetMessages(token, id),
      apiGetContacts(token),
    ]);
    setMessages(rows);
    const name =
      contacts.counselor?.id === id
        ? contacts.counselor.name
        : contacts.clients?.find((c) => c.id === id)?.name;
    if (name) setTitle(name);
    setTimeout(scrollThreadToEnd, 100);
  }, [token, id, scrollThreadToEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSend = async () => {
    if (!token || !id || !draft.trim()) return;
    setSending(true);
    try {
      await apiSendMessage(token, id, draft.trim());
      setDraft('');
      await load();
    } finally {
      setSending(false);
    }
  };

  const composer = (
    <View style={styles.composer}>
      <TextField
        style={styles.input}
        placeholder="Type a message…"
        value={draft}
        onChangeText={setDraft}
        onFocus={scrollThreadToEnd}
      />
      <Pressable style={styles.send} onPress={onSend} disabled={sending || !draft.trim()}>
        <Text style={[styles.sendText, (sending || !draft.trim()) && styles.sendDisabled]}>Send</Text>
      </Pressable>
    </View>
  );

  return (
    <Screen title={title} subtitle="Secure messaging" scroll={false} footer={composer}>
      <ScrollView
        ref={threadRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.thread}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        onContentSizeChange={scrollThreadToEnd}
      >
        {messages.map((m) => {
          const mine = m.fromUserId === user?.id;
          return (
            <View key={m.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.text, mine && styles.mineText]}>{m.body}</Text>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
