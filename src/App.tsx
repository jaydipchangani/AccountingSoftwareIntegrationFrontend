import React, { useState, useEffect } from 'react';
import { Spin, Typography, Card, Space, Divider, Button, Row, Col, message } from 'antd';
import { LinkOutlined, SafetyOutlined, SyncOutlined, ApiOutlined } from '@ant-design/icons';
import './QuickBooksLogin.css';
import './index.css';
import XeroLoginButton from './components/XeroLoginButton';

const { Title, Paragraph, Text } = Typography;

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

  // Anti-scraping measures
  useEffect(() => {
    // Check for user interaction
    const handleInteraction = () => {
      setIsHuman(true);
    };

    // Add event listeners for human interaction
    document.addEventListener('mousemove', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('scroll', handleInteraction);

    // Add a CSS class to prevent text selection for sensitive content
    document.body.classList.add('no-select');

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
    };
  }, []);

  const handleConnect = () => {
    if (!isHuman) {
      message.warning('Please interact with the page before connecting');
      return;
    }
    setLoading(true);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`;
  };

  return (
    <div className="login-page-container" style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row gutter={[24, 24]} style={{ width: '100%', maxWidth: '1200px' }}>
        <Col xs={24} md={12} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ padding: '0 20px' }}>
            <Title level={1} style={{ fontSize: '2.5rem', marginBottom: '24px', color: '#2c3e50' }}>
              Accounting Integration Platform
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#34495e', marginBottom: '32px' }}>
              Connect your accounting software and streamline your financial workflows with our powerful integration tools.
            </Paragraph>
            
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SafetyOutlined style={{ fontSize: '24px', color: '#3498db', marginRight: '16px' }} />
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block' }}>Secure Connection</Text>
                  <Text type="secondary">Your data is protected with enterprise-grade security</Text>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SyncOutlined style={{ fontSize: '24px', color: '#3498db', marginRight: '16px' }} />
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block' }}>Real-time Sync</Text>
                  <Text type="secondary">Automatic data synchronization between platforms</Text>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ApiOutlined style={{ fontSize: '24px', color: '#3498db', marginRight: '16px' }} />
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block' }}>Powerful API</Text>
                  <Text type="secondary">Seamless integration with your existing systems</Text>
                </div>
              </div>
            </Space>
          </div>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            bordered={false}
            style={{
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', 
              padding: '40px',
              height: '100%',
              background: 'white'
            }}
          >
            <Title level={2} style={{ textAlign: 'center', marginBottom: '32px', color: '#2c3e50' }}>
              Connect Your Account
            </Title>
            
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <Spin size="large" />
                <Paragraph style={{ marginTop: '24px', fontSize: '16px', color: '#1890ff' }}>
                  Redirecting to authentication service...
                </Paragraph>
              </div>
            ) : (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button 
                  type="primary"
                  size="large"
                  icon={<LinkOutlined />}
                  onClick={handleConnect}
                  style={{
                    width: '100%',
                    height: '50px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    background: '#2CA01C',
                    borderColor: '#2CA01C',
                  }}
                >
                  Connect to QuickBooks
                </Button>
                
                <Divider plain>OR</Divider>
                
                <XeroLoginButton />
                
                <Paragraph style={{ fontSize: '14px', color: '#888', textAlign: 'center', marginTop: '16px' }}>
                  By connecting, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </Paragraph>
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default App;