import { Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export type ClientStorySnippet = {
  painSource?: string | null;
  painDescription?: string | null;
  recoveryGoal?: string | null;
  hasRedFlags?: boolean;
  isSafe?: boolean;
};

function StoryBody({
  story,
  aiSummary,
  styles,
}: {
  story: ClientStorySnippet | null | undefined;
  aiSummary?: string | null;
  styles: {
    label: object;
    body: object;
    muted: object;
    danger: object;
  };
}) {
  const hasStory = Boolean(
    story?.painSource?.trim() ||
      story?.painDescription?.trim() ||
      story?.recoveryGoal?.trim(),
  );
  const unsafe = Boolean(story?.hasRedFlags || story?.isSafe === false);

  return (
    <View>
      {unsafe ? <Text style={styles.danger}>Safety flag on intake</Text> : null}
      {hasStory ? (
        <>
          {story?.painSource?.trim() ? (
            <>
              <Text style={styles.label}>What happened</Text>
              <Text style={styles.body}>{story.painSource}</Text>
            </>
          ) : null}
          {story?.painDescription?.trim() ? (
            <>
              <Text style={styles.label}>Situation</Text>
              <Text style={styles.body}>{story.painDescription}</Text>
            </>
          ) : null}
          {story?.recoveryGoal?.trim() ? (
            <>
              <Text style={styles.label}>Goal</Text>
              <Text style={styles.body}>{story.recoveryGoal}</Text>
            </>
          ) : null}
        </>
      ) : (
        <Text style={styles.muted}>No intake story on file yet.</Text>
      )}
      {aiSummary?.trim() ? (
        <>
          <Text style={[styles.label, { marginTop: 4 }]}>AI draft summary</Text>
          <Text style={styles.muted}>{aiSummary}</Text>
        </>
      ) : null}
    </View>
  );
}

/** Layer-1 client story snippet for Bridge counselor mobile. */
export function ClientStoryCard({
  story,
  title = 'Client story',
  aiSummary,
  embedded = false,
}: {
  story: ClientStorySnippet | null | undefined;
  title?: string;
  aiSummary?: string | null;
  /** When true, render without outer Card (parent already has a card). */
  embedded?: boolean;
}) {
  const styles = useThemedStyles((c) => ({
    label: { fontSize: 12, fontWeight: '700' as const, color: c.faint, marginBottom: 2 },
    body: { fontSize: 14, color: c.text, lineHeight: 21, marginBottom: 10 },
    muted: { fontSize: 14, color: c.muted, lineHeight: 21 },
    danger: { fontSize: 13, fontWeight: '700' as const, color: c.danger, marginBottom: 8 },
  }));

  if (embedded) {
    return <StoryBody story={story} aiSummary={aiSummary} styles={styles} />;
  }

  return (
    <Card title={title}>
      <StoryBody story={story} aiSummary={aiSummary} styles={styles} />
    </Card>
  );
}
