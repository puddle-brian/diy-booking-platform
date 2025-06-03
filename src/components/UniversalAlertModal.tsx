'use client';

import React, { useEffect, useRef } from 'react';

export interface AlertButton {
  text: string;
  action: () => void | Promise<void>;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  disabled?: boolean;
}

export interface UniversalAlertProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Content
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  title: string;
  message: string | React.ReactNode;
  
  // Buttons
  buttons: AlertButton[];
  
  // Behavior
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const alertTypeStyles = {
  info: {
    iconColor: 'text-blue-600',
    headerBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    defaultIcon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  warning: {
    iconColor: 'text-amber-600',
    headerBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    defaultIcon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  },
  error: {
    iconColor: 'text-red-600',
    headerBg: 'bg-red-50',
    borderColor: 'border-red-200',
    defaultIcon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  success: {
    iconColor: 'text-green-600',
    headerBg: 'bg-green-50',
    borderColor: 'border-green-200',
    defaultIcon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  confirm: {
    iconColor: 'text-blue-600',
    headerBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    defaultIcon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
};

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg'
};

const buttonVariantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 focus:ring-blue-500',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 focus:ring-gray-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-700 text-white border-green-600 focus:ring-green-500'
};

export default function UniversalAlertModal({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  buttons,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = false,
  size = 'md',
  icon
}: UniversalAlertProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
      
      // Tab trapping
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // 🎯 FIX: Focus the modal container instead of a specific button
    // This provides accessibility without visually highlighting any button
    setTimeout(() => {
      modalRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeStyle = alertTypeStyles[type];
  const displayIcon = icon || typeStyle.defaultIcon;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  const handleButtonClick = async (button: AlertButton, index: number) => {
    if (button.disabled || button.loading) return;
    
    try {
      await button.action();
    } catch (error) {
      console.error('Alert button action failed:', error);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex p-4 items-center justify-center`}
      onClick={handleBackdropClick}
    >
      {/* Animated backdrop - only show for modals with buttons */}
      {buttons.length > 0 && (
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
        />
      )}
      
      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative bg-white rounded-xl shadow-2xl w-full
          transform transition-all duration-300 ease-out
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          border ${typeStyle.borderColor}
          max-h-[90vh] overflow-y-auto
          ${buttons.length === 0 
            ? 'max-w-sm' // Smaller for toasts
            : sizeStyles[size] // Normal size for modals
          }
          focus:outline-none
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-message"
      >
        {/* Header with icon and close button */}
        <div className={`px-6 py-4 ${typeStyle.headerBg} rounded-t-xl border-b ${typeStyle.borderColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {displayIcon && (
                <div className={`flex-shrink-0 ${typeStyle.iconColor}`}>
                  {displayIcon}
                </div>
              )}
              <h3 
                id="alert-title"
                className="text-lg font-semibold text-gray-900 leading-6"
              >
                {title}
              </h3>
            </div>
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white/50"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`px-6 py-4 ${buttons.length === 0 ? 'rounded-b-xl' : ''}`}>
          <div id="alert-message" className="text-gray-700 leading-relaxed">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>

        {/* Actions - only show if there are buttons */}
        {buttons.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => handleButtonClick(button, index)}
                  disabled={button.disabled || button.loading}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center space-x-2
                    ${buttonVariantStyles[button.variant]}
                    ${button.loading ? 'cursor-wait' : ''}
                  `}
                  aria-label={button.text}
                >
                  {button.loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{button.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience hook for common alert patterns
export const useAlert = () => {
  const [alertProps, setAlertProps] = React.useState<UniversalAlertProps | null>(null);

  const showAlert = (props: Omit<UniversalAlertProps, 'isOpen' | 'onClose'>) => {
    setAlertProps({
      ...props,
      isOpen: true,
      onClose: () => setAlertProps(null)
    });
  };

  const closeAlert = () => {
    setAlertProps(null);
  };

  // Common alert patterns
  const confirm = (
    title: string, 
    message: string, 
    onConfirm: () => void | Promise<void>,
    options?: Partial<UniversalAlertProps>
  ) => {
    showAlert({
      type: 'confirm',
      title,
      message,
      buttons: [
        {
          text: 'Cancel',
          action: closeAlert,
          variant: 'secondary'
        },
        {
          text: 'Confirm',
          action: async () => {
            await onConfirm();
            closeAlert();
          },
          variant: 'primary'
        }
      ],
      ...options
    });
  };

  const confirmDelete = (
    title: string,
    message: string,
    onDelete: () => void | Promise<void>,
    options?: Partial<UniversalAlertProps>
  ) => {
    showAlert({
      type: 'warning',
      title,
      message,
      buttons: [
        {
          text: 'Cancel',
          action: closeAlert,
          variant: 'secondary'
        },
        {
          text: 'Delete',
          action: async () => {
            await onDelete();
            closeAlert();
          },
          variant: 'danger'
        }
      ],
      ...options
    });
  };

  const info = (title: string, message: string, options?: Partial<UniversalAlertProps>) => {
    showAlert({
      type: 'info',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          action: closeAlert,
          variant: 'primary'
        }
      ],
      ...options
    });
  };

  const success = (title: string, message: string, options?: Partial<UniversalAlertProps>) => {
    showAlert({
      type: 'success',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          action: closeAlert,
          variant: 'success'
        }
      ],
      ...options
    });
  };

  const error = (title: string, message: string, options?: Partial<UniversalAlertProps>) => {
    showAlert({
      type: 'error',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          action: closeAlert,
          variant: 'primary'
        }
      ],
      ...options
    });
  };

  // Auto-dismissing toast notifications (no buttons, auto-close)
  const toast = (
    type: 'info' | 'success' | 'error' | 'warning',
    title: string, 
    message: string, 
    duration: number = 3000
  ) => {
    showAlert({
      type,
      title,
      message,
      buttons: [], // No buttons for auto-dismiss
      closeOnBackdrop: false, // Don't close on backdrop click
      closeOnEscape: false, // Don't close on escape
      showCloseButton: false, // No close button
      ...({} as Partial<UniversalAlertProps>)
    });

    // Auto-close after duration
    setTimeout(() => {
      closeAlert();
    }, duration);
  };

  const AlertModal = alertProps ? <UniversalAlertModal {...alertProps} /> : null;

  return {
    AlertModal,
    showAlert,
    closeAlert,
    confirm,
    confirmDelete,
    info,
    success,
    error,
    toast
  };
}; 