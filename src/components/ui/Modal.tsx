import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
}

export function Modal({ isOpen, onClose, children, dismissible = true }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={dismissible ? onClose : undefined}
      />
      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200">
        {dismissible && onClose && (
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1 rounded-full transition-colors z-20"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
