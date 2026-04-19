'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AuthModalOptions {
  /** Contextual reason shown in the modal headline, e.g. "book a lesson" */
  reason?: string;
  /** Callback fired after a successful login inside the modal */
  onSuccess?: () => void;
}

interface AuthModalContextValue {
  isOpen: boolean;
  options: AuthModalOptions;
  openAuthModal: (opts?: AuthModalOptions) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AuthModalOptions>({});

  const openAuthModal = useCallback((opts: AuthModalOptions = {}) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    setOptions({});
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, options, openAuthModal, closeAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used inside <AuthModalProvider>');
  }
  return ctx;
}
