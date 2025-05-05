// src/components/QuickBooksItems.tsx
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Table, message, Spin, Button, Typography, Space, notification, Form, Input, Drawer, Select, DatePicker, Modal } from 'antd';
import { DownloadOutlined, PlusOutlined,DatabaseOutlined } from '@ant-design/icons';
import SearchBar from './SearchBar';
import XeroItemDrawer from './XeroItemDrawer';


const { Title } = Typography;

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  type: string;
  incomeAccount: string;
  quantityOnHand: number;
  quickBooksItemId: string;
  quickBooksUserId: string;
  isActive: number;
}

const QuickBooksItems: React.FC = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [editingRecord, setEditingRecord] = useState<Product | null>(null);
  const [xeroDrawerVisible, setXeroDrawerVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const fetchFilteredData = async (type: string | null) => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/Products/xero-get-all-products`, {
        params: {
          type: type?.toLowerCase() || 'all',
          page: pagination.current,
          isTrackedAsInventory: type === 'Inventory' ? true : type === 'Service' ? false : null
        }
      });
      if (response.data) {
        setTableData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch filtered data:', err);
      message.error('Failed to fetch filtered data');
    } finally {
      setLoading(false);
    }
  };

const fetchItemsFromDb = async (page = 1, pageSize = 5) => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/Products/get-all-products`, {
        params: {
          pageNumber: Math.max(1, Number(page)), // Ensure minimum page is 1
          pageSize: Math.max(1, Number(pageSize)), // Ensure minimum pageSize is 1
          search: searchTerm || ''
        }
      });

      const { data } = response;
      const items = data.Data || data.data || (Array.isArray(data) ? data : []);
      
      setTableData(items);
      setPagination({
        ...pagination,
        current: page,
        pageSize: pageSize,
        total: data.Pagination?.TotalCount || data.totalCount || items.length,
      });
      
      return items.length > 0;
    } catch (err) {
      message.error('Failed to fetch item data from DB.');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    fetchItemsFromDb(newPagination.current, newPagination.pageSize);
  };
  
  // Fetch from QuickBooks
  const fetchItemsFromQuickBooks = async () => {
    setLoading(true);
    console.log('Downloading items from QuickBooks...');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/fetch-items-from-quickbooks`);

      const text = await res.text();
      let result;

      try {
        result = JSON.parse(text);
        console.log('QuickBooks response:', result);
      } catch (e) {
        console.error('Invalid JSON from QuickBooks:', text);
        throw new Error(text);  
      }

      if (!res.ok) {
        console.error('Error from QuickBooks:', result);
        throw new Error(result.message || 'Failed to fetch from QuickBooks');
      }

      if (result && result.length > 0) {
        setTableData(result);
        message.success('Items downloaded successfully from QuickBooks.');
      } else {
        message.warning('No new items downloaded from QuickBooks.');
      }
    } catch (err) {
      message.error('Failed to download items from QuickBooks.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemsFromDb();
  }, []);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset to first page when searching and fetch immediately on change
    fetchItemsFromDb(1, pagination.pageSize);
  };
  
  const LoadingOverlay = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}>
      <Spin size="large" />
    </div>
  );

  const handleAddProduct = async (values: any) => {
    const realmId = localStorage.getItem('quickbooks_realmId');
    const accessToken = localStorage.getItem('quickbooks_accessToken');

    try {
      if (editingRecord) {
        // Handle edit - fix the endpoint and data structure
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/Products/add-product`,
          {
            name: values.name,
            description: values.description,
            price: values.price,
            type: selectedType,
            id: editingRecord.id,
            quantityOnHand: selectedType === "Inventory" ? values.initialQuantityOnHand : null,
            asOfDate: selectedType === "Inventory" ? values.asOfDate?.format("YYYY-MM-DD") : null,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              RealmId: realmId,
            },
          }
        );
        message.success('Product updated successfully');
      } else {
        // Handle add
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/Products/add-product`,
          {
            name: values.name,
            description: values.description,
            price: values.price,
            type: selectedType,
            quantityOnHand: selectedType === "Inventory" ? values.initialQuantityOnHand : null,
            asOfDate: selectedType === "Inventory" ? values.asOfDate?.format("YYYY-MM-DD") : null,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              RealmId: realmId,
            },
          }
        );
        message.success('Product added successfully');
      }
      
      setDrawerVisible(false);
      setEditingRecord(null);
      form.resetFields();
      setSearchTerm('');
      fetchItemsFromDb(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error(err);
      notification.error({ message: `Error ${editingRecord ? 'updating' : 'adding'} product` });
    }
  };

  const handleEdit = (record: Product) => {
    setEditingRecord(record);
    
    if (record.platform === 'Xero') {
      // Open Xero drawer for editing
      setXeroDrawerVisible(true);
    } else {
      // Open regular drawer for QuickBooks items
      form.setFieldsValues(record);
      setDrawerVisible(true);
    }
  };

  const handleDelete = async (record: Product) => {
    try {
      if (record.platform === 'QBO') {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/Products/${record.id}`, 
          { data: { isActive: false } }
        );
      } else if (record.platform === 'Xero') {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/Products/${record.quickBooksItemId}`);
      }
      
      message.success('Product deleted successfully');
      fetchItemsFromDb(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error('Failed to delete product');
      console.error(err);
    }
  };

  const filterSection = (
    <div style={{ marginBottom: 16 }}>
      <Select
        style={{ width: 200 }}
        placeholder="Filter by Type"s
        allowClear
        onChange={(value) => {
          setTypeFilter(value);
          fetchFilteredData(value);
        }}
      >
        <Select.Option value="Inventory">Inventory</Select.Option>
        <Select.Option value="Service">Service</Select.Option>
      </Select>
    </div>
  );


  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id'},
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    // { title: 'Price', dataIndex: 'price', key: 'price', 
    //   render: (price: any) => {
    //     // Convert string to number if needed, then format
    //     const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    //     return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    //   }
    // },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Platform', dataIndex: 'platform', key: 'platform',
      render: (platform: string, record: any) => {
        if (platform === 'Xero' && record.code) {
          return `${platform} (${record.code})`;
        }
        return platform;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record: Product) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              Modal.confirm({
                title: 'Are you sure you want to delete this product?',
                content: 'This action cannot be undone.',
                okText: 'Yes',
                okType: 'danger',
                cancelText: 'No',
                onOk: () => handleDelete(record)
              });
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    }
  ];

  // Add this new function after other fetch functions
  const fetchItemsFromXero = async () => {
    setLoading(true);
    try {
      await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/Products/xero-get-all-products`, {
        params: {
          type: 'inventory'
        }
      });
      message.success('Items synced successfully from Xero.');
    } catch (err) {
      message.error('Failed to sync items from Xero.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update the buttons section in the return statement
  return (
    <div style={{ padding: '2rem' }}>
    {loading && <LoadingOverlay />}
    <Title level={3}>QuickBooks Items</Title>

    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {/* <div style={{ width: '100%', display: 'flex', gap: '12px' }}>
          <SearchBar onSearch={handleSearch} searchTerm={searchTerm} />
          {filterSection}
        </div> */}
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={fetchItemsFromQuickBooks}
          loading={loading}
        >
          Download from QuickBooks
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={fetchItemsFromXero}
          loading={loading}
        >
          Download from Xero
        </Button>
        <Button
          type="default"
          icon={<DatabaseOutlined />}
          onClick={() => fetchItemsFromDb(1, pagination.pageSize)}
          loading={loading}
        >
          Fetch from Database
        </Button>
        {/* <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerVisible(true)}
        >
          Add Item
        </Button> */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setXeroDrawerVisible(true)}
        >
          Add Item 
        </Button>
      </div>
    </div>

    {loading ? (
      <Spin size="large" />
    ) : (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Table
          dataSource={tableData}
          columns={columns}
          rowKey={(record) => record.id}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['5','10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize
              }));
              fetchItemsFromDb(page, pageSize);
            },
          }}
          scroll={{ x: 'max-content', y: 500 }}
          bordered
          className="accounts-table"
        />
      </div>
    )}

      {/* Add Item Drawer */}
      <Drawer
        title={editingRecord ? "Edit Item" : "Add New Item"}
        placement="right"
        closable
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleAddProduct}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>

          <Form.Item name="price" label="Price" >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select type"
              onChange={(value) => setSelectedType(value)}
            >
              <Select.Option value="Inventory">Inventory</Select.Option>
              <Select.Option value="Service">Service</Select.Option>
            </Select>
          </Form.Item>

          {selectedType === 'Inventory' && (
            <>
              <Form.Item
                name="initialQuantityOnHand"
                label="Initial Quantity on Hand"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <Input type="number" />
              </Form.Item>

              <Form.Item
                name="asOfDate"
                label="As of Date"
                rules={[{ required: true, message: 'Please select a date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <XeroItemDrawer 
        visible={xeroDrawerVisible}
        onClose={() => {
          setXeroDrawerVisible(false);
          setEditingRecord(null);
        }}
        onSuccess={() => fetchItemsFromDb(pagination.current, pagination.pageSize)}
        editingRecord={editingRecord}
      />
    </div>
  );
};

export default QuickBooksItems;