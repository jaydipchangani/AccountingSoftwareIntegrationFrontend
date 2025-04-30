// src/components/QuickBooksItems.tsx
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Table, message, Spin, Button, Empty, Drawer, Form, Input, Divider, Popconfirm,Typography, Space,notification, Select ,DatePicker } from 'antd';
import { DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined ,CheckOutlined, StopOutlined} from '@ant-design/icons';
import SearchBar from './SearchBar';
import search from 'antd/es/transfer/search';

const { Search } = Input;
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
  const [pagedData, setPagedData] = useState<any[]>([]);
const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
});
const [searchTerm, setSearchTerm] = useState('');
const [loading, setLoading] = useState(false);
const [isDataFetched, setIsDataFetched] = useState(false);
const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<Product>>({});
  const [allData, setAllData] = useState<any[]>([]);


  

  const fetchItemsFromDb = async (
    page = 1,
    pageSize = 10,
    search = searchTerm
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/Products`
      );
  
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error(text);
      }
  
      if (!res.ok) throw new Error(result.message || 'Failed to fetch data');
  
      // Store all data
      setAllData(result);
  
      // Filter data based on search term
      const filteredData = result.filter((item: any) =>
        Object.values(item).some(
          value =>
            value &&
            value.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
  
      // Calculate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(0, pagination.pageSize);
  setPagedData(paginatedData);
  setPagination({
    ...pagination,
    current: 1,
    total: filteredData.length,
  });

  
      return result && result.length > 0;
    } catch (err) {
      message.error('Failed to fetch item data from DB.');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch from QuickBooks
  const fetchItemsFromQuickBooks = async () => {
    setLoading(true);
    console.log('➡️ Downloading items from QuickBooks...');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/fetch-items-from-quickbooks`);

      const text = await res.text();
      let result;

      try {
        result = JSON.parse(text);
        console.log('📦 QuickBooks response:', result);
      } catch (e) {
        console.error('❌ Invalid JSON from QuickBooks:', text);
        throw new Error(text);  
      }

      if (!res.ok) {
        console.error('❌ Error from QuickBooks:', result);
        throw new Error(result.message || 'Failed to fetch from QuickBooks');
      }

      if (result && result.length > 0) {
        setPagedData(result);
        console.log("📦 Products from backend:", result.data);

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


  const handleTableChange = (pagination: any) => {
    const { current, pageSize } = pagination;
    setPagination({ ...pagination });
    fetchItemsFromDb(current, pageSize, searchTerm);
  };
  

  useEffect(() => {
    fetchItemsFromDb(pagination.current, pagination.pageSize, searchTerm);
  }, []);
  

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Filter from all data
    const filteredData = allData.filter((item: any) =>
      Object.values(item).some(
        fieldValue =>
          fieldValue &&
          fieldValue.toString().toLowerCase().includes(value.toLowerCase())
      )
    );

    const paginatedData = filteredData.slice(0, pagination.pageSize);
    setPagedData(paginatedData);
    setPagination({
      ...pagination,
      current: 1,
      total: filteredData.length,
    });
  };

  const fetchProductsFromDb = async (page = 1, pageSize = 10, search = searchTerm) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/product/fetch-product-from-db-paginated?page=${page}&pageSize=${pageSize}&searchTerm=${encodeURIComponent(search)}`
      );
  
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error(text);
      }
      if (!res.ok) throw new Error(result.message || 'Failed to fetch product data');
  
      setPagedData(result.data);
      setPagination({
        current: result.currentPage,
        pageSize: result.pageSize,
        total: result.totalRecords,
      });
      setIsDataFetched(true);
    } catch (err) {
      message.error('Failed to fetch product data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
    
      
  useEffect(() => {
    const init = async () => {
      const hasData = await fetchItemsFromDb();
      if (!hasData) {
        message.info("No items found in DB. Downloading from QuickBooks...");
        await fetchItemsFromQuickBooks();
      }
      await fetchAccounts();
    };
    init();
  }, []);
    
    

    const deleteProduct = async (productId: number, currentStatus: number) => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/products/delete-product/${productId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isActive: currentStatus === 1 ? false : true, // toggle status
            }),
          }
        );
    
        if (!res.ok) throw new Error('Failed to update product status');
    
        message.success(`Product ${currentStatus === 1 ? 'deactivated' : 'activated'} successfully.`);
        fetchProductsFromDb(pagination.current, pagination.pageSize, searchTerm);
      } catch (err) {
        console.error(err);
        message.error('Failed to update product status.');
      }
    };
    

  const fetchAccounts = async () => {
    const realmId = localStorage.getItem('quickbooks_realmId');
    const accessToken = localStorage.getItem('quickbooks_accessToken');
  
    if (!realmId || !accessToken) {
      console.error('❌ Missing realmId or accessToken');
      return;
    }
  
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/QuickBooks/sync-income-accounts?realmId=${realmId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      // ✅ Log all accounts
      console.log('✅ All Accounts:', response.data);
  
      // Example: setAccounts(response.data);
  
    } catch (error) {
      console.error('❌ Failed to fetch accounts:', error.response?.data || error.message);
    }
  };
  
  
  

  
  const handleAddProduct = async (values: any) => {
    const realmId = localStorage.getItem('quickbooks_realmId');
    const accessToken = localStorage.getItem('quickbooks_accessToken');

    try {
      const payload = selectedType === "Inventory"
        ? {
            Name: values.name,
            Type: "Inventory",
            Sku: values.sku,
            Description: values.description,
            TrackQtyOnHand: true,
            QtyOnHand: values.quantityOnHand,
            InvStartDate: values.asOfDate?.format("YYYY-MM-DD"),
            IncomeAccount: "Sales of Product Income",  // Name string
              AssetAccount: "Inventory Asset",
              ExpenseAccount: "Cost of Goods Sold",
            UnitPrice: values.salesPrice,
            PurchaseCost: values.cost,
          }
        : {
            Name: values.name,
            Type: "Service",
            Sku: values.sku,
            Description: values.salesDescription,
            IncomeAccountRef: {
              name: values.incomeAccountName,
            },
            UnitPrice: values.salesPrice,
          };

          await axios.post(
            "https://localhost:7241/api/Products/add-product",
            {
              Name: values.name,
              Description: values.description,
              Type: selectedType,
              Price: values.salesPrice,
          
              IncomeAccountId: "79",  // ID string
              AssetAccountId: "81",    // ID string (for inventory)
              ExpenseAccountId: "80",
          
              IncomeAccount: "Sales of Product Income",  // Name string
              AssetAccount: "Inventory Asset",
              ExpenseAccount: "Cost of Goods Sold",
          
              QuantityOnHand: selectedType === "Inventory" ? values.quantityOnHand : null,
              AsOfDate: selectedType === "Inventory" ? values.asOfDate?.format("YYYY-MM-DD") : null,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                RealmId: realmId,
              },
            }
          );
          
      
    } catch (err) {
      console.error(err);
      notification.error({ message: 'Error adding product' });
    }
  };
  
  const handleEditClick = (record: Product) => {
    setEditingRowId(record.id);
    setEditedValues({
      name: record.name,
      description: record.description,
      price: record.price,
    });
  };

  const handleUpdate = async (productId: number) => {
  try {
    await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/products/update-product/${productId}`, editedValues);
    message.success('Product updated successfully');
    setEditingRowId(null);
    fetchProductsFromDb(pagination.current, pagination.pageSize, searchTerm); // Refresh
  } catch (error) {
    console.error(error);
    message.error('Failed to update product');
  }
};


  


const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Description', dataIndex: 'description', key: 'description' },
  { title: 'Price', dataIndex: 'price', key: 'price', 
    render: (price: number) => price?.toFixed(2) || '0.00' 
  },
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Income Account', dataIndex: 'incomeAccount', key: 'incomeAccount' },

  // ... rest of the columns
];

  const updateProduct = async (productId, values, accessToken, realmId) => {
    try {
      await axios.put(
        `https://localhost:7241/api/Products/edit-product/${productId}`,
        {
          Id: productId,
          Name: values.name,
          Description: values.description,
          Type: values.type,
          UnitPrice: values.price,
          IncomeAccountId: values.incomeAccountId,
          AssetAccountId: values.assetAccountId,
          ExpenseAccountId: values.expenseAccountId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            RealmId: realmId,
          },
          params: {
            realmId, // Also passed as a query string
          },
        }
      );
  
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message);
      alert("Error updating product: " + (error.response?.data || error.message));
    }
  };
  

  return (
    <div style={{ padding: '2rem' }}>
      <Title level={3}>QuickBooks Items</Title>

      <Space style={{ marginBottom: 16 }}>
        <SearchBar onSearch={handleSearch} searchTerm={searchTerm} />
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={fetchItemsFromQuickBooks}
          loading={loading}
        >
          Download from QuickBooks
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchItemsFromDb()}
          loading={loading}
        >
          Refresh DB
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerVisible(true)}
        >
          Add Item
        </Button>
      </Space>

      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
  dataSource={pagedData}
  columns={columns}
  rowKey={(record) => record.id}
  pagination={{
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['5', '10', '20', '50', '100'],
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    onChange: (page, pageSize) => {
      fetchItemsFromDb(page, pageSize, searchTerm);
    },
    onShowSizeChange: (current, size) => {
      fetchItemsFromDb(1, size, searchTerm);
    },
  }}
  scroll={{ y: 400 }}
  bordered
  className="accounts-table"
/>
      )}

      {/* ➕ Drawer Form */}
      <Drawer
  title="Add New Item"
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
          <Select.Option value="NonInventory">NonInventory</Select.Option>
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


    </div>
  );
};

export default QuickBooksItems;
