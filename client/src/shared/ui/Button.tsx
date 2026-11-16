import { Button as RadixButton } from "@radix-ui/themes";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof RadixButton>;

// Keep feature markup small while sharing the library's button variants.
export function Button({ className = "", variant, color, type = "button", size = "2", ...props }: Props) {
  const danger = className.includes("danger");
  const primary = className.includes("primary-button");
  const quiet = /ghost-button|icon-button|tag-chip/.test(className);
  return (
    <RadixButton
      {...props}
      type={type}
      className={className}
      variant={variant ?? (primary ? "solid" : quiet ? "soft" : "surface")}
      color={color ?? (danger ? "red" : primary ? "jade" : "gray")}
      size={size}
    />
  );
}
