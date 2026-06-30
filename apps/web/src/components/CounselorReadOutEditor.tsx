'use client';

import { useEffect, useRef, useState } from 'react';

type ActiveReadOut = {
  id: string;
  title: string;
  bodyText: string;
  hasCounselorAudio?: boolean;
  isActive?: boolean;
};

type Props = {
  clientId: string;
  initialTitle?: string;
  initialBody?: string;
};

export function CounselorReadOutEditor({ clientId, initialTitle = '', initialBody = '' }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [bodyText, setBodyText] = useState(initialBody);
  const [hasAudio, setHasAudio] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setTitle(initialTitle);
    setBodyText(initialBody);
  }, [initialTitle, initialBody]);

  useEffect(() => {
    void fetch(`/api/reinforcements?clientId=${encodeURIComponent(clientId)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { reinforcements?: ActiveReadOut[] }) => {
        const active = data.reinforcements?.find((r) => r.isActive);
        if (!active) return;
        setActiveId(active.id);
        setTitle(active.title);
        setBodyText(active.bodyText);
        setHasAudio(Boolean(active.hasCounselorAudio));
      });
  }, [clientId]);

  const saveText = async (audioBase64?: string, clearAudio?: boolean) => {
    if (!title.trim() || !bodyText.trim()) {
      setMessage('Title and body are required.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      if (activeId) {
        const res = await fetch(`/api/reinforcements/${activeId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            bodyText: bodyText.trim(),
            counselorAudioBase64: audioBase64,
            counselorAudioMime: audioBase64 ? 'audio/webm' : undefined,
            clearCounselorAudio: clearAudio,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error ?? 'Could not update read-out');
          return;
        }
        setHasAudio(Boolean(data.hasCounselorAudio));
        setMessage(clearAudio ? 'Read-out updated — counselor recording removed.' : 'Read-out updated for client.');
        return;
      }

      const res = await fetch('/api/reinforcements', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          title: title.trim(),
          bodyText: bodyText.trim(),
          counselorAudioBase64: audioBase64,
          counselorAudioMime: audioBase64 ? 'audio/webm' : undefined,
          planWeek: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? 'Could not assign read-out');
        return;
      }
      setActiveId(data.id);
      setHasAudio(Boolean(audioBase64));
      setMessage('Daily read-out saved for this week.');
    } finally {
      setSaving(false);
    }
  };

  const startRecording = async () => {
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setMessage('Microphone access is required to record.');
    }
  };

  const stopAndSaveRecording = async () => {
    const recorder = mediaRef.current;
    if (!recorder) return;
    setRecording(false);
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const base64 = await blobToBase64(blob);
    await saveText(base64);
  };

  return (
    <div>
      <p style={{ color: '#555', fontSize: 14, marginTop: 0 }}>
        Edit the text your client reads each morning. Optionally record yourself reading it aloud for them to listen to first.
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', marginBottom: 10 }}
      />
      <textarea
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        placeholder="What should the client read or internalize?"
        rows={5}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', marginBottom: 12, fontFamily: 'inherit' }}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" onClick={() => void saveText()} disabled={saving}>
          {saving ? 'Saving…' : activeId ? 'Save changes' : 'Assign read-out'}
        </button>
        {recording ? (
          <button type="button" onClick={() => void stopAndSaveRecording()} disabled={saving}>
            Stop & save recording
          </button>
        ) : (
          <button type="button" className="actionLink secondary" onClick={() => void startRecording()} disabled={saving}>
            Record counselor message
          </button>
        )}
        {hasAudio ? (
          <button
            type="button"
            className="actionLink secondary"
            onClick={() => void saveText(undefined, true)}
            disabled={saving}
          >
            Remove recording
          </button>
        ) : null}
      </div>

      {hasAudio ? (
        <p style={{ fontSize: 13, color: '#2e7d32', margin: '0 0 8px' }}>✓ Counselor recording attached — client can play it on Today.</p>
      ) : null}
      {message ? <p role="status" style={{ fontSize: 14, color: '#333' }}>{message}</p> : null}
    </div>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
