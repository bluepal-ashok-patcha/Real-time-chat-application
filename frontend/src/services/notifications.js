let clickHandler = null;

export const initNotifications = async () => {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
  } catch (_) {}
  return false;
};

export const setNotificationClickHandler = (handler) => {
  clickHandler = handler;
};

export const showMessageNotification = ({ title, body, icon, data }) => {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const n = new Notification(title || 'New message', {
      body: body || '',
      icon: icon || undefined,
      data: data || {},
      tag: data && data.tag ? data.tag : undefined, // dedupe
    });
    n.onclick = () => {
      window.focus();
      if (clickHandler) {
        try { clickHandler(n.data); } catch (_) {}
      }
      n.close();
    };
    setTimeout(() => n.close(), 8000);
  } catch (_) {}
};


