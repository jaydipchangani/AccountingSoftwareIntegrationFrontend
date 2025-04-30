import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, Result, Typography, Progress } from 'antd';
import { CloudSyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './Callback.css';

const { Title, Text } = Typography;

const Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const realmId = searchParams.get('realmId');

    if (code && state && realmId) {
      let progressInterval: NodeJS.Timeout;
      setLoading(true);

      // Simulate progress while connecting
      progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress < 100) {
            return prevProgress + 10;
          }
          clearInterval(progressInterval);
          return 100;
        });
      }, 300);

      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state, realmId }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server Error: ${res.status} - ${text}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.token) {
            localStorage.setItem('quickbooks_accessToken', data.token.accessToken);
            localStorage.setItem('quickbooks_refreshToken', data.token.refreshToken);
            localStorage.setItem('quickbooks_idToken', data.token.idToken);
            localStorage.setItem('quickbooks_realmId', data.token.realmId);
          }
          setLoading(false);
          setTimeout(() => navigate('/home'), 1000);
        })
        .catch(err => {
          console.error('Token exchange failed:', err);
          setLoading(false);
          setError('Failed to connect to QuickBooks. Please try again.');
        });
      
    } else {
      setLoading(false);
      setError('Missing required parameters from QuickBooks.');
    }
  }, [searchParams, navigate]);

  

  return (
    <div className="qb-callback-container">
      <Card
        className="qb-callback-card"
        bordered={false}
        style={{
          maxWidth: '500px',
          margin: 'auto',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        {error ? (
          <Result
            status="error"
            icon={<ExclamationCircleOutlined className="qb-error-icon" />}
            title="Connection Failed"
            subTitle={error}
            extra={[
              <button
                key="retry"
                className="qb-retry-button"
                onClick={() => navigate('/')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Try Again
              </button>,
            ]}
          />
        ) : (
          <div className="qb-callback-content">
            <Title level={3} className="qb-callback-title" style={{ textAlign: 'center', marginTop: '16px' }}>
              QuickBooks Integration
            </Title>
            <div className="qb-callback-status" style={{ textAlign: 'center', marginTop: '20px' }}>
              {loading ? (
                <>
                  <Progress
                    percent={progress}
                    status="active"
                    showInfo={false}
                    style={{ marginBottom: '20px' }}
                  />
                  <Spin size="large" />
                  <Text className="qb-status-text" style={{ display: 'block', marginTop: '16px', fontSize: '16px' }}>
                    Connecting to QuickBooks...
                  </Text>
                </>
              ) : (
                <>
                  <Text className="qb-status-text" style={{ fontSize: '18px', color: '#52c41a' }}>
                    Connection successful! Redirecting...
                  </Text>
                </>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Callback;
