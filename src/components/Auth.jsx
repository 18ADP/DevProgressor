// src/components/Auth.jsx
import { useState } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        alert(error.message);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        alert("Invalid credentials. Please check your email and password or Sign Up.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 text-center p-12 rounded-xl shadow-2xl max-w-lg mx-auto">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
        {isSignUp ? 'Create an Account' : 'Welcome Back'}
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
        {isSignUp ? 'Enter your details to get started.' : 'Sign in to access your journal.'}
      </p>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <input
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
          type="email"
          placeholder="Your email"
          value={email}
          required={true}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
          type="password"
          placeholder="Your password (min. 6 characters)"
          value={password}
          required={true}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isSignUp && (
          <input
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            required={true}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}
        <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-indigo-700 transition" disabled={loading}>
          {loading ? <span>Loading...</span> : <span>{isSignUp ? 'Sign Up' : 'Login'}</span>}
        </button>
      </form>
      <p className="mt-8 text-slate-600 dark:text-slate-400">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline ml-2"
        >
          {isSignUp ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}