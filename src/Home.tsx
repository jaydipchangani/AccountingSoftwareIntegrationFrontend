import React, { useState } from 'react';
import XeroLoginPage from './XeroLoginPage';
import { Layout, Menu, Button, message, Breadcrumb, Dropdown, Avatar } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  BankOutlined,
  SettingOutlined,
  DownOutlined,
  BilibiliFilled,
  ProductFilled,
  PaperClipOutlined,
  VerticalAlignBottomOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './HomeLayout.css';
import BillTable from './BillsTable';
import InvoicesTable from './InvoiceTable';


const { Header, Sider, Content, Footer } = Layout;

const Home: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('chart-of-accounts')) return 'Chart of Accounts';
    return 'Dashboard';
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        message.success('Logged out successfully');
        localStorage.removeItem('quickbooks_realmId');
        navigate('/');
      } else {
        message.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      message.error('Error during logout');
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} danger onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout className="app-layout">
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={toggleCollapse}
        className="app-sider"
        width={240}
        trigger={null}
      >
        <div className="logo-container">
          
          {!collapsed && (
            <span 
              className="logo-text" 
              onClick={() => navigate('loginXero')} 
              style={{ cursor: 'pointer' }}
            >
              QuickBooks & Xero
            </span>
          )}
          {collapsed && (
            <span 
              className="logo-text" 
              onClick={() => navigate('/xero-login')} 
              style={{ cursor: 'pointer' }}
            >
              QB
            </span>
          )}
        </div>

        <Menu 
          theme="dark" 
          mode="inline" 
          defaultSelectedKeys={['customer']}
          className="side-menu"
        >
          <Menu.Item key="customer" icon={<DashboardOutlined />} onClick={() => navigate('/home/customer')}>
            Customers
          </Menu.Item>
          <Menu.Item key="chart-of-accounts" icon={<BankOutlined />} onClick={() => navigate('/home/chart-of-accounts')}>
            Chart of Accounts
          </Menu.Item>

          <Menu.Item key="Bill" icon={<BilibiliFilled />} onClick={() => navigate('/home/bills')}>
            Bill
          </Menu.Item>
          <Menu.Item key="products" icon={<ProductFilled />} onClick={() => navigate('/home/products')}>
            Products
          </Menu.Item>
          <Menu.Item key="invoice" icon={<PaperClipOutlined />} onClick={() => navigate('/home/invoice')}>
            Invoice
          </Menu.Item>
          <Menu.Item key="vendor" icon={<VerticalAlignBottomOutlined />} onClick={() => navigate('/home/vendor')}>
            Vendor
          </Menu.Item>

          <Menu.Item key="csv" icon={<FileTextOutlined />} onClick={() => navigate('/home/csv')}>
            CSV Upload
          </Menu.Item>
          
         
        </Menu>
      </Sider>
      
      <Layout className="site-layout">
        <Header className="app-header">
          <div className="header-left">
            {collapsed ? (
              <MenuUnfoldOutlined className="trigger" onClick={toggleCollapse} />
            ) : (
              <MenuFoldOutlined className="trigger" onClick={toggleCollapse} />
            )}
            <Breadcrumb className="page-breadcrumb">
              <Breadcrumb.Item>Home</Breadcrumb.Item>
              <Breadcrumb.Item>{getPageTitle()}</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <div className="header-right">
            <Dropdown overlay={userMenu} trigger={['click']}>
              <Button type="text" className="user-dropdown-button">
                <Avatar size="small" icon={<UserOutlined />} className="user-avatar" />
                <span className="username">Admin</span>
                <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="app-content">
          <Outlet />
          
        </Content>
        
        <Footer className="app-footer">
          QuickBooks Integration ©{new Date().getFullYear()} Created with Ant Design
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Home;
