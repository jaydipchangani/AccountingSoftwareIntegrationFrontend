import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, notification, message } from 'antd';
import axios from 'axios';

interface XeroItemDrawerProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingRecord?: any;
  }
  
  interface XeroAccount {
    code: string;
    name: string;
    accountType: string;
  }
  
  const XeroItemDrawer: React.FC<XeroItemDrawerProps> = ({ visible, onClose, onSuccess, editingRecord }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [itemType, setItemType] = useState<string>('Service');
    const [xeroAccounts, setXeroAccounts] = useState<XeroAccount[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [inventoryAccounts, setInventoryAccounts] = useState<XeroAccount[]>([]);

    useEffect(() => {
        if (visible) {
          form.resetFields();
          
          if (editingRecord && editingRecord.platform === 'Xero') {
            // Set form values from editing record
            form.setFieldsValue({
              type: editingRecord.type || 'Service',
              code: editingRecord.code || '',
              name: editingRecord.name || '',
              description: editingRecord.description || '',
              assetAccount: editingRecord.assetAccount || (editingRecord.type === 'Inventory' ? '630' : ''),
              purchaseCOGSAccountCode: editingRecord.purchaseCOGSAccountCode || '',
              purchaseUnitPrice: editingRecord.purchaseUnitPrice || '',
              salesUnitPrice: editingRecord.salesUnitPrice || '',
              salesAccountCode: editingRecord.salesAccountCode || ''
            });
            
            // Update item type state
            setItemType(editingRecord.type || 'Service');
          }
        }
      }, [visible, editingRecord, form]);
    
      useEffect(() => {
        if (visible) {
          fetchXeroAccounts();
        }
      }, [visible]);
    
      useEffect(() => {
        if (itemType === 'Inventory') {
          form.setFieldsValue({ assetAccount: "630" });
        }
      }, [itemType, form]);
    
      const fetchXeroAccounts = async () => {
        setAccountsLoading(true);
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/XeroAccounts/fetch-chart-of-accounts-from-xero`);
          if (response.data) {
            // Filter accounts for inventory type
            const inventoryOnly = response.data.filter((account: XeroAccount) => 
              account.accountType && account.accountType.toUpperCase() === 'INVENTORY'
            );
            setInventoryAccounts(inventoryOnly);
            setXeroAccounts(response.data);
          }
        } catch (err) {
          console.error('Failed to fetch Xero accounts:', err);
          notification.error({ message: 'Failed to fetch Xero accounts' });
        } finally {
          setAccountsLoading(false);
        }
      };
    

      const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
          // Format data with correct property casing
          const itemData = {
            Code: values.code,
            Name: values.name,
            Description: values.description || "",
            IsTrackedAsInventory: itemType === 'Inventory',
            AssetAccount: values.assetAccount || "",
            PurchaseCOGSAccountCode: values.purchaseCOGSAccountCode || "",
            PurchaseUnitPrice: values.purchaseUnitPrice ? parseFloat(values.purchaseUnitPrice) : null,
            SalesUnitPrice: values.salesUnitPrice ? parseFloat(values.salesUnitPrice) : null,
            SalesAccountCode: values.salesAccountCode || ""
          };
          
          if (editingRecord) {
            // Update existing item
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/Products/xero-update-product/${editingRecord.quickBooksItemId}`, 
              itemData
            );
            message.success('Xero product updated successfully');
          } else {
            // Add new item as array
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/Products/xero-add-product`, 
              [itemData]
            );
            message.success('Xero product added successfully');
          }
          
          form.resetFields();
          onSuccess();
          onClose();
        } catch (err) {
          console.error(err);
          notification.error({ 
            message: `Error ${editingRecord ? 'updating' : 'adding'} Xero product` 
          });
        } finally {
          setLoading(false);
        }
      };

  return (
    <Drawer
    title={editingRecord ? "Edit Xero Item" : "Add New Xero Item"}
    placement="right"
    closable
    onClose={onClose}
    open={visible}
    width={480}
  >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="type"
          label="Item Type"
          initialValue="Service"
          rules={[{ required: true }]}
        >
          <Select
            placeholder="Select type"
            onChange={(value) => setItemType(value)}
          >
            <Select.Option value="Service">Service</Select.Option>
            <Select.Option value="Inventory">Inventory</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          name="code" 
          label="Code" 
          rules={[{ required: true, message: 'Please enter code' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item 
          name="name" 
          label="Name" 
          rules={[{ required: false }]}
        >
          <Input />
        </Form.Item>

        <Form.Item 
          name="description" 
          label="Description" 
          rules={[{ required: false }]}
        >
          <Input.TextArea />
        </Form.Item>

        {itemType === 'Inventory' && (
    <Form.Item
      name="assetAccount"
      label="Inventory Asset Account"
      rules={[{ required: itemType === 'Inventory', message: 'Please select inventory asset account' }]}
    >
      <Select
        placeholder="Select inventory asset account"
        loading={accountsLoading}
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
        }
      >
        {inventoryAccounts.map(account => (
          <Select.Option key={account.code} value={account.code}>
            {account.code} - {account.name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  )}

        <Form.Item
          name="purchaseCOGSAccountCode"
          label="Cost of Goods Sold account"
          rules={[{ required: itemType === 'Inventory', message: 'Please enter purchase COGS account code' }]}
        >
          <Select
            placeholder="Select purchase COGS account"
            loading={accountsLoading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
            }
          >
            {xeroAccounts.map(account => (
              <Select.Option key={account.code} value={account.code}>
                {account.code} - {account.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="purchaseUnitPrice"
          label="Cost Unit Price"
          rules={[{ required: false }]}
        >
          <Input type="number" />
        </Form.Item>

        <Form.Item
          name="salesUnitPrice"
          label="Sales Unit Price"
          rules={[{ required: false }]}
        >
          <Input type="number" />
        </Form.Item>

        <Form.Item
          name="salesAccountCode"
          label="Sales Account"
          rules={[{ required: false }]}
        >
          <Select
            placeholder="Select sales account"
            loading={accountsLoading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
            }
          >
            {xeroAccounts.map(account => (
              <Select.Option key={account.code} value={account.code}>
                {account.code} - {account.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editingRecord ? 'Update' : 'Submit'}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default XeroItemDrawer;