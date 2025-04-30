import React from 'react';
import { Button } from 'antd';
import { LoginOutlined } from '@ant-design/icons';

const XeroLoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = 'https://localhost:7241/api/xeroauth/login';
  };

  return (
    <Button
      type="primary"
      size="large"
      icon={<LoginOutlined />}
      onClick={handleLogin}
      style={{
        width: '100%',
        height: '50px',
        fontSize: '16px',
        borderRadius: '8px',
        background: '#13B5EA', // Xero blue color
        borderColor: '#13B5EA',
      }}
    >
      Connect to Xero
    </Button>
  );
};

export default XeroLoginButton;