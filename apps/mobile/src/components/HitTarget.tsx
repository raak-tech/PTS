import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
} from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  Text,
  type ViewStyle,
} from 'react-native';

type Props = Omit<PressableProps, 'children'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children?: ReactNode;
};

function muteChildPointerEvents(node: ReactNode): ReactNode {
  if (typeof node === 'string' || typeof node === 'number') {
    return (
      <Text pointerEvents="none" selectable={false}>
        {node}
      </Text>
    );
  }

  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(child, {
      pointerEvents: 'none',
      selectable: false,
    } as never);
  });
}

/** Pressable tuned for reliable taps on Expo web and native (incl. inside ScrollViews). */
export function HitTarget({ style, disabled, children, ...props }: Props) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole={props.accessibilityRole ?? 'button'}
      style={(state) => {
        const base =
          Platform.OS === 'web'
            ? ({
                cursor: disabled ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation',
                userSelect: 'none',
              } as ViewStyle)
            : null;
        const resolved = typeof style === 'function' ? style(state) : style;
        return [base, resolved, state.pressed && !disabled ? { opacity: 0.85 } : null];
      }}
    >
      {muteChildPointerEvents(children)}
    </Pressable>
  );
}
