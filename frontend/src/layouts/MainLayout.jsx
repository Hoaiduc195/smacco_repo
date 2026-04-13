import { Outlet } from 'react-router-dom';
import ChatWidget from '../components/ChatWidget';

export default function MainLayout() {
  return (
    <div className="h-screen bg-white">
      <Outlet />
      <ChatWidget />
    </div>
  );
}
