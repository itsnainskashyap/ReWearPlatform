import { createContext, useContext, useState, ReactNode } from "react";
import { LoginDialog } from "@/components/ui/login-dialog";

interface AuthModalContextType {
  openLogin: (redirectAfterLogin?: string) => void;
  closeLogin: () => void;
  isOpen: boolean;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}

interface AuthModalProviderProps {
  children: ReactNode;
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | undefined>();

  const openLogin = (redirect?: string) => {
    setRedirectAfterLogin(redirect);
    setIsOpen(true);
  };

  const closeLogin = () => {
    setIsOpen(false);
    setRedirectAfterLogin(undefined);
  };

  return (
    <AuthModalContext.Provider 
      value={{
        openLogin,
        closeLogin,
        isOpen,
      }}
    >
      {children}
      <LoginDialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
        redirectAfterLogin={redirectAfterLogin}
      />
    </AuthModalContext.Provider>
  );
}