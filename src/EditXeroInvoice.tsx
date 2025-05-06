import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Table, InputNumber, Space, Typography, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

// Use the same interfaces as XeroInvoice
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

const EditXeroInvoicePage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const editingInvoice = location.state?.invoice;
  
  const [customers, setCustomers] = useState<XeroCustomer[]>([]);
  const [products, setProducts] = useState<XeroProduct[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editingInvoice) {
      message.error('No invoice data found');
      navigate('/home/invoice');
      return;
    }

    const fetchInvoiceDetails = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/XeroInvoice/${editingInvoice.quickBooksId}`
        );

        if (response.ok) {
          const invoiceData = await response.json();
          // Extract the first invoice from the Invoices array
          const xeroInvoice = invoiceData.Invoices?.[0];
          
          if (xeroInvoice) {
            // Store the updated invoice data in location state
            const updatedInvoice = {
              ...editingInvoice,
              xeroInvoiceData: xeroInvoice
            };
            navigate('', { state: { invoice: updatedInvoice }, replace: true });
          } else {
            message.error('No invoice details found');
          }
        } else {
          message.error('Failed to fetch invoice details');
        }
      } catch (error) {
        message.error('Error fetching invoice details');
      }
    };

    fetchInvoiceDetails();
    fetchCustomers();
    fetchProducts();
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
    const addItem = () => {
    setItems([...items, {
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
 
 
  useEffect(() => {
    if (editingInvoice && customers.length > 0) {
      const xeroInvoice = editingInvoice.xeroInvoiceData;
      
      if (xeroInvoice) {
        // Find the customer by ContactID from the Xero invoice
        const contactId = customers.find(c => 
          c.contactID === xeroInvoice.Contact?.ContactID
        )?.id;

        // Pre-fill the form with invoice data from Xero API
        form.setFieldsValue({
          contactId: contactId,
          reference: xeroInvoice.Reference,
          issueDate: dayjs(xeroInvoice.DateString),
          dueDate: dayjs(xeroInvoice.DueDateString),
          total: xeroInvoice.Total
        });

        // Transform and set line items from Xero API
        if (xeroInvoice.LineItems && xeroInvoice.LineItems.length > 0) {
          const transformedItems = xeroInvoice.LineItems.map((item: any) => ({
            itemId: item.LineItemID || '',
            description: item.Description || '',
            quantity: item.Quantity || 0,
            unitPrice: item.UnitAmount || 0,
            accountCode: item.AccountCode || '',
            taxRate: item.TaxType || '',
            amount: item.LineAmount || 0,
            discount: 0,
            taxAmount: item.TaxAmount || 0,
            project: ''
          }));

          setItems(transformedItems);
        }
      } else {
        // Fallback to the original data if Xero API data is not available
        form.setFieldsValue({
          contactId: customers.find(c => c.quickBooksCustomerId === editingInvoice.quickBooksId)?.id,
          reference: editingInvoice.customerMemo,
          issueDate: dayjs(editingInvoice.date),
          dueDate: dayjs(editingInvoice.dueDate),
          total: editingInvoice.totalAmt
        });

        // Transform and set line items from original data
        if (editingInvoice.lineItems && editingInvoice.lineItems.length > 0) {
          const transformedItems = editingInvoice.lineItems.map((item: any) => ({
            itemId: item.itemId || '',
            description: item.description || '',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || item.unitAmount || 0,
            accountCode: item.accountCode || '',
            taxRate: item.taxRate || item.taxType || '',
            amount: item.amount || item.lineAmount || 0,
            discount: 0,
            taxAmount: item.taxAmount || 0,
            project: ''
          }));

          setItems(transformedItems);
        }
      }
    }
  }, [editingInvoice, customers, form]);
  
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

  const removeItem = (index: number) => {
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
    calculateTotals(newItems);
  };
  // Copy all the same functions from XeroInvoice but modify handleSubmit
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
      // Get the Xero invoice data if available
      const xeroInvoice = editingInvoice.xeroInvoiceData;
      
      // Make sure we have a valid InvoiceID
      if (!xeroInvoice?.InvoiceID) {
        throw new Error('Invoice ID is missing');
      }
      
      const payload = {
        invoiceId: xeroInvoice.InvoiceID,
        reference: values.reference,
        date: values.issueDate.format('YYYY-MM-DD'),
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        status: xeroInvoice.Status || editingInvoice.status,
        InvoiceID: xeroInvoice.InvoiceID,
        Type: xeroInvoice.Type || 'ACCREC',
        lineItems: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitAmount: item.unitPrice,
          accountCode: item.accountCode,
          taxType: item.taxRate,
          lineAmount: item.amount
        }))
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/XeroInvoice/${xeroInvoice.InvoiceID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        Modal.success({
          title: 'Success',
          content: 'Invoice updated successfully',
          onOk: () => navigate('/home/invoice')
        });
      } else {
        const errorData = await response.json();
        Modal.error({
          title: 'Update Failed',
          content: errorData.message || 'Failed to update invoice'
        });
      }
    } catch (error) {
      Modal.error({
        title: 'Error',
        content: error instanceof Error ? error.message : 'An error occurred while updating the invoice'
      });
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
      <Title level={2}>Edit Xero Invoice</Title>
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

export default EditXeroInvoicePage;