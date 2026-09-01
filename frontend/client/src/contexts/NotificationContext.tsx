import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationPayload {
  id: number;
  title: string;
  message: string;
  avatarUrl?: string;
}

interface NotificationContextType {
  addNotification: (notification: Omit<NotificationPayload, 'id'>) => void;
  notifications: NotificationPayload[];
  removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationPayload, 'id'>) => {
    const newNotification = { ...notification, id: Date.now() };
    setNotifications(current => [newNotification, ...current]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(current => current.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};