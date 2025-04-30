  import React, { useEffect, useState } from 'react';
  import { Select, Input, Form, Card, Typography, Button, Space, Row, Col } from 'antd';
  import ProductDropdown from './ProductDropdown';

  const { Option } = Select;
  const { Title } = Typography;

  interface Customer {
    quickBooksCustomerId: string;
    displayName: string;
    email: string;
    billingLine1: string;
    billingCity: string;
    billingState: string;
    billingPostalCode: string;
  }

  const CustomerDropDown: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [customerDetails, setCustomerDetails] = useState({
      email: '',
      billingLine1: '',
      city: '',
      state: '',
      postalCode: '',
    });

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

    useEffect(() => {
      const customer = customers.find((c) => c.quickBooksCustomerId === selectedCustomer);
      if (customer) {
        setCustomerDetails({
          email: customer.email,
          billingLine1: customer.billingLine1,
          city: customer.billingCity,
          state: customer.billingState,
          postalCode: customer.billingPostalCode,
        });
      }
    }, [selectedCustomer, customers]);


    return (
  <Card style={{ maxWidth: '100%', margin: 'auto',  overflowX: 'hidden' }}>
        <Title level={4}>Invoice Form</Title>

        <Form layout="vertical">
          <Form.Item label="Customer">
            <Select
              value={selectedCustomer}
              onChange={(value) => setSelectedCustomer(value)}
              placeholder="Select a customer"
            >
              <Option value="" disabled>Select a customer</Option>
              {customers.map((customer) => (
                <Option key={customer.quickBooksCustomerId} value={customer.quickBooksCustomerId}>
                  {customer.displayName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          

          <Row gutter={16}>
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
                <Input value={customerDetails.city} readOnly />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="State">
                <Input value={customerDetails.state} readOnly />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Postal Code">
                <Input value={customerDetails.postalCode} readOnly />
              </Form.Item>
            </Col>
          </Row>

        </Form>
      </Card>
    );
  };

  export default CustomerDropDown;
