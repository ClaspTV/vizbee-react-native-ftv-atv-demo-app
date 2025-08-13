import { AppLifecycleAdapter } from "../homeSSO";
export interface MenuDialogProps {
  userEmail: string;
  appLifecycleAdapter: AppLifecycleAdapter;
  onSignOut: () => void;
  visible: boolean;
  onClose: () => void;
}
