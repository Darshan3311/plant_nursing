import React from 'react';

import { useAuth } from './context/AuthContext';

const App = () => {
  const { user } = useAuth();

  return (
    <>
    <h1>hellow ther</h1>
    </>
  );
};

export default App;
