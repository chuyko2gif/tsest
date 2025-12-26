// Утилиты уведомлений

export const showNotificationToast = (message: string, title: string = 'THQ Label - Поддержка') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message });
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const playNotificationSound = () => {
  const audio = new Audio('/notification.mp3');
  audio.play().catch(e => console.log('Sound play failed:', e));
};

export const canPlaySound = (): boolean => {
  return typeof Audio !== 'undefined';
};
