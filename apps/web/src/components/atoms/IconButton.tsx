import { forwardRef, type ReactNode } from 'react';
import { Tooltip } from '@/components/molecules/Tooltip';
import {
  actionButtonToneVariant,
  type ActionButtonTone,
} from './action-button.constants';
import { Button, type ButtonProps } from './Button';

export type { ActionButtonTone };
export { ACTION_BUTTON_GROUP_CLASS, ACTION_ICON_CLASS } from './action-button.constants';

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
          {...props}
        >
          {children}
        </Button>
      </Tooltip>
    );
  },
);

IconButton.displayName = 'IconButton';
export default IconButton;
