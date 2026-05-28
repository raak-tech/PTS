"use client";

import { useEffect, useRef, useState } from "react";

type Contact = { id: string; email: string; role: string };

type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

function anonymise(email: string, role: string) {
  if (role === "provider") {
    // Show counselors by first part of email up to @
    const [local] = email.split("@");
    return `${local} (Counselor)`;
  }
  const [local] = email.split("@");
  return `${local[0]}***@${email.split("@")[1]}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessagesClient({
  currentUserId,
  currentUserRole,
  contacts,
  hasContacts,
  preselectedId,
}: {
  currentUserId: string;
  currentUserRole: string;
  contacts: Contact[];
  hasContacts: boolean;
  preselectedId?: string;
}) {
  const initial = preselectedId ? (contacts.find(c => c.id === preselectedId) ?? contacts[0] ?? null) : (contacts[0] ?? null);
  const [activeContact, setActiveContact] = useState<Contact | null>(initial);
  const [thread, setThread] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThread = async (contact: Contact) => {
    const res = await fetch(`/api/messages?with=${contact.id}`);
    if (res.ok) {
      const data = await res.json() as { messages: Message[] };
      setThread(data.messages ?? []);
    }
  };

  useEffect(() => {
    if (activeContact) loadThread(activeContact);
    // Poll every 8 seconds for new messages
    const interval = setInterval(() => {
      if (activeContact) loadThread(activeContact);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const send = async () => {
    if (!body.trim() || !activeContact || sending) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: activeContact.id, body: body.trim() }),
    });
    if (res.ok) {
      setBody("");
      await loadThread(activeContact);
    }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "inherit" }}>

      {/* Sidebar */}
      <div style={{ width: 260, borderRight: "1px solid #eee", display: "flex", flexDirection: "column", background: "white" }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #eee" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Messages</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {!hasContacts && (
            <div style={{ padding: "24px 16px", color: "#999", fontSize: 14, textAlign: "center" }}>
              <p style={{ margin: "0 0 8px" }}>No messages yet.</p>
              <p style={{ margin: 0, fontSize: 13 }}>Your counselor will reach out once your plan is ready.</p>
            </div>
          )}
          {contacts.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveContact(c)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "14px 16px",
                background: activeContact?.id === c.id ? "#f5f5f5" : "transparent",
                border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                {anonymise(c.email, c.role)}
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>{c.role === "provider" ? "Your counselor" : "Client"}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fafafa" }}>
        {activeContact ? (
          <>
            {/* Thread header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", background: "white" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{anonymise(activeContact.email, activeContact.role)}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#999" }}>{activeContact.role === "provider" ? "Your counselor" : "Client"}</p>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {thread.length === 0 && (
                <p style={{ textAlign: "center", color: "#aaa", fontSize: 14, marginTop: 40 }}>
                  No messages yet. Send the first one.
                </p>
              )}
              {thread.map(m => {
                const mine = m.fromUserId === currentUserId;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 12 }}>
                    <div style={{
                      maxWidth: "72%", padding: "10px 14px", borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: mine ? "#111" : "white", color: mine ? "white" : "#111",
                      border: mine ? "none" : "1px solid #eee", fontSize: 14, lineHeight: 1.5,
                    }}>
                      <p style={{ margin: "0 0 4px", whiteSpace: "pre-wrap" }}>{m.body}</p>
                      <p style={{ margin: 0, fontSize: 11, opacity: 0.6, textAlign: mine ? "right" : "left" }}>
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #eee", background: "white", display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message… (Enter to send)"
                rows={1}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1.5px solid #ddd", fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.5 }}
              />
              <button
                onClick={() => void send()}
                disabled={!body.trim() || sending}
                style={{ padding: "10px 20px", borderRadius: 999, border: "none", background: body.trim() ? "#111" : "#ddd", color: "white", fontWeight: 600, fontSize: 14, cursor: body.trim() ? "pointer" : "not-allowed", flexShrink: 0 }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>
            <p>Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
