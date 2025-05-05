import React, { useState, useEffect } from 'react';
import { Spin, Typography, Card, Space, Row, Col, Button, message } from 'antd';
import { CheckCircleOutlined, SafetyOutlined, SyncOutlined } from '@ant-design/icons';
import './QuickBooksLogin.css';
import './index.css';
import XeroLoginButton from './components/XeroLoginButton';

const { Title, Paragraph, Text } = Typography;

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);

  // Anti-scraping measures
  useEffect(() => {
    const handleInteraction = () => {
      setIsHuman(true);
    };

    document.addEventListener('mousemove', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('scroll', handleInteraction);
    document.body.classList.add('no-select');

    return () => {
      document.removeEventListener('mousemove', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
    };
  }, []);

  const handleConnectQB = () => {
    if (!isHuman) {
      message.warning('Please interact with the page before connecting');
      return;
    }
    setLoadingPlatform('quickbooks');
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`;
  };

  return (
    <div className="login-page-container" style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', width: '100%', marginBottom: '40px', textAlign: 'center' }}>
        <Title level={1} style={{ fontSize: '2.8rem', color: '#2c3e50', marginBottom: '16px' }}>
          Accounting Integration Platform
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#34495e', maxWidth: '800px', margin: '0 auto' }}>
          Connect your accounting software and streamline your financial workflows with our powerful integration tools.
        </Paragraph>
      </div>

      <Row gutter={[32, 32]} style={{ width: '100%', maxWidth: '1200px' }}>
        {/* QuickBooks Card */}
        <Col xs={24} md={12}>
          <Card 
            bordered={false}
            style={{
              height: '100%',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ 
              background: '#2CA01C', 
              padding: '24px',
              textAlign: 'center'
            }}>
              <img 
                src="/logo.webp" 
                alt="QuickBooks" 
                style={{ 
                  height: '40px',
                  marginBottom: '0px'
                }}
              />
            </div>
            
            <div style={{ padding: '32px' }}>
              <Title level={3} style={{ marginBottom: '24px', textAlign: 'center' }}>
                QuickBooks Integration
              </Title>
              
              <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: '#2CA01C', marginRight: '12px', marginTop: '4px' }} />
                  <div>
                    <Text strong>Real-time Financial Tracking</Text>
                    <Paragraph type="secondary">
                      Access up-to-date financial data and reports instantly
                    </Paragraph>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: '#2CA01C', marginRight: '12px', marginTop: '4px' }} />
                  <div>
                    <Text strong>Automated Bookkeeping</Text>
                    <Paragraph type="secondary">
                      Reduce manual data entry with automated transaction processing
                    </Paragraph>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: '#2CA01C', marginRight: '12px', marginTop: '4px' }} />
                  <div>
                    <Text strong>Comprehensive Financial Management</Text>
                    <Paragraph type="secondary">
                      Manage invoices, bills, expenses, and payroll in one place
                    </Paragraph>
                  </div>
                </div>
              </Space>
              
              {loadingPlatform === 'quickbooks' ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Spin size="large" />
                  <Paragraph style={{ marginTop: '16px', color: '#1890ff' }}>
                    Connecting to QuickBooks...
                  </Paragraph>
                </div>
              ) : (
                <Button 
                  type="link"
                  onClick={handleConnectQB}
                  style={{
                    width: '100%',
                   
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                   
                  }}
                >
                  <img 
                    src="/qbologin.png" 
                    alt="Connect to QuickBooks" 
                     style={{ 
                      height: '50px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      cursor: 'pointer'
                    }}  
                  />
                </Button>
              )}
            </div>
          </Card>
        </Col>
        
        {/* Xero Card */}
        <Col xs={24} md={12}>
          <Card 
            bordered={false}
            style={{
              height: '100%',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ 
              background: '#13B5EA', 
              padding: '24px',
              textAlign: 'center'
            }}>
              <img 
                src="./image.png"
                alt="Xero" 
                style={{ 
                  height: '50px'// Makes the logo white
                }}
              />
            </div>
            
            <div style={{ padding: '32px' }}>
              <Title level={3} style={{ marginBottom: '24px', textAlign: 'center' }}>
                Xero Integration
              </Title>
              
              <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: '#13B5EA', marginRight: '12px', marginTop: '4px' }} />
                  <div>
                    <Text strong>Cloud-Based Accounting</Text>
                    <Paragraph type="secondary">
                      Access your financial data securely from anywhere, anytime
                    </Paragraph>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: '#13B5EA', marginRight: '12px', marginTop: '4px' }} />
                  <div>
                    <Text strong>Seamless Bank Reconciliation</Text>
                    <Paragraph type="secondary">
                      Automatically import and categorize your bank transactions
                    </Paragraph>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: '#13B5EA', marginRight: '12px', marginTop: '4px' }} />
                  <div>
                    <Text strong>Powerful Reporting Tools</Text>
                    <Paragraph type="secondary">
                      Generate detailed financial reports with just a few clicks
                    </Paragraph>
                  </div>
                </div>
              </Space>
              
              {loadingPlatform === 'xero' ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Spin size="large" />
                  <Paragraph style={{ marginTop: '16px', color: '#1890ff' }}>
                    Connecting to Xero...
                  </Paragraph>
                </div>
              ) : (
                <XeroLoginButton />
              )}
            </div>
          </Card>
        </Col>
      </Row>
      
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <Paragraph style={{ fontSize: '14px', color: '#888' }}>
          By connecting, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
        </Paragraph>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <SafetyOutlined style={{ fontSize: '16px', color: '#3498db', marginRight: '8px' }} />
          <Text type="secondary">Your data is protected with enterprise-grade security</Text>
        </div>
      </div>
    </div>
  );
};

export default App;