import React from 'react';

type TypographyProps = {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption'; // Variantes de tipografía
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'; // Tamaño de la fuente
  weight?: 'normal' | 'bold' | 'light' | 'semibold'; // Peso de la fuente
  color?: 'black' | 'white' | 'gray' | 'primary' | 'secondary'; // Color de la fuente
  children: React.ReactNode; // El contenido del texto
  className?: string; // Clases adicionales
};

const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  size = 'base',
  weight = 'normal',
  color = 'black',
  children,
  className = '',
}) => {
  // Mapear las variantes a clases de Tailwind
  const variantClasses: Record<string, string> = {
    h1: 'text-4xl font-extrabold',
    h2: 'text-3xl font-semibold',
    h3: 'text-2xl font-semibold',
    body: 'text-base font-normal',
    caption: 'text-sm font-light',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const weightClasses: Record<string, string> = {
    normal: 'font-normal',
    bold: 'font-bold',
    light: 'font-light',
    semibold: 'font-semibold',
  };

  const colorClasses: Record<string, string> = {
    black: 'text-black',
    white: 'text-white',
    gray: 'text-gray-500',
    primary: 'text-blue-500',
    secondary: 'text-green-500',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${weightClasses[weight]} ${colorClasses[color]} ${className}`}
    >
      {children}
    </div>
  );
};

export default Typography;
