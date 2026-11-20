'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { submitAccount } from '../../lib/auth/actions';

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const signup = mode === 'signup';
  const [error, action, pending] = useActionState(submitAccount.bind(null, mode), '');
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  return <main id="main-content" className="shell access">
    <div className="access-image"><div><p className="eyebrow">DAYLIGHT / District simulator</p><h2>The Hollow</h2></div></div>
    <section className="access-panel">
      <p className="eyebrow accent">DOMINO access</p>
      <h1>{signup ? 'Create an account' : 'Sign in'}</h1>
      <p className="muted">{signup ? 'Create your account to run the district simulator.' : 'Sign in to open the district simulator.'}</p>
      <form className="auth-form" action={action}>
        {signup && <label>Username<input name="username" autoComplete="nickname" required minLength={3} maxLength={30} value={name} onChange={e => setName(e.target.value)} /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
        <div><label htmlFor="account-password">Password</label><span className="password-field">
          <input id="account-password" name="password" type={visible ? 'text' : 'password'} minLength={8} maxLength={128} required autoComplete={signup ? 'new-password' : 'current-password'} />
          <button type="button" className="eye" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
        </span>{signup && <small>Use 8–128 characters.</small>}</div>
        {signup && <label>Confirm password<input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" required maxLength={128} /></label>}
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="primary" disabled={pending}>{pending ? 'Please wait…' : signup ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
      </form>
      <p className="switch-mode">{signup ? 'Already registered?' : 'New to DAYLIGHT?'} <Link href={signup ? '/auth/login' : '/auth/signup'}>{signup ? 'Sign in' : 'Create an account'}</Link></p>
    </section>
  </main>;
}
