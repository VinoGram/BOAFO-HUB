import React, { useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import './Notification.css';

export const NotificationIsland: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  const latestNotification = notifications[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(latestNotification.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [latestNotification, removeNotification]);

  return (
    <div className="notification-island-container">
      <div className="notification-island">
        <div className="notification-content">
          {latestNotification.avatarUrl ? (
            <img src={latestNotification.avatarUrl} alt="avatar" className="notification-avatar" />
          ) : (
            <div className="notification-avatar-placeholder" />
          )}
          <div className="notification-text">
            <div className="notification-title">{latestNotification.title}</div>
            <div className="notification-message">{latestNotification.message}</div>
          </div>
        </div>
        <button onClick={() => removeNotification(latestNotification.id)} className="notification-close">
          &times;
        </button>
      </div>
    </div>
  );
};