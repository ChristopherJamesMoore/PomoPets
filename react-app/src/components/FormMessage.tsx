interface FormMessageProps {
  type: 'error' | 'success';
  message: string;
}

export default function FormMessage({ type, message }: FormMessageProps) {
  if (!message) return null;
  return <div className={`form-${type}`}>{message}</div>;
}
