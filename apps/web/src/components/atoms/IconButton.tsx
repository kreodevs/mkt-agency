import { forwardRef, type ReactNode } from 'react';
import { Tooltip } from '@/components/molecules/Tooltip';
import { Button, type ButtonProps } from './Button';

export interface IconButtonProps extends ButtonProps {
  label: string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, size = 'icon', ...props }, ref) => (
    <Tooltip content={label}>
      <Button ref={ref} size={size} aria-label={label} title={label} {...props}>
        {children}
      </Button>
    </Tooltip>
  ),
);

IconButton.displayName = 'IconButton';
export default IconButton;
