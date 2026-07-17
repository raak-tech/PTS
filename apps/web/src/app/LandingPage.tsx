import Link from 'next/link';

const chip = (label: string) => (
  <span key={label} style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#f0ede4', color: '#666', padding: '4px 12px', borderRadius: 999 }}>
    {label}
  </span>
);

export function LandingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif', color: '#111', overflowX: 'hidden', background: '#f4f4f0' }}>
      <style>{`
        .pts-nav-links { display: flex; gap: 4px; align-items: center; }
        @media (max-width: 680px) { .pts-nav-links { display: none; } }

        .pts-problem-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; }
        @media (max-width: 600px) { .pts-problem-grid { grid-template-columns: 1fr; } }

        .pts-faq-item { border-bottom: 1px solid #ddd9d0; }
        .pts-faq-item summary {
          list-style: none; cursor: pointer; display: flex; justify-content: space-between;
          align-items: center; padding: 24px 0; font-size: 17px; font-weight: 700; color: #111;
          gap: 16px;
        }
        .pts-faq-item summary::-webkit-details-marker { display: none; }
        .pts-faq-item summary::after {
          content: '+'; flex-shrink: 0; font-size: 22px; font-weight: 300; color: #aaa;
          transition: transform 0.2s ease;
        }
        .pts-faq-item[open] summary::after { content: '−'; color: #c8791a; }
        .pts-faq-answer { padding: 0 0 24px; font-size: 15px; color: #555; line-height: 1.7; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(244,244,240,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #ddd9d0', padding: '0 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>Pain to Strength</span>
            <span style={{ fontSize: 11, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>PTS</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="pts-nav-links">
              <a href="#approach" style={{ fontSize: 14, color: '#555', textDecoration: 'none', padding: '8px 14px', borderRadius: 999 }}>Our approach</a>
              <a href="#how" style={{ fontSize: 14, color: '#555', textDecoration: 'none', padding: '8px 14px', borderRadius: 999 }}>How it works</a>
              <a href="#counselor" style={{ fontSize: 14, color: '#555', textDecoration: 'none', padding: '8px 14px', borderRadius: 999 }}>Our counselor</a>
              <a href="#faq" style={{ fontSize: 14, color: '#555', textDecoration: 'none', padding: '8px 14px', borderRadius: 999 }}>FAQ</a>
              <div style={{ width: 1, height: 18, background: '#ddd', margin: '0 4px' }} />
            </div>
            <Link href="/login" style={{ fontSize: 14, color: '#555', textDecoration: 'none', padding: '8px 16px', borderRadius: 999 }}>Sign in</Link>
            <Link href="/register" style={{ fontSize: 14, fontWeight: 700, color: 'white', background: '#111', padding: '10px 22px', borderRadius: 999, textDecoration: 'none' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '80px 24px 80px', background: '#f4f4f0' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
          {/* Left: copy */}
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
              {chip('India-based')}
              {chip('Global reach')}
              {chip('Pilot — free to join')}
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 62px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-1.5px', color: '#0f0f0f' }}>
              Live fully —<br /><em style={{ fontStyle: 'italic', fontWeight: 800, color: '#c8791a' }}>pain doesn&rsquo;t get the final word.</em>
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#444', lineHeight: 1.7, margin: '0 0 14px', maxWidth: 480 }}>
              Chronic pain changes your work, your relationships, your sense of self. Managing it is hard enough — you shouldn&rsquo;t have to do it alone.
            </p>
            <p style={{ fontSize: 15, color: '#777', margin: '0 0 36px', maxWidth: 440 }}>
              A counselor who knows your story. A personalised 6-week program. Daily support on your phone.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/register" style={{ padding: '15px 36px', borderRadius: 999, background: '#0f0f0f', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '-0.2px' }}>
                Begin your recovery →
              </Link>
              <a href="#how" style={{ padding: '15px 24px', borderRadius: 999, border: '1.5px solid #ccc', color: '#333', fontSize: 14, textDecoration: 'none' }}>
                How it works ↓
              </a>
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: '#aaa' }}>Free during pilot. Your plan is ready within 24 hours.</p>
          </div>
          {/* Right: image */}
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: '4/5', maxHeight: 560, boxShadow: '0 32px 64px rgba(17,17,17,0.12)' }}>
              <img
                src="https://images.unsplash.com/photo-1551847677-dc82d764e1eb?auto=format&fit=crop&w=800&q=80"
                alt="A person looking calm and grounded — embodying recovery and forward momentum"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* Floating stat pill */}
            <div style={{ position: 'absolute', bottom: 24, left: -16, background: 'white', borderRadius: 14, padding: '14px 20px', boxShadow: '0 8px 24px rgba(17,17,17,0.12)', maxWidth: 220 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f0f0f', letterSpacing: '-0.5px' }}>24 hrs</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>from signup to your counselor-approved plan</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF TICKER ── */}
      <div style={{ background: '#111', color: 'rgba(255,255,255,0.6)', padding: '14px 24px', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 13, letterSpacing: '0.04em' }}>
        <span style={{ marginRight: 48 }}>Counselor-reviewed, not AI-generated &nbsp;·</span>
        <span style={{ marginRight: 48 }}>ACT · CBT · Transactional Analysis &nbsp;·</span>
        <span style={{ marginRight: 48 }}>Chronic pain specialists &nbsp;·</span>
        <span style={{ marginRight: 48 }}>Based in Chennai · Remote-first · Global reach &nbsp;·</span>
        <span style={{ marginRight: 48 }}>Daily mobile support &nbsp;·</span>
        <span>Free during pilot &nbsp;·</span>
      </div>

      {/* ── THE PROBLEM ── */}
      <section style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            {chip('The Problem')}
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '20px 0 16px', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
              Pain is never just physical.
            </h2>
            <p style={{ fontSize: 17, color: '#555', maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
              Most pain recovery programs treat the body and ignore everything else. But pain changes how you think, how you sleep, how you relate to people — and no physiotherapy appointment addresses that.
            </p>
          </div>
          <div className="pts-problem-grid">
            {[
              {
                stat: '1 in 5',
                label: 'adults live with chronic pain',
                text: 'Yet most are discharged from care once the acute phase ends — without support for what comes next.',
              },
              {
                stat: '60%',
                label: 'of chronic pain patients report anxiety or depression',
                text: 'Pain and mental health are inseparable. Treating one without the other rarely works.',
              },
              {
                stat: '3–5',
                label: 'providers seen before finding the right support',
                text: 'Pain patients spend months navigating a system not designed for their reality.',
              },
              {
                stat: 'Most',
                label: 'pain programs are generic templates',
                text: 'A plan built from a questionnaire isn\'t a counselor who knows your life and adjusts the program week by week.',
              },
            ].map(item => (
              <div key={item.stat} style={{ background: '#f9f7f3', padding: '32px 28px', borderRadius: 4 }}>
                <div style={{ fontSize: 'clamp(38px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-1px', color: '#0f0f0f', lineHeight: 1, marginBottom: 6 }}>{item.stat}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#c8791a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{item.label}</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR APPROACH ── */}
      <section id="approach" style={{ padding: '96px 24px', background: '#f4f4f0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            {chip('Our Approach')}
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '20px 0 16px', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
              Counselor-led. <em style={{ fontStyle: 'italic', color: '#c8791a' }}>Human-first.</em>
            </h2>
            <p style={{ fontSize: 17, color: '#555', maxWidth: 620, margin: '0 auto', lineHeight: 1.65 }}>
              AI helps us build a first draft of your plan. Your counselor reviews it, shapes it to your specific story, and approves it before it ever reaches you. Every week of your program is touched by a real clinician.
            </p>
          </div>
          {/* Approach image strip */}
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 40, maxHeight: 340, boxShadow: '0 16px 40px rgba(17,17,17,0.08)' }}>
            <img
              src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1400&q=80"
              alt="Two people in warm conversation — the kind of human connection that defines the PTS counselor relationship"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              {
                icon: '🤝',
                title: 'A counselor who knows your case',
                text: 'You are not a questionnaire score. Before your plan goes live, your counselor reads your full intake — what happened, how it\'s changed your life, what recovery means to you. They edit the plan in their own words.',
              },
              {
                icon: '📋',
                title: 'Week by week, not all at once',
                text: 'Your counselor approves Week 1 first. At the end of each week, they review how you\'re doing and shape the next week with that context. Plans that adapt to reality, not just expectations.',
              },
              {
                icon: '📱',
                title: 'Daily support via mobile',
                text: '5–10 minutes a day: a morning practice, an evening check-in, your counselor\'s voice in your pocket. Not a reminder to meditate — a structured recovery program that meets you where you are.',
              },
            ].map(item => (
              <div key={item.title} style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', border: '1px solid #e5e0d8' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO THIS IS FOR ── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            {chip('Who It\'s For')}
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, margin: '20px 0 12px', letterSpacing: '-0.6px' }}>
              Pain from any cause can upend a life.
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 500, margin: '0 auto' }}>We support people whose pain has changed what they can do, who they are, and how they see the future.</p>
          </div>
          {/* Split image layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div style={{ borderRadius: 18, overflow: 'hidden', minHeight: 260, boxShadow: '0 8px 24px rgba(17,17,17,0.08)' }}>
              <img
                src="https://images.unsplash.com/photo-1573495804664-b1c0849525af?auto=format&fit=crop&w=800&q=80"
                alt="A person in a contemplative, hopeful moment — looking forward with quiet strength"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 260 }}
              />
            </div>
            <div style={{ borderRadius: 18, overflow: 'hidden', minHeight: 260, boxShadow: '0 8px 24px rgba(17,17,17,0.08)' }}>
              <img
                src="https://images.unsplash.com/photo-1758273240360-76b908e7582a?auto=format&fit=crop&w=800&q=80"
                alt="Two people in conversation in a warm, professional setting"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 260 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '🏢', title: 'Workplace injury', text: 'You got hurt at work. Recovery means returning to your job — and your confidence — fully.' },
              { icon: '⚽', title: 'Sports injury', text: 'You were active. Pain has sidelined you. Recovery means getting back in the game.' },
              { icon: '🚗', title: 'Road accident', text: 'You survived. Now comes the harder part: rebuilding after physical and psychological trauma.' },
              { icon: '🩺', title: 'Health disruption', text: 'A condition changed everything. Recovery means reclaiming your independence and identity.' },
            ].map(card => (
              <div key={card.title} style={{ background: '#f9f7f3', borderRadius: 14, padding: '28px 22px', border: '1px solid #eee' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{card.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{card.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.55, margin: 0 }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '96px 24px', background: '#0f0f0f', color: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '4px 12px', borderRadius: 999 }}>How It Works</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '20px 0 12px', letterSpacing: '-0.8px' }}>
              You pay nothing until your counselor<br />has reviewed your plan.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '0 auto' }}>
              The pilot is free. No credit card. No commitment. When we move to paid, payment happens only after Week 1 is approved by your counselor.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2 }}>
            {[
              {
                step: '01',
                title: 'Tell us your story',
                text: 'A guided 15-minute assessment — not a clinical form. What happened, how it\'s shaped your life, what recovery means to you. Your counselor reads every word of this before building your plan.',
                aside: 'Free. No account needed to start.',
              },
              {
                step: '02',
                title: 'Your counselor shapes your plan',
                text: 'Within 24 hours, your counselor reviews your assessment, edits the AI-generated draft in their own words, and approves a 6-week program designed for your specific situation.',
                aside: 'Week 1 reviewed before you see anything.',
              },
              {
                step: '03',
                title: 'Walk the journey with support',
                text: 'Daily mobile check-ins. Practices designed for your time of day. Async messaging with your counselor. 1:1 sessions when you need them. The program adapts as you go.',
                aside: 'Your counselor reviews your progress each week.',
              },
            ].map(s => (
              <div key={s.step} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '36px 28px' }}>
                <div style={{ fontWeight: 900, fontSize: 52, color: 'rgba(255,255,255,0.08)', lineHeight: 1, marginBottom: 16, letterSpacing: '-2px' }}>{s.step}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: '0 0 16px' }}>{s.text}</p>
                <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>{s.aside}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section style={{ padding: '96px 24px', background: '#1a1a1a', color: 'white' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '4px 12px', borderRadius: 999 }}>What&rsquo;s Included</span>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, margin: '20px 0 12px', letterSpacing: '-0.6px' }}>Everything you need. Nothing you don&rsquo;t.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { title: 'Personalised 6-week plan', text: 'Built from your intake, edited in your counselor\'s voice, approved before it reaches you. Not a template.' },
              { title: 'Daily practices', text: 'Short, focused exercises (2–10 min) at the right time of day — grounding, reflection, values-based action, gentle re-engagement.' },
              { title: 'Async messaging', text: 'Message your counselor any time. They monitor your check-ins and respond when it matters — not on a fixed slot.' },
              { title: '1:1 counseling sessions', text: 'Book video or phone sessions directly through the platform. Available from Week 1 when you need them.' },
              { title: 'Weekly reflections', text: 'Structured check-ins that help your counselor shape Week N+1 around how you\'re actually doing — not how the plan assumed you\'d be.' },
              { title: 'Mobile app (iOS & Android)', text: 'Daily check-ins, holistic practices, and messages come to you. Designed for 5–10 minutes at the time that works for your life.' },
            ].map(item => (
              <div key={item.title} style={{ borderRadius: 12, padding: '24px 22px', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', marginBottom: 16 }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: 'white' }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THERAPEUTIC APPROACH ── */}
      <section style={{ padding: '96px 24px', background: '#f4f4f0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            {chip('Evidence-Based')}
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, margin: '20px 0 12px', letterSpacing: '-0.6px' }}>
              Grounded in evidence.<br />Built for real life.
            </h2>
            <p style={{ fontSize: 16, color: '#555', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
              Our counseling approach draws on methods with strong clinical evidence for pain recovery — not generic wellness content or motivation quotes.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              {
                abbr: 'ACT',
                name: 'Acceptance & Commitment Therapy',
                text: 'Helps you stop fighting pain and start moving toward the life you want — even while pain is present. Builds psychological flexibility, values-based action, and acceptance that doesn\'t mean giving up.',
              },
              {
                abbr: 'CBT',
                name: 'Cognitive Behavioural Therapy',
                text: 'Addresses the thought patterns and behavioural responses that often make pain worse — fear-avoidance, catastrophising, withdrawal from activity. Practical tools for changing the cycle.',
              },
              {
                abbr: 'TA',
                name: 'Transactional Analysis',
                text: 'Helps you understand how past experiences, beliefs, and relational patterns shape how you respond to pain — and how to change those patterns constructively.',
              },
            ].map(approach => (
              <div key={approach.abbr} style={{ background: '#fff', borderRadius: 16, padding: '32px 26px', border: '1px solid #e5e0d8' }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: '#c8791a', marginBottom: 8 }}>{approach.abbr}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#111', lineHeight: 1.3 }}>{approach.name}</h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, margin: 0 }}>{approach.text}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', marginTop: 32 }}>
            PTS is counseling support — not medical advice and not a replacement for physical treatment.{' '}
            <Link href="/red-flags" style={{ color: '#888' }}>Read our safety guidelines →</Link>
          </p>
        </div>
      </section>

      {/* ── LEAD COUNSELOR ── */}
      <section id="counselor" style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            {chip('The Counselor')}
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, margin: '20px 0 12px', letterSpacing: '-0.6px' }}>
              A clinician who works at the<br />intersection of pain and psychology.
            </h2>
          </div>

          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ background: '#f9f7f3', borderRadius: 20, padding: '44px 40px', border: '1px solid #e5e0d8' }}>
              <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flexShrink: 0, width: 88, height: 88, borderRadius: 18, background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-1px' }}>
                  RS
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>Ramya N. Satheesh</h3>
                    <span style={{ fontSize: 11, background: '#111', color: 'white', padding: '4px 11px', borderRadius: 999, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Lead Counselor</span>
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: '#c8791a', fontWeight: 600, letterSpacing: '0.02em' }}>
                    Psychologist · M.Sc. Psychology &amp; Social Work · Diploma in Transactional Analysis · Certified Yoga Teacher
                  </p>
                  <p style={{ fontSize: 15, color: '#444', lineHeight: 1.7, margin: '0 0 12px' }}>
                    Ramya works at Synapse Pain &amp; Spine Clinic in Chennai, where she supports patients navigating the psychological dimensions of chronic pain that physical treatment alone doesn&rsquo;t address — including fibromyalgia, back pain, neck pain, and TMJ conditions.
                  </p>
                  <p style={{ fontSize: 15, color: '#444', lineHeight: 1.7, margin: '0 0 20px' }}>
                    Her training in Transactional Analysis informs her understanding of how past experiences and relational patterns shape how people respond to pain. The PTS program is designed around her clinical practice.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Chronic pain', 'Transactional Analysis', 'Anxiety & depression', 'Relationships', 'Yoga therapy'].map(tag => (
                      <span key={tag} style={{ fontSize: 12, background: '#ede9e1', color: '#555', padding: '4px 10px', borderRadius: 999, fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #e0dbd0' }}>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: 16, color: '#333', lineHeight: 1.75 }}>
                  &ldquo;I believe in the capacity of every individual to change and grow. Pain — whether from an accident, an injury, or a condition — changes your life. But it doesn&rsquo;t have to define it. What I bring to PTS is the clinical understanding of how pain and psychology intersect, and a genuine commitment to helping people find their way back.&rdquo;
                </p>
                <p style={{ margin: '14px 0 0', fontSize: 13, color: '#aaa' }}>— Ramya N. Satheesh, Lead Counselor, PTS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: '96px 24px', background: '#f4f4f0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            {chip('FAQ')}
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, margin: '20px 0 0', letterSpacing: '-0.6px' }}>Questions worth asking</h2>
          </div>
          <div>
            {[
              {
                q: 'Is this counseling or therapy?',
                a: 'PTS is a counseling-led support program. It is not a medical service and does not replace diagnosis or treatment from a doctor or licensed therapist where that is required. If you are unsure whether PTS is appropriate for your situation, speak to your doctor first.',
              },
              {
                q: 'How is this different from a wellness app?',
                a: 'The core difference is the counselor. Generic apps generate a plan from your answers and send you generic content. In PTS, a real clinician reads your intake, edits the plan in their own words, and approves it before you see it. They review your progress every week and adjust what comes next.',
              },
              {
                q: 'Is my information confidential?',
                a: 'Your assessment and messages are visible to your assigned counselor and platform administrators for safety and quality purposes. You control optional stored support artifacts from your account settings. Read our privacy policy for the full picture.',
              },
              {
                q: "What if I'm in crisis?",
                a: 'PTS is not for emergencies. Crisis helplines are shown at the top of every page. If you report safety concerns during intake, a counselor will review your case before any plan is delivered.',
              },
              {
                q: 'How much does it cost?',
                a: 'The current pilot is free. When we move to a paid model, payment will happen only after your counselor has reviewed and approved your Week 1 plan — not before.',
              },
              {
                q: 'How long until I get my plan?',
                a: 'After you complete the intake, a draft is generated and your counselor reviews it. During the pilot, plans are typically ready within 24 hours.',
              },
            ].map((item) => (
              <details key={item.q} className="pts-faq-item">
                <summary>{item.q}</summary>
                <p className="pts-faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN AS COUNSELOR ── */}
      <section style={{ padding: '64px 24px', background: '#ede9e1', borderTop: '1px solid #ddd9d0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#888' }}>For Counselors</p>
            <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.3px' }}>Join the PTS network</h3>
            <p style={{ fontSize: 15, color: '#555', margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
              We work with qualified counselors who specialise in pain psychology. If that&rsquo;s you, we&rsquo;d like to talk.
            </p>
          </div>
          <Link href="/register/counselor" style={{ flexShrink: 0, padding: '14px 28px', borderRadius: 999, background: '#111', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Apply to join →
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: '#0f0f0f', color: 'white', padding: '112px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-1px' }}>
            Pain managed.<br /><em style={{ color: '#fbbf24', fontStyle: 'italic' }}>Life lived.</em>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: '0 0 40px' }}>
            Create a free account. Complete your assessment. Your counselor will have your personalised plan ready within 24 hours.
          </p>
          <Link href="/register" style={{ display: 'inline-block', padding: '18px 52px', borderRadius: 999, background: '#fbbf24', color: '#111', fontWeight: 800, fontSize: 17, textDecoration: 'none', letterSpacing: '-0.2px' }}>
            Begin your recovery →
          </Link>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            No commitment. Cancel any time.{' '}
            <Link href="/red-flags" style={{ color: 'rgba(255,255,255,0.4)' }}>Safety guidelines</Link>.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0a0a', color: 'rgba(255,255,255,0.4)', padding: '52px 24px 40px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, fontSize: 13 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontWeight: 900, color: 'white', fontSize: 16, marginBottom: 8, letterSpacing: '-0.3px' }}>Pain to Strength</div>
            <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>Counseling-led support for anyone whose pain has changed how they live.</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.25)' }}>Chennai, India · Remote-first · Global reach</p>
          </div>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Platform</span>
              <Link href="/register" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Get started</Link>
              <Link href="/login" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Sign in</Link>
              <Link href="/register/counselor" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Join as a counselor</Link>
            </div>
            <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Legal</span>
              <Link href="/red-flags" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Safety guidelines</Link>
              <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Privacy policy</Link>
              <Link href="/terms" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Terms of use</Link>
              <Link href="/support" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Your data</Link>
            </div>
            <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Crisis lines</span>
              <a href="tel:9152987821" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>iCall: 9152987821</a>
              <a href="tel:9820466726" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Aasra: 9820466626</a>
              <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Global helplines ↗</a>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 960, margin: '28px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
          PTS is a counseling support program, not a medical service. It is not a substitute for professional medical care, diagnosis, or treatment. If you are experiencing a medical emergency, contact emergency services immediately.
        </div>
      </footer>

    </div>
  );
}
