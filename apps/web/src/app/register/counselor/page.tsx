import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Join as a counselor | PTS' };

const SPECIALISATIONS = [
  { value: 'workplace', label: 'Workplace injury & compensation' },
  { value: 'accident', label: 'Road accident & trauma' },
  { value: 'sports', label: 'Sports & activity injury' },
  { value: 'chronic', label: 'Chronic pain' },
  { value: 'surgical', label: 'Post-surgical recovery' },
  { value: 'general', label: 'General life disruption from pain' },
];

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi',
];

const EXPERIENCE = [
  { value: 'under2', label: 'Under 2 years' },
  { value: '2to5', label: '2 – 5 years' },
  { value: '5to10', label: '5 – 10 years' },
  { value: 'over10', label: 'More than 10 years' },
];

function errorCopy(error?: string) {
  switch (error) {
    case 'invalid-code': return 'That invite code is not valid. Please check it and try again.';
    case 'duplicate': return 'That email is already registered.';
    case 'invalid': return 'Please check your details and try again.';
    case 'server': return 'Something went wrong — please try again.';
    default: return null;
  }
}

export default async function CounselorRegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = errorCopy(params?.error);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <div style={{ marginBottom: 36 }}>
          <Link href="/register" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Client registration</Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '16px 0 8px' }}>Join PTS as a counselor</h1>
          <p style={{ color: '#666', margin: 0, lineHeight: 1.6 }}>
            Your profile will be visible to clients assigned to you. Please provide accurate credentials — your account will be reviewed before activation.
          </p>
        </div>

        {error && (
          <div role="alert" style={{ background: '#fce4ec', border: '1px solid #ef9a9a', borderRadius: 10, padding: '12px 16px', marginBottom: 24, color: '#b71c1c', fontSize: 14 }}>
            {error}
          </div>
        )}

        <form
          action="/api/auth/register/counselor"
          method="post"
          style={{ display: 'grid', gap: 0, background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}
        >
          {/* Section: Access */}
          <fieldset style={sectionStyle}>
            <legend style={legendStyle}>Access</legend>
            <div style={fieldStyle}>
              <label htmlFor="inviteCode" style={labelStyle}>Counselor invite code <span style={{ color: '#b00020' }}>*</span></label>
              <p style={hintStyle}>Provided by the PTS team. Contact us if you don't have one.</p>
              <input id="inviteCode" name="inviteCode" type="text" required placeholder="CNSL-XXXXXXXX" style={inputStyle} />
            </div>
          </fieldset>

          {/* Section: Account */}
          <fieldset style={sectionStyle}>
            <legend style={legendStyle}>Account</legend>
            <div style={fieldStyle}>
              <label htmlFor="email" style={labelStyle}>Email address <span style={{ color: '#b00020' }}>*</span></label>
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="password" style={labelStyle}>Password <span style={{ color: '#b00020' }}>*</span></label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="At least 8 characters" style={inputStyle} />
            </div>
          </fieldset>

          {/* Section: Professional identity */}
          <fieldset style={sectionStyle}>
            <legend style={legendStyle}>Professional identity</legend>

            <div style={fieldStyle}>
              <label htmlFor="fullName" style={labelStyle}>Full name <span style={{ color: '#b00020' }}>*</span></label>
              <input id="fullName" name="fullName" type="text" required placeholder="As it appears on your credentials" style={inputStyle} />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="title" style={labelStyle}>Professional title <span style={{ color: '#b00020' }}>*</span></label>
              <p style={hintStyle}>e.g. "Licensed Counseling Psychologist", "Psychotherapist", "Rehabilitation Counselor"</p>
              <input id="title" name="title" type="text" required placeholder="Your title" style={inputStyle} />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="credentials" style={labelStyle}>Credentials & qualifications</label>
              <p style={hintStyle}>Degrees, certifications, registrations (e.g. RCI, BCI, BACP). We'll verify these before activation.</p>
              <textarea id="credentials" name="credentials" rows={3} placeholder="e.g. M.Phil Clinical Psychology, RCI Licensed, BACP Accredited" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="yearsExperience" style={labelStyle}>Years of experience <span style={{ color: '#b00020' }}>*</span></label>
              <select id="yearsExperience" name="yearsExperience" required style={inputStyle}>
                <option value="">Select…</option>
                {EXPERIENCE.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </fieldset>

          {/* Section: Specialisations */}
          <fieldset style={sectionStyle}>
            <legend style={legendStyle}>Specialisations</legend>
            <p style={{ ...hintStyle, margin: '0 0 12px' }}>Select all that apply. This helps us match you with clients.</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {SPECIALISATIONS.map(s => (
                <label key={s.value} style={checkboxLabelStyle}>
                  <input type="checkbox" name="specialisations" value={s.value} style={{ accentColor: '#111', width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Section: Languages */}
          <fieldset style={sectionStyle}>
            <legend style={legendStyle}>Languages you work in</legend>
            <p style={{ ...hintStyle, margin: '0 0 12px' }}>Select all languages you can conduct sessions in.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LANGUAGES.map(lang => (
                <label key={lang} style={checkboxLabelStyle}>
                  <input type="checkbox" name="languages" value={lang} style={{ accentColor: '#111', width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>{lang}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Section: Bio */}
          <fieldset style={sectionStyle}>
            <legend style={legendStyle}>Your approach</legend>
            <div style={fieldStyle}>
              <label htmlFor="bio" style={labelStyle}>Bio <span style={{ color: '#b00020' }}>*</span></label>
              <p style={hintStyle}>
                Describe your counseling approach and what you bring to clients recovering from pain. 3–5 sentences. Clients will read this.
              </p>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                required
                placeholder="e.g. I work with people navigating the psychological and practical challenges that come with pain after injury or accident. My approach combines acceptance-based counseling with practical goal-setting, helping clients rebuild confidence and reconnect with what matters to them…"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </fieldset>

          {/* Section: Booking */}
          <fieldset style={sectionStyle}>
            <legend style={legendStyle}>Your availability</legend>
            <div style={fieldStyle}>
              <label htmlFor="calendlyUrl" style={labelStyle}>Calendly booking link</label>
              <p style={hintStyle}>
                Paste your public Calendly URL (e.g. calendly.com/yourname). Clients will use this to book sessions with you. Optional for pilot.
              </p>
              <input
                id="calendlyUrl"
                name="calendlyUrl"
                type="url"
                placeholder="https://calendly.com/yourname"
                style={inputStyle}
              />
            </div>
          </fieldset>

          {/* Submit */}
          <div style={{ padding: '20px 24px', borderTop: '1px solid #f0f0f0' }}>
            <button type="submit" style={{ ...btnStyle, width: '100%' }}>
              Submit registration →
            </button>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#888', textAlign: 'center' }}>
              Your profile will be reviewed before your account is activated. You'll receive an email when you're approved.
            </p>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
          Are you a client? <Link href="/register" style={{ color: '#111', fontWeight: 500 }}>Register here →</Link>
        </p>
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  border: 'none', padding: '20px 24px', borderBottom: '1px solid #f0f0f0', margin: 0,
};
const legendStyle: React.CSSProperties = {
  fontWeight: 700, fontSize: 15, marginBottom: 16, padding: 0, color: '#111',
};
const fieldStyle: React.CSSProperties = { marginBottom: 16 };
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 };
const hintStyle: React.CSSProperties = { margin: '0 0 8px', fontSize: 12, color: '#888' };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #ddd', fontSize: 14, fontFamily: 'inherit',
  boxSizing: 'border-box',
};
const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
  padding: '8px 12px', borderRadius: 8, border: '1px solid #eee',
};
const btnStyle: React.CSSProperties = {
  padding: '13px', borderRadius: 999, border: 'none',
  background: '#111', color: 'white', fontWeight: 700,
  fontSize: 15, cursor: 'pointer',
};
