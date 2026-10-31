import { useId } from "react";
import { Button, Tooltip, cn, type ButtonProps } from "../components/ui";
import { mutedClass } from "./chrome";

export interface BlockedButtonProps extends ButtonProps {
  /** Why the action cannot run yet. Null means it can. */
  reason: string | null;
}

/**
 * A Button that says why it cannot run. Blocked, it stays focusable
 * (`aria-disabled`, not `disabled`), ignores activation, and shows the reason
 * under itself and in a tooltip.
 */
export function BlockedButton({ reason, ...props }: BlockedButtonProps) {
  const reasonId = useId();
  if (reason === null) return <Button {...props} />;
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Tooltip label={reason}>
        <Button
          {...props}
          aria-disabled="true"
          aria-describedby={reasonId}
          className={cn("opacity-40 cursor-not-allowed", props.className)}
          onClick={(event) => event.preventDefault()}
        />
      </Tooltip>
      <p id={reasonId} className={mutedClass}>
        {reason}
      </p>
    </div>
  );
}
