import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Layout, Divider, Button, Row, Col, Spin, message } from 'antd';
import XeroLoginButton from './components/XeroLoginButton';
import { LinkOutlined, SafetyOutlined, SyncOutlined, ApiOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';  
const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

const XeroLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [xeroConnected, setXeroConnected] = useState(false);
  const [qboConnected, setQboConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);


  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);


  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/XeroAuth/logout`);
      await checkConnectionStatus();
      message.success('Disconnected from Xero successfully.');
    } catch (error) {
      console.error('Error disconnecting from Xero:', error);
      message.error('Failed to disconnect from Xero.');
    } finally {
      setDisconnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      // Call the new unified API endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Auth/token-status`);
      const data = await response.json();
      
      // Update connection states based on the response
      setXeroConnected(data.xero);
      setQboConnected(data.quickBooks);
    } catch (error) {
      console.error('Error checking connection status:', error);
      // In case of error, set both to disconnected
      setXeroConnected(false);
      setQboConnected(false);
    }
  };

  const handleQBConnect = () => {
    setLoading(true);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`;
  };

  const handleXeroConnect = () => {
    setLoading(true);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/xeroauth/login`;
  };


  const handleQBDisconnect = async () => {
    try {
      setLoading(true);
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/disconnect`, {
        method: 'POST',
      });
      await checkConnectionStatus();
      message.success('Successfully disconnected from QuickBooks');
    } catch (error) {
      console.error('Error disconnecting from QuickBooks:', error);
      message.error('Failed to disconnect from QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  // Add Xero logout handler
  const handleXeroLogout = () => {
    setLoading(true);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/XeroAuth/logout`;
  };

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)'
    }}>
      <Content style={{ padding: '50px 20px' }}>
        <Row justify="center" align="middle">
          <Col xs={24} md={20} lg={16} xl={12}>
            <Title 
              level={1} 
              style={{ 
                textAlign: 'center', 
                marginBottom: '40px',
                color: '#2c3e50',
                fontSize: '2.5rem'
              }}
            >
              Accounting Integration Hub
            </Title>
            
            <Card
              bordered={false}
              style={{
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              {loading ? (
                <div style={{ 
                  padding: '60px 0', 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Spin size="large" />
                  <Paragraph style={{ marginTop: '24px', fontSize: '16px', color: '#1890ff' }}>
                    Connecting to your accounting service...
                  </Paragraph>
                </div>
              ) : (
                <Row>
                  <Col xs={24} md={12} style={{ padding: '40px' }}>
                    <div style={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                          <Title level={2} style={{ color: '#13B5EA', marginBottom: 0, marginRight: '12px' }}>
                            Xero
                          </Title>
                          <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: xeroConnected ? '#52c41a' : '#f5222d',
                            boxShadow: `0 0 8px ${xeroConnected ? '#52c41a' : '#f5222d'}`
                          }} />
                        </div>
                        <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
                          Connect with Xero for cloud-based accounting designed for small businesses.
                        </Paragraph>
                        <Text style={{ 
                          display: 'block', 
                          marginBottom: '16px', 
                          color: xeroConnected ? '#52c41a' : '#f5222d',
                          fontWeight: 'bold'
                        }}>
                          Status: {xeroConnected ? "Connected" : "Not Connected"}
                        </Text>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Button
                          type="primary"
                          size="large"
                          icon={<LinkOutlined />}
                          onClick={handleXeroConnect}
                          disabled={xeroConnected}
                          style={{
                            height: '50px',
                            fontSize: '16px',
                            borderRadius: '8px',
                            background: xeroConnected ? '#d9d9d9' : '#13B5EA',
                            borderColor: xeroConnected ? '#d9d9d9' : '#13B5EA',
                          }}
                        >
                          {xeroConnected ? (
                            <>
                              <LockOutlined /> Already Connected
                            </>
                          ) : (
                            'Connect to Xero'
                          )}
                        </Button>
                        
                        {xeroConnected && (
                          <Button 
                            danger 
                            size="large"
                            icon={<LockOutlined />}
                            loading={disconnecting} 
                            onClick={handleDisconnect}
                            style={{
                              height: '50px',
                              fontSize: '16px',
                              borderRadius: '8px',
                            }}
                          >
                            Disconnect from Xero
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                  
                  <Col xs={24} md={12} style={{ 
                    padding: '40px',
                    borderLeft: '1px solid #f0f0f0'
                  }}>
                    <div style={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                          <Title level={2} style={{ color: '#2CA01C', marginBottom: 0, marginRight: '12px' }}>
                            QuickBooks
                          </Title>
                          <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: qboConnected ? '#52c41a' : '#f5222d',
                            boxShadow: `0 0 8px ${qboConnected ? '#52c41a' : '#f5222d'}`
                          }} />
                        </div>
                        <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
                          Connect with QuickBooks for comprehensive financial management tools.
                        </Paragraph>
                        <Text style={{ 
                          display: 'block', 
                          marginBottom: '16px', 
                          color: qboConnected ? '#52c41a' : '#f5222d',
                          fontWeight: 'bold'
                        }}>
                          Status: {qboConnected ? "Connected" : "Not Connected"}
                        </Text>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Button
                          type="primary"
                          size="large"
                          icon={<LinkOutlined />}
                          onClick={handleQBConnect}
                          disabled={qboConnected}
                          style={{
                            height: '50px',
                            fontSize: '16px',
                            borderRadius: '8px',
                            background: qboConnected ? '#d9d9d9' : '#2CA01C',
                            borderColor: qboConnected ? '#d9d9d9' : '#2CA01C',
                          }}
                        >
                          {qboConnected ? (
                            <>
                              <LockOutlined /> Already Connected
                            </>
                          ) : (
                            'Connect to QuickBooks'
                          )}
                        </Button>
                        
                        {qboConnected && (
                          <Button 
                            danger 
                            size="large"
                            icon={<LockOutlined />}
                            loading={loading} 
                            onClick={handleQBDisconnect}
                            style={{
                              height: '50px',
                              fontSize: '16px',
                              borderRadius: '8px',
                            }}
                          >
                            Disconnect from QuickBooks
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              )}
            </Card>
            
            <Card
              style={{
                marginTop: '24px',
                borderRadius: '16px',
                background: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
              bordered={false}
            >
              <Title level={3} style={{ marginBottom: '24px', color: '#2c3e50' }}>
                Integration Benefits
              </Title>
              
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Space align="start">
                    <SyncOutlined style={{ fontSize: '24px', color: '#3498db' }} />
                    <div>
                      <Text strong style={{ fontSize: '16px', display: 'block' }}>
                        Automated Synchronization
                      </Text>
                      <Text type="secondary">
                        Keep your financial data in sync across platforms
                      </Text>
                    </div>
                  </Space>
                </Col>
                
                <Col xs={24} md={12}>
                  <Space align="start">
                    <ApiOutlined style={{ fontSize: '24px', color: '#3498db' }} />
                    <div>
                      <Text strong style={{ fontSize: '16px', display: 'block' }}>
                        Streamlined Workflow
                      </Text>
                      <Text type="secondary">
                        Reduce manual data entry and processing time
                      </Text>
                    </div>
                  </Space>
                </Col>
                
                <Col xs={24} md={12}>
                  <Space align="start">
                    <SafetyOutlined style={{ fontSize: '24px', color: '#3498db' }} />
                    <div>
                      <Text strong style={{ fontSize: '16px', display: 'block' }}>
                        Secure Data Handling
                      </Text>
                      <Text type="secondary">
                        Enterprise-grade security for your financial information
                      </Text>
                    </div>
                  </Space>
                </Col>
                
                <Col xs={24} md={12}>
                  <Space align="start">
                    <ApiOutlined style={{ fontSize: '24px', color: '#3498db' }} />
                    <div>
                      <Text strong style={{ fontSize: '16px', display: 'block' }}>
                        Real-time Insights
                      </Text>
                      <Text type="secondary">
                        Access up-to-date financial data and reports
                      </Text>
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default XeroLoginPage;