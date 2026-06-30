import Link from 'next/link';

export function CrisisResourcesBanner() {
  return (
    <div
      role="complementary"
      aria-label="Crisis support resources"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#1a1a2e',
        color: 'rgba(255,255,255,0.9)',
        padding: '8px 16px',
        fontSize: 'clamp(12px, 2.5vw, 13px)',
        textAlign: 'center',
        lineHeight: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <strong style={{ color: '#fbbf24' }}>Need help now?</strong>{' '}
      India:{' '}
      <a href="tel:9152987821" style={{ color: 'white', fontWeight: 600 }}>
        iCall 9152987821
      </a>
      {' · '}
      <a href="tel:9820466726" style={{ color: 'white', fontWeight: 600 }}>
        Aasra 9820466726
      </a>
      {' · '}
      <a
        href="https://findahelpline.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        Global helplines
      </a>
      {' · '}
      <Link href="/red-flags" style={{ color: 'rgba(255,255,255,0.75)' }}>
        Safety guidelines
      </Link>
    </div>
  );
}
