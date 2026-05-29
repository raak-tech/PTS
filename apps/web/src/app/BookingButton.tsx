export function BookingButton({ calendlyUrl, counselorName }: { calendlyUrl?: string | null; counselorName: string }) {
  if (!calendlyUrl) {
    return (
      <div style={{ background: '#f5f5f5', padding: '14px 16px', borderRadius: 10, textAlign: 'center', fontSize: '14px', color: '#888' }}>
        Booking link not yet available. Messages will be your primary way to connect.
      </div>
    );
  }

  return (
    <a
      href={calendlyUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-block',
        padding: '12px 20px',
        borderRadius: 999,
        background: '#111',
        color: 'white',
        fontWeight: 600,
        fontSize: '14px',
        textDecoration: 'none',
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.8'; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
    >
      📅 Book a session with {counselorName} →
    </a>
  );
}
