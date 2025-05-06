import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Typography, message, Select, Modal } from 'antd';

import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomerDropDown from './CustomerDropDown';
import InvoiceDrawer from './InvoiceDrawer';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface Customer {
  quickBooksCustomerId: string;
  displayName: string;
  email: string;
  billingLine1: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingPostalCode: string;
}

const InvoicesTable = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [searchedColumn, setSearchedColumn] = useState<string>('');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]); // Array of customers
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null); // Single selected customer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,  // Changed default page size
    total: 0,
    pageSizeOptions: ['10', '20', '50', '100']  // Added size options
  });
  const fetchInvoices = async (page = 1, pageSize = 10, searchTerm = '', platform = '') => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/InvoiceContoller/get-invoices?` + 
        `pageNumber=${page}&pageSize=${pageSize}&searchTerm=${searchTerm}&platform=${platform || ''}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setPagination({
          ...pagination,
          current: page,
          total: data.totalRecords || 0
        });
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (err) {
      setError('Error occurred while fetching data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = (value: string) => {
    setSearchText(value);
    fetchInvoices(1, pagination.pageSize, value, platformFilter || '');
  };

  const handlePlatformFilter = (value: string | null) => {
    setPlatformFilter(value);
    fetchInvoices(1, pagination.pageSize, searchText, value || '');
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('https://localhost:7241/api/InvoiceContoller/customers');
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerChange = (customerId: string) => {
    const selected = customers.find((customer) => customer.quickBooksCustomerId === customerId);
    setSelectedCustomer(selected || null);
  };

  const handleSyncInvoices = async () => {
    setSyncing(true);
    try {
      const response = await fetch('https://localhost:7241/api/InvoiceContoller/sync-invoices', {
        method: 'GET',
      });

      if (response.ok) {
        message.success('Invoices synced successfully!');
        fetchInvoices(); // refresh table after sync
      } else {
        message.error('Failed to sync invoices');
      }
    } catch (error) {
      message.error('An error occurred while syncing invoices');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (invoice: any) => {
    try {
      if (invoice.platform === 'Xero') {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/XeroInvoice/${invoice.quickBooksId}`, {
          method: 'DELETE',
        });
  
        if (response.ok) {
          message.success('Xero invoice successfully deleted');
          setInvoices(invoices.filter((inv) => inv.id !== invoice.id));
        } else {
          const errorData = await response.json();
          Modal.error({
            title: 'Delete Failed',
            content: errorData.message || 'Failed to delete Xero invoice',
          });
        }
      } else {
        const requestPayload = {
          Id: invoice.quickBooksId,
          SyncToken: invoice.syncToken,
        };
  
        const response = await fetch('https://localhost:7241/api/InvoiceContoller/soft-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Id': invoice.quickBooksId,
            'SyncToken': invoice.syncToken,
          },
          body: JSON.stringify(requestPayload),
        });
  
        if (response.ok) {
          message.success('Invoice successfully soft-deleted');
          setInvoices(invoices.filter((inv) => inv.quickBooksId !== invoice.quickBooksId));
        } else {
          const errorData = await response.json();
          Modal.error({
            title: 'Delete Failed',
            content: errorData.message || 'Failed to delete invoice',
          });
        }
      }
    } catch (error) {
      Modal.error({
        title: 'Error',
        content: 'An error occurred while deleting the invoice',
      });
    }
  };

  

  // New void invoice function
  const handleVoidInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`https://localhost:7241/api/InvoiceContoller/void-invoice/${invoiceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Invoice voided successfully');
        fetchInvoices(); // Refresh the table after voiding
      } else {
        message.error('Failed to void invoice');
      }
    } catch (error) {
      message.error('An error occurred while voiding the invoice');
    }
  };

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          autoFocus
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            size="small"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small">
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string, record: any) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
  });

  const handleSearch = (selectedKeys: string[], confirm: any, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
    fetchInvoices(1, pagination.pageSize, selectedKeys[0]);
  };

  const handleXeroDownload = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/XeroInvoice`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        Modal.success({
          title: 'Success',
          content: data.message || 'Xero invoices downloaded successfully',
        });
        fetchInvoices();
      } else {
        const errorData = await response.json();
        Modal.error({
          title: 'Download Failed',
          content: errorData.message || 'Failed to download Xero invoices',
        });
      }
    } catch (error) {
      Modal.error({
        title: 'Error',
        content: 'An error occurred while downloading Xero invoices',
      });
    }
  };

  const handleReset = (clearFilters: any) => {
    clearFilters();
    setSearchText('');
  };

  const columns = [
    {
      title: 'Invoice Number',
      dataIndex: 'docNumber',
      ...getColumnSearchProps('docNumber'),
      sorter: (a: any, b: any) => a.docNumber.localeCompare(b.docNumber),
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      ...getColumnSearchProps('customerName'),
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      filters: [
        { text: 'Xero', value: 'Xero' },
        { text: 'QuickBooks', value: 'QBO' }
      ],
      onFilter: (value: string, record: any) => record.platform === value,
    },
    {
      title: 'Status',
      dataIndex: 'xeroStatus',
      render: (status: string) => status || 'N/A',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      sorter: (a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      render: (dueDate: string) => new Date(dueDate).toLocaleDateString(),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmt',
      sorter: (a: any, b: any) => a.totalAmt - b.totalAmt,
      render: (totalAmt: number, record: any) => `${record.xeroCurrencyCode || '$'} ${totalAmt.toFixed(2)}`,
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    // Update the Action column render function
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => {
        // Check if the invoice is deleted or has a status that should disable actions
        const isDeleted = record.xeroStatus === 'DELETED';
        const isDraft = record.xeroStatus === 'DRAFT';
        const isXero = record.platform === 'Xero';
        
        return (
          <Space size="middle">
            <Button 
              type="link" 
              danger 
              onClick={() => handleDelete(record)}
              disabled={isDeleted || (isXero && !isDraft)}
            >
              Delete
            </Button>
            <Button
              type="link"
              onClick={() => {
                if (record.platform === 'Xero') {
                  navigate('/home/edit-xero-invoice', { 
                    state: { 
                      invoice: {
                        id: record.id,
                        quickBooksId: record.quickBooksId,
                        customerMemo: record.customerMemo,
                        date: record.date,
                        dueDate: record.dueDate,
                        status: record.status,
                        totalAmt: record.totalAmt,
                        lineItems: record.lineItems
                      }
                    }
                  });
                } else {
                  navigate(`/home/edit-invoice/${record.quickBooksId}`, { state: { record } });
                }
              }}
              disabled={isDeleted}
            >
              Edit
            </Button>
          </Space>
        );
      },
    }
      ];
      const navigate = useNavigate();
      return (
        <div>
          <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Title level={2}>Invoices</Title>
            <Space>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={syncing}
                onClick={handleSyncInvoices}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Download From QBO
              </Button>
              <Button
                type="primary"
                onClick={handleXeroDownload}
              >
                Download From Xero
              </Button>
              {/* <Button type="primary" onClick={() => navigate('/home/add-invoice')}>
                Add Invoice
              </Button> */}
              <Button type="primary" onClick={() => navigate('/home/xero-invoice')}>
                Add Xero Invoice
              </Button>
            </Space>
          </Space>
          <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
            <Input.Search
              placeholder="Search invoices..."
              onChange={(e) => handleGlobalSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="Filter by Platform"
              style={{ width: 200 }}
              onChange={handlePlatformFilter}
              allowClear
            >
              <Select.Option value="Xero">Xero</Select.Option>
              <Select.Option value="QBO">QuickBooks</Select.Option>
            </Select>
          </div>

          <InvoiceDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            customers={customers}
            // onAddInvoice={handleAddInvoice}
          />

<Table
    columns={columns.map(col => ({
      ...col,
      ...(!['action', 'platform'].includes(col.dataIndex) && { sorter: true }),
    }))}
    dataSource={invoices}
    rowKey="id"
    loading={loading}
    pagination={{
      ...pagination,
      showSizeChanger: true,
      pageSizeOptions: pagination.pageSizeOptions,
      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      onChange: (page, pageSize) => {
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: pageSize
        }));
        fetchInvoices(page, pageSize, searchText, platformFilter || '');
      },
      onShowSizeChange: (current, size) => {
        setPagination(prev => ({
          ...prev,
          current: 1,
          pageSize: size
        }));
        fetchInvoices(1, size, searchText, platformFilter || '');
      }
    }}
    scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
    bordered
    sticky
  />
        </div>
      );
    };

    export default InvoicesTable;
