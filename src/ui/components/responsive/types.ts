export type RowProps = {
      children: React.ReactNode; // Los hijos que se mostrarán dentro del row
  
  };
  export type ColProps = {
    id?:string
    responsive?: {
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
      '2xl'?: number;
    };
    children: React.ReactNode;
    autoPadding?: boolean;
  };
  