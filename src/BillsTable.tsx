import React, { useEffect, useState } from 'react';
import { Table, Input, Button, message, Space, Tag, Modal, Select } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

const BillTable: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page: number, pageSize: number, search: string) => {
    setLoading(true);
    try {
      // Updated to use the InvoiceController API with ACCPAY filter for bills
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/InvoiceContoller/get-invoices?` + 
        `pageNumber=${page}&pageSize=${pageSize}&searchTerm=${search}&platform=Xero&invoiceType=ACCPAY`
      );
      
      if (response.ok) {
        const responseData = await response.json();
        setData(responseData.invoices || []);
        setTotal(responseData.totalRecords || 0);
      } else {
        throw new Error('Failed to fetch invoices');
      }
    } catch (error) {
      Modal.error({
        title: 'Error Fetching Bills',
        content: 'Failed to fetch bills from the server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchData(1, pageSize, value);
    setPage(1);
  };

  const handleTableChange = (pagination: any) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchData(pagination.current, pagination.pageSize, searchTerm);
  };

  const syncBills = async () => {
    setLoading(true);
    try {
      // Updated to use Xero API for bills (ACCPAY)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/XeroInvoice?type=ACCPAY`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        Modal.success({
          title: 'Success',
          content: data.message || 'Xero bills downloaded successfully',
        });
        fetchData(page, pageSize, searchTerm);
      } else {
        throw new Error('Failed to sync bills');
      }
    } catch (error) {
      Modal.error({
        title: 'Sync Failed',
        content: 'Failed to sync bills from Xero.',
      });
    } finally { 
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const addBills = () => {
    navigate('/home/xero-invoice?type=ACCPAY');
  };
  useEffect(() => {
    const handleFocus = () => {

      fetchData(page, pageSize, searchTerm);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    fetchData(page, pageSize, searchTerm);
  }, []);

  const columns = [
    // {
    //   title: 'Invoice Number',
    //   dataIndex: 'docNumber',
    //   key: 'docNumber',
    // },
    {
      title: 'Vendor Name',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    
    {
      title: 'Status',
      dataIndex: 'xeroStatus',
      key: 'xeroStatus',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : status === 'DRAFT' ? 'blue' : 'red'}>
          {status || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmt',
      key: 'totalAmt',
      render: (amount: number, record: any) => `${record.xeroCurrencyCode || '$'} ${amount.toFixed(2)}`,
    },
    {
      title: 'Created Date',
      dataIndex: 'txnDate',
      key: 'txnDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="link" 
            danger 
            onClick={() => handleDelete(record)}
            disabled={record.xeroStatus !== 'DRAFT'}
          >
            Delete
          </Button>
          <Button
            type="link"
            onClick={() => {
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
            }}
            disabled={record.xeroStatus === 'DELETED'}
          >
            Edit
          </Button>
        </Space>
      ),
    }
  ];

  // Add delete handler
  const handleDelete = async (invoice: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/XeroInvoice/${invoice.quickBooksId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Xero bill successfully deleted');
        fetchData(page, pageSize, searchTerm);
      } else {
        const errorData = await response.json();
        Modal.error({
          title: 'Delete Failed',
          content: errorData.message || 'Failed to delete Xero bill',
        });
      }
    } catch (error) {
      Modal.error({
        title: 'Error',
        content: 'An error occurred while deleting the bill',
      });
    }
  };

  return (
    <div>
      <h2>Bills</h2>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search bills..."
          onSearch={handleSearch}
          enterButton
          allowClear
          style={{ width: 300 }}
        />
        <div>
          <Button type="primary" onClick={syncBills} loading={loading} style={{ marginRight: 8 }}>
            Download From Xero
          </Button>
          <Button type="primary" onClick={addBills} loading={loading}>
            + Add Bill in Xero
          </Button>
          <Button type="primary" style={{ backgroundColor: '#52c41a', marginLeft: 8 }} onClick={() => navigate('/home/add-bill')} loading={loading}>
            + Add Bill in QBO
          </Button>
        </div>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        scroll={{ y: 600, x: 'max-content' }}
      />
    </div>
  );
};

export default BillTable;