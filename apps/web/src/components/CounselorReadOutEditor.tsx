'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ReadOutRow = {
  id: string;
  title: string;
  bodyText: string;
  hasCounselorAudio?: boolean;
  isActive?: boolean;
  planWeek?: number | null;
};

type Props = {
  clientId: string;
  initialTitle?: string;
  initialBody?: string;
  planWeek?: number;
};

export function CounselorReadOutEditor({
  clientId,
  initialTitle = '',
  initialBody = '',
  planWeek = 1,
}: Props) {
  const [rows, setRows] = useState<ReadOutRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [bodyText, setBodyText] = useState(initialBody);
  const [hasAudio, setHasAudio] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const loadRows = useCallback(async () => {
    const res = await fetch(`/api/reinforcements?clientId=${encodeURIComponent(clientId)}`, {
      credentials: 'include',
    });
    const data = (await res.json()) as { reinforcements?: ReadOutRow[] };
    const list = data.reinforcements ?? [];
    setRows(list);
    return list;
  }, [clientId]);

  useEffect(() => {
    void loadRows().then((list) => {
      if (list.length > 0) {
        const active = list.find((r) => r.isActive) ?? list[0];
        setSelectedId(active.id);
        setTitle(active.title);
        setBodyText(active.bodyText);
        setHasAudio(Boolean(active.hasCounselorAudio));
        return;
      }
      if (initialTitle || initialBody) {
        setSelectedId(null);
        setTitle(initialTitle);
        setBodyText(initialBody);
        setHasAudio(false);
      }
    });
  }, [clientId, initialTitle, initialBody, loadRows]);

  const selectRow = (row: ReadOutRow) => {
    setSelectedId(row.id);
    setTitle(row.title);
    setBodyText(row.bodyText);
    setHasAudio(Boolean(row.hasCounselorAudio));
    setMessage('');
  };

  const startNew = () => {
    setSelectedId(null);
    setTitle('');
    setBodyText('');
    setHasAudio(false);
    setMessage('');
  };

  const saveText = async (audioBase64?: string, clearAudio?: boolean) => {
    if (!title.trim() || !bodyText.trim()) {
      setMessage('Title and body are required.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      if (selectedId) {
        const res = await fetch(`/api/reinforcements/${selectedId}`, {
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
        setMessage(clearAudio ? 'Read-out updated — recording removed.' : 'Read-out saved.');
        await loadRows();
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
          planWeek,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? 'Could not assign read-out');
        return;
      }
      setSelectedId(data.id);
      setHasAudio(Boolean(audioBase64));
      setMessage('Read-out added for this client.');
      await loadRows();
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!selectedId) return;
    if (!window.confirm('Remove this read-out from the client’s list?')) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/reinforcements/${selectedId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? 'Could not remove read-out');
        return;
      }
      const list = await loadRows();
      if (list.length > 0) {
        selectRow(list[0]);
      } else {
        startNew();
      }
      setMessage('Read-out removed.');
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
        Add multiple read-out messages for this week. The client sees every active read-out on Today and can respond to each.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" className="actionLink secondary" onClick={startNew} disabled={saving}>
          + Add read-out
        </button>
        {selectedId ? (
          <button type="button" className="actionLink secondary" onClick={() => void removeSelected()} disabled={saving}>
            Remove selected
          </button>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => selectRow(row)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 10,
                border: row.id === selectedId ? '2px solid #111' : '1px solid #ddd',
                background: row.id === selectedId ? '#f5f5f5' : '#fff',
                cursor: 'pointer',
              }}
            >
              <strong style={{ fontSize: 14 }}>{row.title}</strong>
              <span style={{ display: 'block', fontSize: 12, color: '#666', marginTop: 4 }}>
                {row.isActive ? 'Active this week' : 'Scheduled / past'}
                {row.hasCounselorAudio ? ' · audio attached' : ''}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>No read-outs yet — add one below.</p>
      )}

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
          {saving ? 'Saving…' : selectedId ? 'Save changes' : 'Add read-out'}
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
