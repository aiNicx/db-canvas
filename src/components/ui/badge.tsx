import * as React from 'react';
import { cn } from '@/lib/utils';
import { badgeVariants, type BadgeProps } from './badge.variants'; // Import from new file

function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge }; // Only export the component
