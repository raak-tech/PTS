import Link from 'next/link';

export function LandingPage() {
  return (
    <div style={{ fontFamily: 'inherit', color: '#111', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #eee', padding: '0 24px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>PTS</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 14, color: '#555', textDecoration: 'none', padding: '8px 14px' }}>Sign in</Link>
            <Link href="/register" style={{ fontSize: 14, fontWeight: 700, color: 'white', background: '#111', padding: '9px 20px', borderRadius: 999, textDecoration: 'none' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 100%)', color: 'white', padding: '96px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 999, fontSize: 13, marginBottom: 28, color: '#ccc' }}>
            Counseling-led recovery · India-based · Global reach
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 52px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-0.5px' }}>
            Get back to living after pain
          </h1>
          <p style={{ fontSize: 'clamp(16px, 3vw, 20px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 0 36px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            Personalized counseling + daily support + a counselor who knows your story
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ padding: '15px 36px', borderRadius: 999, background: 'linear-gradient(135deg, #fbbf24, #f97316)', color: '#111', fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>
              Start your recovery →
            </Link>
            <a href="#how" style={{ padding: '15px 28px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: 15, textDecoration: 'none' }}>
              See how it works ↓
            </a>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No commitment. No credit card. Your plan is ready within 24 hours of signing up.</p>
        </div>
      </section>

      {/* ── WHO THIS IS FOR ── */}
      <section style={{ background: '#f9f9f9', padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>Who this is for</h2>
          <p style={{ textAlign: 'center', color: '#666', margin: '0 0 48px', fontSize: 16 }}>Pain from any cause can upend a life. We support people like you.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: '🏢', title: 'Workplace injury', text: 'You got hurt at work. Recovery means returning to your job with confidence.' },
              { icon: '⚽', title: 'Sports injury', text: 'You were active. Now pain has sidelined you. Recovery means getting back in the game.' },
              { icon: '🚗', title: 'Road accident', text: 'You survived. Now comes the harder part: rebuilding after trauma and pain.' },
              { icon: '🩺', title: 'Health disruption', text: 'Sudden pain changed everything. Recovery means reclaiming your independence.' },
            ].map(card => (
              <div key={card.title} style={{ background: 'white', borderRadius: 16, padding: '24px 20px', border: '1px solid #eee' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.5, margin: 0 }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>How PTS works</h2>
          <p style={{ textAlign: 'center', color: '#666', margin: '0 0 56px', fontSize: 16 }}>Three stages, one continuous journey.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              {
                step: '01',
                title: 'Tell us your story',
                text: 'A guided 15-minute assessment — not a clinical form, but a real conversation. What happened, how it\'s affected your life, what recovery looks like to you. Your counselor reads this before building your plan.',
              },
              {
                step: '02',
                title: 'Get your personalised plan',
                text: 'Within 24 hours, your counselor reviews your assessment and approves a personalised 6-week program — daily practices, weekly themes, and reflection prompts built around your specific situation and goals.',
              },
              {
                step: '03',
                title: 'Walk the journey with support',
                text: 'Daily mobile check-ins keep you on track. Your counselor monitors your progress, responds to your messages, and is available for 1:1 sessions when you need them. The program adapts as you go.',
              },
            ].map(s => (
              <div key={s.step} style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 40, color: '#f0f0f0', lineHeight: 1, fontFamily: 'Georgia, serif' }}>{s.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section style={{ background: '#0f0f0f', color: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>What your program includes</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', margin: '0 0 48px', fontSize: 16 }}>Everything you need. Nothing you don&rsquo;t.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { title: 'Personalised 6-week plan', text: 'Built from your specific intake — not a generic template. Your counselor reviews and approves every plan before it reaches you.' },
              { title: 'Daily practices', text: 'Short, practical exercises (2–10 min each) delivered at the right time of day. Grounding, reflection, values-based action, and gentle re-engagement.' },
              { title: 'Your counselor in your corner', text: 'Async messaging with your counselor throughout the program. They monitor your check-ins and respond when it matters.' },
              { title: '1:1 counseling sessions', text: 'Book video or phone sessions with your counselor directly through the platform. Available from week 1 when you need them.' },
              { title: 'Weekly reflections', text: 'Structured weekly check-ins that help your counselor adapt the program to how you\'re actually doing — not just how the plan expects you to be.' },
              { title: 'Works on your phone', text: 'Daily check-ins, practices, and messages come to you via the app — designed to take 5–10 minutes at the time that works for you.' },
            ].map(item => (
              <div key={item.title} style={{ borderRadius: 14, padding: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: '#fbbf24' }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THERAPEUTIC APPROACH ── */}
      <section style={{ padding: '80px 24px', background: '#fafafa' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ maxWidth: 600, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>Grounded in evidence. Built for real life.</h2>
            <p style={{ color: '#666', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
              Our counseling approach draws on methods with strong clinical evidence for pain recovery — not generic wellness content.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                name: 'Acceptance & Commitment Therapy (ACT)',
                text: 'Helps you stop fighting pain and start moving toward the life you want — even while pain is present. Builds psychological flexibility, values-based action, and acceptance that doesn\'t mean giving up.',
              },
              {
                name: 'Cognitive Behavioural Therapy (CBT)',
                text: 'Addresses the thought patterns and behavioural responses that often make pain worse — fear-avoidance, catastrophising, withdrawal from activity. Practical tools for changing the cycle.',
              },
              {
                name: 'Transactional Analysis',
                text: 'Helps you understand how past experiences, beliefs, and relational patterns shape how you respond to pain and to people around you — and how to change those patterns constructively.',
              },
            ].map(approach => (
              <div key={approach.name} style={{ background: 'white', borderRadius: 14, padding: '24px 20px', border: '1px solid #e8e8e8' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: '#111' }}>{approach.name}</h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: 0 }}>{approach.text}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', marginTop: 28 }}>
            PTS is counseling support — not medical advice and not a replacement for physical treatment. <Link href="/red-flags" style={{ color: '#888' }}>Read our safety guidelines →</Link>
          </p>
        </div>
      </section>

      {/* ── LEAD COUNSELOR ── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>Led by an experienced clinician</h2>
          <p style={{ textAlign: 'center', color: '#666', margin: '0 0 48px', fontSize: 16 }}>Our program is designed and overseen by a counselor who works at the intersection of pain and psychology every day.</p>

          <div style={{ maxWidth: 680, margin: '0 auto', background: '#fafafa', borderRadius: 20, padding: '36px 32px', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0, width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #fbbf24, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#111' }}>
                RS
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Ramya N. Satheesh</h3>
                  <span style={{ fontSize: 12, background: '#111', color: 'white', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>Key Advisor & Lead Counselor</span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 14, color: '#f97316', fontWeight: 600 }}>
                  Psychologist · M.Sc. Psychology & Social Work · Diploma in Transactional Analysis · Certified Yoga Teacher
                </p>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 12px' }}>
                  Ramya is a psychologist with specialist expertise in the intersection of chronic pain and mental health — including fibromyalgia, back pain, neck pain, and TMJ conditions. She works at Synapse Pain & Spine Clinic in Chennai, where she supports patients navigating the psychological dimensions of pain that physical treatment alone doesn&rsquo;t address.
                </p>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 16px' }}>
                  Her training in Transactional Analysis informs her understanding of how past experiences and relational patterns shape how people respond to pain — and her work centres on the belief that people have the capacity to change and grow, even when pain feels permanent.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Chronic pain', 'Transactional Analysis', 'Anxiety & depression', 'Relationships', 'Families & couples', 'Yoga therapy'].map(tag => (
                    <span key={tag} style={{ fontSize: 12, background: '#f0f0f0', color: '#444', padding: '4px 10px', borderRadius: 999 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eee' }}>
              <p style={{ margin: 0, fontStyle: 'italic', fontSize: 15, color: '#333', lineHeight: 1.6 }}>
                &ldquo;I believe in the capacity of every individual to change and grow. Pain — whether from an accident, an injury, or a condition — changes your life. But it doesn&rsquo;t have to define it. What I bring to PTS is the clinical understanding of how pain and psychology intersect, and a genuine commitment to helping people find their way back.&rdquo;
              </p>
              <p style={{ margin: '10px 0 0', fontSize: 13, color: '#999' }}>— Ramya N. Satheesh, Key Advisor & Lead Counselor, PTS</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, margin: '0 0 48px' }}>Frequently asked questions</h2>
          <div style={{ display: 'grid', gap: 20 }}>
            {[
              {
                q: 'Is this counseling or therapy?',
                a: 'PTS is a counseling-led recovery support program. It is not a medical service and does not replace diagnosis or treatment from a doctor or licensed therapist where that is required.',
              },
              {
                q: 'Is my information confidential?',
                a: 'Your assessment and messages are visible to your assigned counselor and platform administrators for safety and quality. You control optional stored support artifacts from your account settings.',
              },
              {
                q: 'What if I\'m in crisis?',
                a: 'PTS is not for emergencies. Crisis helplines are shown at the top of every page. If you report safety concerns in intake, a counselor will review before your plan is delivered.',
              },
              {
                q: 'How much does it cost?',
                a: 'The pilot is free for participants. There is no credit card required to sign up.',
              },
              {
                q: 'Can I cancel?',
                a: 'Yes. You can stop using the program at any time. Contact your counselor or program administrator if you want your data removed.',
              },
              {
                q: 'How long until I get my plan?',
                a: 'After you complete the intake, a draft plan is generated and your counselor reviews it — typically within 24 hours during the pilot.',
              },
            ].map((item) => (
              <div key={item.q} style={{ borderBottom: '1px solid #eee', paddingBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{item.q}</h3>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 100%)', color: 'white', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.15 }}>
            Ready to start getting your life back?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 36px' }}>
            Create a free account. Complete your assessment. Your counselor will have your personalised 6-week plan ready within 24 hours.
          </p>
          <Link href="/register" style={{ display: 'inline-block', padding: '16px 44px', borderRadius: 999, background: 'linear-gradient(135deg, #fbbf24, #f97316)', color: '#111', fontWeight: 800, fontSize: 17, textDecoration: 'none' }}>
            Get started — it&rsquo;s free →
          </Link>
          <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            No commitment. Cancel any time. Not medical advice — <Link href="/red-flags" style={{ color: 'rgba(255,255,255,0.45)' }}>see safety guidelines</Link>.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0a0a', color: 'rgba(255,255,255,0.4)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
          <div>
            <span style={{ fontWeight: 800, color: 'white', fontSize: 15 }}>PTS</span>
            <p style={{ margin: '6px 0 0', maxWidth: 280, lineHeight: 1.5 }}>Counseling-led recovery for anyone whose pain has changed how they live.</p>
            <p style={{ margin: '4px 0 0' }}>Chennai, India · Remote-first · Global reach</p>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <Link href="/register" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Get started</Link>
              <Link href="/login" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Sign in</Link>
              <Link href="/register/counselor" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Join as a counselor</Link>
            </div>
            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <Link href="/red-flags" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Safety guidelines</Link>
              <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Privacy policy</Link>
              <Link href="/terms" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Terms of use</Link>
              <Link href="/support" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Your data</Link>
            </div>
            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Crisis lines</span>
              <a href="tel:9152987821" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>iCall: 9152987821</a>
              <a href="tel:9820466726" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Aasra: 9820466726</a>
              <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Global helplines</a>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: '24px auto 0', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
          PTS is a counseling support program, not a medical service. It is not a substitute for professional medical care, diagnosis, or treatment. If you are experiencing a medical emergency, contact emergency services immediately.
        </div>
      </footer>

    </div>
  );
}
