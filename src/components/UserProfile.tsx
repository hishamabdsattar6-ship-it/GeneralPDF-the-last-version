import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
      <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
      <div className="flex flex-col flex-1">
        <span className="font-medium text-gray-900 text-sm leading-tight">{user.name}</span>
        <span className="text-gray-500 text-xs">{user.email}</span>
      </div>
      <button
        onClick={logout}
        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center"
        title="تسجيل الخروج"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
};
