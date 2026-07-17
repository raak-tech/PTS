import { YourCounselorCard } from '@/components/YourCounselorCard';
import { Screen } from '@/components/Screen';

export default function CounselorProfileScreen() {
  return (
    <Screen
      title="Your counselor"
      subtitle="The person supporting your recovery — contact them in the app or book a session."
    >
      <YourCounselorCard compact={false} hideIfUnassigned={false} />
    </Screen>
  );
}
