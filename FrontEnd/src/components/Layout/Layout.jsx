import { Outlet } from 'react-router';
import Header from '../common/Header';

const Layout = () => {
  return (
      <div className="flex">
      <Header />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
