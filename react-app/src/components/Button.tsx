import { type ReactNode, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'google' | 'logout' | 'submit';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'btn-login',
  google: 'btn-login btn-google',
  logout: 'btn-logout',
  submit: 'btn-submit',
};

export default function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  const variantClass = variantClassMap[variant];
  return (
    <button className={`${variantClass}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </button>
  );
}
