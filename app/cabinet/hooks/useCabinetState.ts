import { useState } from 'react';
import { UserRole } from '../lib/types';

export interface CabinetState {
  // Вкладки
  tab: 'releases' | 'finance' | 'settings';
  setTab: (tab: 'releases' | 'finance' | 'settings') => void;
  
  // Создание релиза
  creatingRelease: boolean;
  setCreatingRelease: (value: boolean) => void;
  createTab: 'release'|'tracklist'|'countries'|'contract'|'platforms'|'localization'|'send'|'events'|'promo';
  setCreateTab: (tab: 'release'|'tracklist'|'countries'|'contract'|'platforms'|'localization'|'send'|'events'|'promo') => void;
  
  // UI состояние
  showUploadDemo: boolean;
  setShowUploadDemo: (value: boolean) => void;
  showCalendar: boolean;
  setShowCalendar: (value: boolean) => void;
  calendarMonth: number;
  setCalendarMonth: (value: number) => void;
  calendarYear: number;
  setCalendarYear: (value: number) => void;
  
  // Модалка аватара
  showAvatarModal: boolean;
  setShowAvatarModal: (value: boolean) => void;
  avatarPreview: string | null;
  setAvatarPreview: (value: string | null) => void;
  avatarFile: File | null;
  setAvatarFile: (value: File | null) => void;
  uploadingAvatar: boolean;
  setUploadingAvatar: (value: boolean) => void;
  
  // Toast
  showToast: boolean;
  setShowToast: (value: boolean) => void;
}

export function useCabinetState(): CabinetState {
  const [tab, setTab] = useState<'releases' | 'finance' | 'settings'>('releases');
  const [creatingRelease, setCreatingRelease] = useState(false);
  const [createTab, setCreateTab] = useState<'release'|'tracklist'|'countries'|'contract'|'platforms'|'localization'|'send'|'events'|'promo'>('release');
  
  const [showUploadDemo, setShowUploadDemo] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  
  return {
    tab, setTab,
    creatingRelease, setCreatingRelease,
    createTab, setCreateTab,
    showUploadDemo, setShowUploadDemo,
    showCalendar, setShowCalendar,
    calendarMonth, setCalendarMonth,
    calendarYear, setCalendarYear,
    showAvatarModal, setShowAvatarModal,
    avatarPreview, setAvatarPreview,
    avatarFile, setAvatarFile,
    uploadingAvatar, setUploadingAvatar,
    showToast, setShowToast,
  };
}

// Состояние формы вывода средств
export interface WithdrawalFormState {
  showWithdrawalForm: boolean;
  setShowWithdrawalForm: (value: boolean) => void;
  withdrawalAmount: string;
  setWithdrawalAmount: (value: string) => void;
  bankName: string;
  setBankName: (value: string) => void;
  cardNumber: string;
  setCardNumber: (value: string) => void;
  recipientName: string;
  setRecipientName: (value: string) => void;
  additionalInfo: string;
  setAdditionalInfo: (value: string) => void;
  resetForm: () => void;
}

export function useWithdrawalForm(): WithdrawalFormState {
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  const resetForm = () => {
    setShowWithdrawalForm(false);
    setWithdrawalAmount('');
    setBankName('');
    setCardNumber('');
    setRecipientName('');
    setAdditionalInfo('');
  };
  
  return {
    showWithdrawalForm, setShowWithdrawalForm,
    withdrawalAmount, setWithdrawalAmount,
    bankName, setBankName,
    cardNumber, setCardNumber,
    recipientName, setRecipientName,
    additionalInfo, setAdditionalInfo,
    resetForm,
  };
}

// Состояние смены пароля и email
export interface SecurityFormState {
  showPasswordChange: boolean;
  setShowPasswordChange: (value: boolean) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  passwordLoading: boolean;
  setPasswordLoading: (value: boolean) => void;
  passwordError: string;
  setPasswordError: (value: string) => void;
  passwordSuccess: string;
  setPasswordSuccess: (value: string) => void;
  
  showEmailChange: boolean;
  setShowEmailChange: (value: boolean) => void;
  newEmail: string;
  setNewEmail: (value: string) => void;
  emailLoading: boolean;
  setEmailLoading: (value: boolean) => void;
  emailError: string;
  setEmailError: (value: string) => void;
  emailSuccess: string;
  setEmailSuccess: (value: string) => void;
  
  resetPasswordForm: () => void;
  resetEmailForm: () => void;
}

export function useSecurityForm(): SecurityFormState {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
  const resetPasswordForm = () => {
    setShowPasswordChange(false);
    setPasswordError('');
    setPasswordSuccess('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  const resetEmailForm = () => {
    setShowEmailChange(false);
    setEmailError('');
    setEmailSuccess('');
    setNewEmail('');
  };
  
  return {
    showPasswordChange, setShowPasswordChange,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    passwordLoading, setPasswordLoading,
    passwordError, setPasswordError,
    passwordSuccess, setPasswordSuccess,
    showEmailChange, setShowEmailChange,
    newEmail, setNewEmail,
    emailLoading, setEmailLoading,
    emailError, setEmailError,
    emailSuccess, setEmailSuccess,
    resetPasswordForm,
    resetEmailForm,
  };
}
