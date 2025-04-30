import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, Typography, message } from 'antd';
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

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://localhost:7241/api/InvoiceContoller/invoices');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setInvoices(data);
        } else {
          setError('Invalid data format');
        }
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (err) {
      setError('Error occurred while fetching data');
    } finally {
      setLoading(false);
    }
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
        message.error('Failed to delete invoice');
      }
    } catch (error) {
      message.error('An error occurred while deleting the invoice');
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
      sorter: (a: any, b: any) => a.customerName.localeCompare(b.customerName),
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
      render: (totalAmt: number) => `$${totalAmt.toFixed(2)}`,
    },
    {
      title: 'Customer Email',
      dataIndex: 'customerEmail',
      ...getColumnSearchProps('customerEmail'),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (_: any, record: any) => (
        <div>
          <Button type="link" danger onClick={() => handleDelete(record)}>
            Delete
          </Button>
          <Button
  type="link"
  onClick={() =>
    navigate(`/home/edit-invoice/${record.quickBooksId}`, { state: { record } })
  }
>
  Edit
</Button>
          <Button type="link" onClick={() => handleVoidInvoice(record.quickBooksId)}>
            Void
          </Button>
        </div>
      ),
    },
  ];
  const navigate = useNavigate();
  return (
    <div>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Invoices</Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={syncing}
          onClick={handleSyncInvoices}
        >
          Sync Invoices
        </Button>
        
        <Button type="primary" onClick={() => navigate('/home/add-invoice')}>
  Add Invoice
</Button>
      </Space>

      <InvoiceDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        customers={customers}
        // onAddInvoice={handleAddInvoice}
      />

      <Table
        columns={columns}
        dataSource={invoices}
        rowKey="quickBooksId"
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
        bordered
      />
    </div>
  );
};

export default InvoicesTable;
