import { ProgramNav } from '../../components/ProgramNav';

export default function RedFlagsPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
      <h1>Red flags: when to seek care</h1>

      <p style={{ maxWidth: 680 }}>
        This page is safety guidance only. It is not medical advice.
      </p>

      <p style={{ maxWidth: 680 }}>
        This is not for emergencies. If you think you may be in danger or need urgent
        help, seek local emergency services.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Examples of red flag symptoms</h2>
        <ul>
          <li>New severe weakness or numbness</li>
          <li>Loss of bladder or bowel control</li>
          <li>Fever with severe back pain</li>
          <li>Major trauma (e.g., a fall or accident)</li>
          <li>Unexplained weight loss</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>What to do next</h2>
        <ul>
          <li>Pause this program preview and seek in-person medical evaluation.</li>
          <li>
            If symptoms are rapidly worsening or you feel unsafe, use local emergency
            services.
          </li>
        </ul>
      </section>

      <ProgramNav style={{ marginTop: 24 }} />
    </main>
  );
}
