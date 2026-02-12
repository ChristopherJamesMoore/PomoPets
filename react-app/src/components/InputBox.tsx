import { type InputHTMLAttributes } from 'react';
import './InputBox.css';

export default function InputBox(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="input-box">
      <input {...props} />
    </div>
  );
}
