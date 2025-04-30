import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  InputNumber,
  Select,
  Card,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Tabs,
  message,
  notification
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Option } = Select;
const { Title } = Typography;
const { TabPane } = Tabs;

const AddBillPage: React.FC = () => {
  const [form] = Form.useForm();
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    fetchVendors();
    fetchAccounts();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get("https://localhost:7241/api/Vendor/sync");
      setVendors(response.data || []);
    } catch {
      notification.error({
        message: 'Error',
        description: 'Failed to load vendors. Please try again.',
        duration: 4,
      });
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get("https://localhost:7241/api/Account/sync");
      setAccounts(response.data || []);
    } catch {
      message.error("Failed to load accounts.");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("https://localhost:7241/api/InvoiceContoller/products");
      setProducts(response.data || []);
    } catch {
      message.error("Failed to load products.");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("https://localhost:7241/api/InvoiceContoller/customers");
      setCustomers(response.data || []);
    } catch {
      message.error("Failed to load customers.");
    }
  };

  const handleProductSelect = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const qty = 1;
      const price = product.price || 0;
      const amount = qty * price;
      form.setFields([
        { name: ["itemLines", index, "qty"], value: qty },
        { name: ["itemLines", index, "price"], value: price },
        { name: ["itemLines", index, "amount"], value: amount > 0 ? amount : 0.01 }
      ]);
      calculateTotal();
    }
  };


  const calculateAmount = (qty: number, price: number) => {
    return qty * price;
  };

  const calculateTotal = () => {
    const lines = form.getFieldValue("lineItems") || [];
    const itemLines = form.getFieldValue("itemLines") || [];

    const totalAmt = [...lines, ...itemLines].reduce((sum: number, item: any) => {
      return sum + (parseFloat(item?.amount) || 0);
    }, 0);

    setTotal(totalAmt);
  };

  const handleSubmit = async (values: any) => {
    const formatDate = (date: moment.Moment) => date.toISOString(); // required format

    const transformLineItem = (item: any, isAccount: boolean = false) => ({
      detailType: isAccount ? "AccountBasedExpenseLineDetail" : item.detailType || "ItemBasedExpenseLineDetail",
      accountId: isAccount ? item.accountId : undefined,
      itemId: !isAccount ? item.detailType : undefined,
      quantity: item.qty || 1,
      unitPrice: item.price || item.rate || 0,
      description: item.description || "",
      amount: Math.max(item.amount || 0.01, 0.01),
    });

    const lineItems = [
      ...(values.lineItems || []).map((item: any) => transformLineItem(item, true)),
      ...(values.itemLines || []).map((item: any) => transformLineItem(item, false)),
    ];

    const payload = {
      vendorId: values.vendorId,
      docNumber: values.docNumber,
      txnDate: formatDate(values.txnDate),
      dueDate: formatDate(values.dueDate),
      lineItems,
    };

    try {
      await axios.post("https://localhost:7241/api/Bill/add-to-qbo", payload);
      notification.success({
        message: 'Success',
        description: 'Bill successfully added to QuickBooks.',
        duration: 4,
      });
      message.success("Bill successfully added to QuickBooks.");
      form.resetFields();
      setTotal(0);
    }catch (error) {
      console.error(error);
      notification.error({
        message: 'Error',
        description: 'Failed to add bill. Please try again.',
        duration: 4,
      });
    }

    
  };

  const generateDocNumber = () => {
    const today = new Date();
    return `BILL-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  };
  return (
    <Card bordered={false}>
      <Title level={3}>Add New Bill</Title>
      <Divider />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={calculateTotal}
        initialValues={{
          lineItems: [{}],
          itemLines: [{}],
          docNumber: generateDocNumber(),
          txnDate: moment(),
          dueDate: moment()
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="vendorId"
              label="Vendor"
              rules={[{ required: true, message: "Vendor is required" }]}
            >
              <Select placeholder="Select a vendor">
                {vendors.map((v) => (
                  <Option key={v.id} value={v.id}>
                    {v.displayName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="docNumber"
              label="Document Number"
              rules={[{ required: true, message: "DocNumber is required" }]}
            >
              <Input placeholder="Enter document number" disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="txnDate"
              label="Transaction Date"
              rules={[{ required: true, message: "Transaction date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} defaultValue={moment()} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true, message: "Due date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} defaultValue={moment()} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Bill Line Items</Divider>

        <Tabs defaultActiveKey="1">
          <TabPane tab="Category Details" key="1">
            <Form.List name="lineItems">
              {(fields, { add, remove }) => (
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {fields.map(({ key, name, fieldKey, ...restField }) => (
                    <Row gutter={16} key={key} align="middle" style={{ marginBottom: 12 }}>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "accountId"]}
                          label="Account"
                          rules={[{ required: true }]}
                        >
                          <Select placeholder="Account">
                            {accounts.map((a) => (
                              <Option key={a.id} value={a.id}>
                                {a.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "description"]}
                          label="Description"
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, "qty"]}
                          label="Qty"
                          initialValue={1}
                        >
                          <InputNumber
                            min={1}
                            onChange={(value) => {
                              if (value) {
                                const rate = form.getFieldValue(["lineItems", name, "rate"]) || 0;
                                const amount = calculateAmount(value, rate);
                                form.setFieldsValue({
                                  lineItems: {
                                    [name]: {
                                      amount,
                                      qty: value,
                                      rate
                                    }
                                  }
                                });
                                calculateTotal();
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, "rate"]}
                          label="Rate"
                          initialValue={0}
                        >
                          <InputNumber
                            min={1}
                            onChange={(value) => {
                              if (value) {
                                const price = form.getFieldValue(["itemLines", name, "price"]) || 0;
                                const amount = calculateAmount(value, price);
                                form.setFieldsValue({
                                  itemLines: {
                                    [name]: {
                                      amount,
                                      qty: value,
                                      price
                                    }
                                  }
                                });
                                calculateTotal();
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "amount"]}
                          label="Amount"
                          initialValue={0}
                        >
                          <InputNumber min={0} disabled />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "customerId"]}
                          label="Customer"
                        >
                          <Select placeholder="Customer">
                            {customers.map((c) => (
                              <Option key={c.quickBooksCustomerId} value={c.quickBooksCustomerId}>
                                {c.displayName}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={1}>
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    Add Category Line
                  </Button>
                </div>
              )}
            </Form.List>
          </TabPane>

          <TabPane tab="Item Details" key="2">
            <Form.List name="itemLines">
              {(fields, { add, remove }) => (
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {fields.map(({ key, name, fieldKey, ...restField }) => (
                    <Row gutter={16} key={key} align="middle" style={{ marginBottom: 12 }}>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "detailType"]}
                          label="Product"
                          rules={[{ required: true }]}
                        >
                          <Select
                            placeholder="Product"
                            onChange={(value) => handleProductSelect(value, name)}
                          >
                            {products.map((p) => (
                              <Option key={p.id} value={p.id}>
                                {p.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "description"]}
                          label="Description"
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, "qty"]}
                          label="Qty"
                          initialValue={1}
                        >
                          <InputNumber
                            min={1}
                            onChange={(value) => {
                              const rate = form.getFieldValue([name, "rate"]);
                              const amount = calculateAmount(value, rate);
                              form.setFieldsValue({
                                [name]: { amount }
                              });
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, "price"]}
                          label="Price"
                          initialValue={0}
                        >
                          <InputNumber
                            min={0}
                            onChange={(value) => {
                              const qty = form.getFieldValue([name, "qty"]);
                              const amount = calculateAmount(qty, value);
                              form.setFieldsValue({
                                [name]: { amount }
                              });
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, "amount"]}
                          label="Amount"
                          initialValue={0}
                        >
                          <InputNumber min={0} disabled />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "customerId"]}
                          label="Customer"
                        >
                          <Select placeholder="Customer">
                            {customers.map((c) => (
                              <Option key={c.id} value={c.id}>
                                {c.displayName}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={1}>
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    Add Item Line
                  </Button>
                </div>
              )}
            </Form.List>
          </TabPane>
        </Tabs>

        <Divider />
        <Row justify="end" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4}>Total: ₹{total.toFixed(2)}</Title>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Submit Bill
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddBillPage;
