import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Table, InputNumber, Space, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface XeroCustomer {
    contactID: string;
    id: number;
  quickBooksCustomerId: string;
  quickBooksUserId: string;
  company: string;
  displayName: string;
  }

  interface XeroProduct {
    id: number;
    name: string;
    description: string;
    price: string;
    type: string;
    platform: string;
    salesAccountCode: string;
  }

interface InvoiceItem {
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  accountCode: string;
  taxRate: string;
  taxAmount: number;
  project: string;
  amount: number;
}

const XeroInvoicePage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<XeroCustomer[]>([]);
  const [products, setProducts] = useState<XeroProduct[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    // Initialize with one empty item
    setItems([{
      itemId: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      accountCode: '',
      taxRate: '',
      taxAmount: 0,
      project: '',
      amount: 0
    }]);
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Xero/active`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      message.error('Failed to fetch customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Products/active`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      message.error('Failed to fetch products');
    }
  };

  const handleProductSelect = (value: number, index: number) => {
    const product = products.find(p => p.id === value);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        itemId: product.id.toString(),
        description: product.description,
        unitPrice: parseFloat(product.price) || 0,
        accountCode: product.salesAccountCode || '',
       
        quantity: 1,
        discount: 0,
        taxAmount: 0,
        project: '',
        amount: parseFloat(product.price) || 0
      };
      setItems(newItems);
      calculateTotals(newItems);
    }
  };

  const calculateTotals = (currentItems: InvoiceItem[]) => {
    const total = currentItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
      const tax = subtotal * (Number(item.taxRate) || 0) / 100;
      item.taxAmount = tax;
      item.amount = subtotal + tax;
      return sum + item.amount;
    }, 0);
    form.setFieldsValue({ total });
  };

  const addItem = () => {
    setItems([...items, {} as InvoiceItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
    calculateTotals(newItems);
  };

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      message.error('Please add at least one item to the invoice');
      return;
    }

    const hasEmptyItems = items.some(item => !item.itemId || !item.quantity || !item.unitPrice);
    if (hasEmptyItems) {
      message.error('Please fill in all required item fields');
      return;
    }
    
    setLoading(true);
    try {
      const selectedCustomer = customers.find(c => c.id === values.contactId);
      // Get the invoice type from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const invoiceType = urlParams.get('type') || 'ACCREC'; // Default to ACCREC if not specified
      
      const payload = {
        contactId: selectedCustomer?.contactID || '',
        reference: values.reference,
        date: values.issueDate.format('YYYY-MM-DD'),
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        type: invoiceType, // Set the type based on URL parameter
        lineItems: items.map(item => ({
          Description: item.description,
          Quantity: item.quantity,
          UnitAmount: item.unitPrice,
          AccountCode: item.accountCode,
          TaxType: item.taxRate,
          LineAmount: item.amount
        }))
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/XeroInvoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success(invoiceType === 'ACCPAY' ? 'Bill created successfully' : 'Invoice created successfully');
        navigate(invoiceType === 'ACCPAY' ? '/home/bills' : '/home/invoice');
      } else {
        message.error(invoiceType === 'ACCPAY' ? 'Failed to create bill' : 'Failed to create invoice');
      }
    } catch (error) {
      message.error(urlParams.get('type') === 'ACCPAY' ? 'Error creating bill' : 'Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
        title: 'Item',
        dataIndex: 'itemId',
        render: (_: any, __: any, index: number) => (
          <Select
            style={{ width: '100%' }}
            onChange={(value) => handleProductSelect(value, index)}
            listHeight={400}
            dropdownStyle={{ minWidth: '300px' }}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children?.toString()?.toLowerCase() ?? '').includes(input.toLowerCase())
            }
          >
            {products.map(product => (
              <Option key={product.id} value={product.id}>
                {product.name}
              </Option>
            ))}
          </Select>
        )
      },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => {
            const newItems = [...items];
            newItems[index].description = e.target.value;
            setItems(newItems);
          }}
        />
      )
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      width: 80,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => {
            const newItems = [...items];
            newItems[index].quantity = val || 0;
            setItems(newItems);
            calculateTotals(newItems);
          }}
        />
      )
    },
    {
      title: 'Price',
      dataIndex: 'unitPrice',
      width: 100,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => {
            const newItems = [...items];
            newItems[index].unitPrice = val || 0;
            setItems(newItems);
            calculateTotals(newItems);
          }}
        />
      )
    },
    // {
    //   title: 'Disc %',
    //   dataIndex: 'discount',
    //   width: 80,
    //   render: (value: number, _: any, index: number) => (
    //     <InputNumber
    //       value={value}
    //       onChange={(val) => {
    //         const newItems = [...items];
    //         newItems[index].discount = val || 0;
    //         setItems(newItems);
    //         calculateTotals(newItems);
    //       }}
    //     />
    //   )
    // },
    {
      title: 'Account',
      dataIndex: 'accountCode',
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => {
            const newItems = [...items];
            newItems[index].accountCode = e.target.value;
            setItems(newItems);
          }}
        />
      )
    },
    // {
    //   title: 'Tax Rate',
    //   dataIndex: 'taxRate',
    //   render: (text: string, _: any, index: number) => (
    //     <Input
    //       value={text}
    //       onChange={(e) => {
    //         const newItems = [...items];
    //         newItems[index].taxRate = e.target.value;
    //         setItems(newItems);
    //         calculateTotals(newItems);
    //       }}
    //     />
    //   )
    // },
    // {
    //   title: 'Tax Amount',
    //   dataIndex: 'taxAmount',
    //   render: (value: number) => value?.toFixed(2)
    // },
    // {
    //   title: 'Project',
    //   dataIndex: 'project',
    //   render: (text: string, _: any, index: number) => (
    //     <Input
    //       value={text}
    //       onChange={(e) => {
    //         const newItems = [...items];
    //         newItems[index].project = e.target.value;
    //         setItems(newItems);
    //       }}
    //     />
    //   )
    // },
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (value: number) => value?.toFixed(2)
    },
    {
      title: '',
      key: 'action',
      render: (_: any, __: any, index: number) => (
        <Button type="link" danger onClick={() => removeItem(index)}>
          <DeleteOutlined />
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Create Xero Invoice</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          issueDate: dayjs(),
          dueDate: dayjs()
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', gap: '24px' }}>
          <Form.Item
              name="contactId"
              label="Contact"
              rules={[{ required: true, message: 'Please select a contact' }]}
              style={{ width: '300px' }}
            >
              <Select 
                placeholder="Select contact"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children?.toString()?.toLowerCase() ?? '').includes(input.toLowerCase())
                }
              >
                {customers.map(customer => (
                  <Option 
                    key={customer.id} 
                    value={customer.id}
                  >
                    {customer.displayName}
                  </Option>
                ))}
              </Select>
            </Form.Item>


            <Form.Item
              name="reference"
              label="Reference"
              rules={[{ required: true }]}
              style={{ width: '300px' }}
            >
              <Input />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <Form.Item
              name="issueDate"
              label="Issue Date"
              rules={[{ required: true }]}
            >
              <DatePicker />
            </Form.Item>

            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true }]}
            >
              <DatePicker />
            </Form.Item>
          </div>

          <Table
            columns={columns}
            dataSource={items}
            pagination={false}
            rowKey={(_, index) => index.toString()}
          />

          <Button type="dashed" onClick={addItem} icon={<PlusOutlined />}>
            Add Item
          </Button>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Form.Item name="total" label="Total Amount">
              <InputNumber
                style={{ width: '200px' }}
                readOnly
                formatter={value => `INR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button onClick={() => navigate('/home/invoice')}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save and Close
            </Button>
          </div>
        </Space>
      </Form>
    </div>
  );
};

export default XeroInvoicePage;