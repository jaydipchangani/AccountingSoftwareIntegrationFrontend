import React, { useEffect, useState } from 'react';
import { Table, Input, Button, message, Space, Tag, Modal } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

const BillTable: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page: number, pageSize: number, search: string) => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7241/api/bill', {
        params: { page, pageSize, search },
      });
      Modal.success({
        title: 'Success',
        content: 'Bills fetched successfully!',
      });
      setData(response.data.data);
      setTotal(response.data.total);
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
      await axios.get('https://localhost:7241/api/Bill/sync-from-qbo');
      Modal.success({
        title: 'Success',
        content: 'Bills synced successfully from QuickBooks!',
      });
      fetchData(page, pageSize, searchTerm);
    } catch (error) {
      Modal.error({
        title: 'Sync Failed',
        content: 'Failed to sync bills from QuickBooks.',
      });
    } finally { 
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const addBills = () => {
    navigate('/home/add-bill');
  };

  useEffect(() => {
    fetchData(page, pageSize, searchTerm);
  }, []);

  const columns = [
    {
      title: 'QBO Bill ID',
      dataIndex: 'qboBillId',
      key: 'qboBillId',
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'displayName'],
      key: 'vendor',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => date.split('T')[0],
    },
    {
      title: 'Bill Amount',
      dataIndex: 'totalAmt',
      key: 'totalAmt',
    },
    {
      title: 'Open Balance',
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        return record.balance > 0 ? (
          <Tag color="red">Not Paid</Tag>
        ) : (
          <Tag color="green">Paid</Tag>
        );
      },
    },
  ];

  return (
    <div>
      <h2>Bill Table</h2>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search by vendor..."
          onSearch={handleSearch}
          enterButton
          allowClear
          style={{ width: 300 }}
        />
        <Button type="primary" onClick={syncBills} loading={loading}>
          Sync Bills from QBO
        </Button>
        <Button type="primary" onClick={addBills} loading={loading}>
          + Add Bill 
        </Button>
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
