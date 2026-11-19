import { View } from "react-native";

import { cx } from "./cx";
import { Icon } from "./Icon";
import type { IconName } from "./icon-paths";

/** Tab bar icon with the prototype's pill behind it while selected. */
export function TabIcon({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      className={cx(
        "h-8 w-14 items-center justify-center rounded-lg",
        focused && "bg-primary-tint",
      )}
    >
      <Icon name={name} color={color} />
    </View>
  );
}
