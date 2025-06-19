import { Grid as MuiGrid } from '@mui/material';
import type { GridProps as MuiGridProps } from '@mui/material';
import { forwardRef } from 'react';

type GridProps = MuiGridProps & {
  item?: boolean;
  xs?: number;
  md?: number;
};

export const Grid = forwardRef<HTMLDivElement, GridProps>((props, ref) => {
  return <MuiGrid ref={ref} {...props} />;
});

Grid.displayName = 'Grid';

export default Grid; 