import { cloneElement, forwardRef, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Tooltip } from '@/components/molecules/Tooltip';
import {
  actionButtonToneVariant,
  type ActionButtonTone,
} from './action-button.constants';
import { Button, type ButtonProps } from './Button';

export type { ActionButtonTone };
export { ACTION_BUTTON_GROUP_CLASS, ACTION_ICON_CLASS } from './action-button.constants';

const ACTION_ICON_SIZE = 18;

function renderActionIcon(children: ReactNode): ReactNode {
  if (!isValidElement(children)) return children;

  return cloneElement(children as ReactElement<{ size?: number; strokeWidth?: number }>, {
    size: ACTION_ICON_SIZE,
    strokeWidth: 1.75,
  });
}

export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  label: string;
  children: ReactNode;
  tone?: ActionButtonTone;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, tone = 'default', variant, size = 'action', ...props }, ref) => {
    const resolvedVariant = variant ?? actionButtonToneVariant[tone];

    return (
      <Tooltip content={label}>
        <Button
          ref={ref}
          size={size}
          variant={resolvedVariant}
          aria-label={label}
          title={label}
          data-action-button={tone}
          {...props}
        >
          {renderActionIcon(children)}
        </Button>
      </Tooltip>
    );
  },
);

IconButton.displayName = 'IconButton';
export default IconButton;
