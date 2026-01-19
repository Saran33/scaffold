import { type Toast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';

const ErrorMsgDefault: Toast = {
  title: 'Something went wrong',
  description: "We logged the error and we'll look into it.",
  variant: 'destructive',
};

// not bad colors but only works in dark mode
// keeping here for future reference
const defaultToastOptions = {
  style: {
    borderRadius: '10px',
    background: '#333',
    color: '#fff',
  },
  iconTheme: {
    primary: 'black',
    secondary: 'white',
  },
};

const showSonnerToast = (message: string, options = {}) => {
  sonnerToast(message, { ...options });
};

export const sonnerToastSuccess = (message: string, options = {}) => {
  sonnerToast.success(message, {
    ...options,
  });
};

export const sonnerToastError = (message: string, options = {}) => {
  sonnerToast.error(message, {
    ...options,
  });
};
