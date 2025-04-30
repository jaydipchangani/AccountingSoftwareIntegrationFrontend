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
import { useParams } from 'react-router-dom';
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

const EditInvoiceForm: React.FC = () => {
  const { quickBooksId } = useParams(); // e.g., /edit-invoice/:quickBooksId
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
  
        const [productRes, customerRes, invoiceRes] = await Promise.all([
          fetch('https://localhost:7241/api/InvoiceContoller/products'),
          fetch('https://localhost:7241/api/InvoiceContoller/customers'),
          fetch(`https://localhost:7241/api/InvoiceContoller/${quickBooksId}`),
        ]);
  
        const [productsData, customersData, invoiceData] = await Promise.all([
          productRes.json(),
          customerRes.json(),
          invoiceRes.json(),
        ]);
  
        setProducts(productsData);
        setCustomers(customersData);
  
        const invoice = invoiceData.Invoice;
  
        const lineItems = invoice.Line?.filter((line: any) => line.DetailType === 'SalesItemLineDetail') || [];
  
        const lines = lineItems.map((line: any) => {
          const productId = parseInt(line.SalesItemLineDetail.ItemRef.value);
          const product = productsData.find((p: Product) => p.id === productId);
  
          return {
            productId,
            description: product?.description || line.Description || '',
            qty: line.SalesItemLineDetail.Qty,
            price: line.SalesItemLineDetail.UnitPrice,
            amount: line.Amount,
          };
        });
  
        const customerId = invoice.CustomerRef?.value;
  
        form.setFieldsValue({
          customerRef: customerId,
          lines,
          memo: invoice.CustomerMemo?.value,
          docNumber: invoice.DocNumber,
          dueDate: invoice.DueDate,
        });
        
  
        setSelectedCustomer(customerId);
        calculateTotal(lines);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        message.error('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchInitialData();
  }, [quickBooksId]);
  
  
  
  

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
        value: String(values.customerRef),
      },
    };

    try {
      await axios.post(
        `https://localhost:7241/api/InvoiceContoller/update`,
        payload
      );
      message.success('Invoice updated successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to update invoice');
    }
  };

  if (loading) return <Spin tip="Loading invoice data..." />;

  return (
    <Card style={{ maxWidth: 1000, margin: 'auto', marginTop: 40 }}>
      <Title level={3}>Edit Invoice</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
      >
        <Form.Item
          label="Customer"
          name="customerRef"
          rules={[{ required: true, message: 'Please select a customer' }]}
        >
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
                      <Select placeholder="Product">
                        {products.map((product) => (
                          <Option key={product.id} value={product.id}>
                            {product.name}
                          </Option>
                        ))}
                      </Select>
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
            Update Invoice
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditInvoiceForm;
