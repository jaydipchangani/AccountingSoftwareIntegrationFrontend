import React, { useEffect, useState } from 'react';
import {
  Form,
  InputNumber,
  Select,
  Button,
  Spin,
  Card,
  Typography,
  Input,
  Row,
  Col,
  message,
} from 'antd';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

interface Customer {
  quickBooksCustomerId: string;
  displayName: string;
  email: string;
  billingLine1: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
}

const AddInvoiceForm: React.FC = () => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('https://localhost:7241/api/InvoiceContoller/products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        message.error('Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchCustomers = async () => {
      try {
        const res = await fetch('https://localhost:7241/api/InvoiceContoller/customers');
        const data = await res.json();
        setCustomers(data);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
        message.error('Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchProducts();
    fetchCustomers();
  }, []);

  useEffect(() => {
    const selected = customers.find((c) => c.quickBooksCustomerId === selectedCustomer);
    setCustomerDetails(selected || null);
  }, [selectedCustomer, customers]);

  const calculateTotal = (lines: any[]) => {
    const total = lines.reduce((sum, line) => {
      const amount = line.qty * line.price || 0;
      return sum + amount;
    }, 0);
    setTotalAmount(total);
  };

  const onValuesChange = (_: any, allValues: any) => {
    const lines = allValues.lines || [];
    lines.forEach((line: any, index: number) => {
      if (line.productId) {
        const product = products.find((p) => p.id === line.productId);
        if (product) {
          if (!line.description) line.description = product.description;
          if (!line.price) line.price = product.price;
        }
        line.amount = (line.qty || 1) * (line.price || 0);
      }
    });
    form.setFieldsValue({ lines });
    calculateTotal(lines);
  };

  const onFinish = async (values: any) => {
    const payload = {
      Line: values.lines.map((line: any) => ({
        DetailType: 'SalesItemLineDetail',
        Amount: line.amount,
        SalesItemLineDetail: {
          ItemRef: {
            value: String(line.productId),
          },
          Qty: line.qty,
          UnitPrice: line.price,
        },
      })),
      CustomerRef: {
        value: String(values.customerRef), // From dropdown
      },
    };

    try {
      await axios.post(
        'https://localhost:7241/api/InvoiceContoller/add-invoice',
        payload
      );
      message.success('Invoice created successfully!');
      form.resetFields();
      setSelectedCustomer('');
      setTotalAmount(0);
    } catch (err) {
      console.error(err);
      message.error('Failed to create invoice');
    }
  };

  return (
    <Card style={{ maxWidth: 1000, margin: 'auto', marginTop: 40 }}>
      <Title level={3}>Create Invoice</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
        initialValues={{ lines: [{ productId: null, qty: 1, price: 0, amount: 0 }] }}
      >
        <Form.Item
          label="Customer"
          name="customerRef"
          rules={[{ required: true, message: 'Please select a customer' }]}
        >
          {loadingCustomers ? (
            <Spin />
          ) : (
            <Select
              placeholder="Select a customer"
              onChange={(val) => setSelectedCustomer(val)}
              value={selectedCustomer}
            >
              {customers.map((customer) => (
                <Option key={customer.quickBooksCustomerId} value={customer.quickBooksCustomerId}>
                  {customer.displayName}
                </Option>
              ))}
            </Select>
          )}
        </Form.Item>

        {customerDetails && (
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Email">
                <Input value={customerDetails.email} readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Billing Address Line 1">
                <Input value={customerDetails.billingLine1} readOnly />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="City">
                <Input value={customerDetails.billingCity} readOnly />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="State">
                <Input value={customerDetails.billingState} readOnly />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Postal Code">
                <Input value={customerDetails.billingPostalCode} readOnly />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.List name="lines">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={12} key={key} align="middle" style={{ marginBottom: 16 }}>
                  <Col span={5}>
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      rules={[{ required: true, message: 'Select a product' }]}
                    >
                      {loadingProducts ? (
                        <Spin />
                      ) : (
                        <Select placeholder="Product">
                          {products.map((product) => (
                            <Option key={product.id} value={product.id}>
                              {product.name}
                            </Option>
                          ))}
                        </Select>
                      )}
                    </Form.Item>
                  </Col>

                  <Col span={5}>
                    <Form.Item {...restField} name={[name, 'description']} rules={[{ required: true }]}>
                      <Input placeholder="Description" />
                    </Form.Item>
                  </Col>

                  <Col span={3}>
                    <Form.Item {...restField} name={[name, 'qty']} rules={[{ required: true }]}>
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>

                  <Col span={3}>
                    <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>

                  <Col span={3}>
                    <Form.Item {...restField} name={[name, 'amount']} rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} readOnly />
                    </Form.Item>
                  </Col>

                  <Col span={3}>
                    {fields.length > 1 && (
                      <Button danger onClick={() => remove(name)}>
                        Remove
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block>
                  + Add Line
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Title level={4}>Total: ₹ {totalAmount.toFixed(2)}</Title>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit Invoice
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddInvoiceForm;
