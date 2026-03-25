import {AppLifecycleAdapter} from '../homeSSO';
export interface MenuDialogProps {
  userEmail: string;
  onSignOut: () => void;
  visible: boolean;
  onClose: () => void;
}
