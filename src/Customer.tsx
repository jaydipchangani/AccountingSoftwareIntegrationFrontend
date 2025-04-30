import React, { useEffect, useState } from 'react';
import { Table, message, Spin, Button, Empty, Drawer, Form, Input, Divider, Popconfirm, Select } from 'antd';
import { DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import SearchBar from './SearchBar';
import './ChartOfAccount.css';
import { title } from 'process';

interface CustomerData {
    id: string;
    displayName: string;
    companyName: string;
    phone: string;
    balance: number;
    email?: string;
    billingStreet1?: string;
    billingStreet2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    active?: number;
    company : string;
    contactID:string;

}

interface CustomerFormData extends Omit<CustomerData, 'id' | 'balance'> {
    id?: string;
}

const Customers = () => {
    const [pagedData, setPagedData] = useState<CustomerData[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
    const [form] = Form.useForm();

    const fetchCustomersFromDb = async (page = 1, pageSize = 10, search = searchTerm, filter = companyFilter) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/customer/fetch-customer-from-db-paginated?page=${page}&pageSize=${pageSize}&searchTerm=${encodeURIComponent(search)}&company=${filter}`
            );

            const text = await res.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(text);
            }
            console.log('Customers data received:', result);
            if (!res.ok) throw new Error(result.message || 'Failed to fetch data');

            setPagedData(result.data);
            setPagination({
                current: result.currentPage,
                pageSize: result.pageSize,
                total: result.totalRecords,
            });
            setIsDataFetched(true);
        } catch (err) {
            message.error('Failed to fetch customer data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    const handleCompanyFilterChange = (value: string) => {
        setCompanyFilter(value);
        fetchCustomersFromDb(1, pagination.pageSize, searchTerm, value);
    };

    const fetchCustomersFromQuickBooks = async () => {
        setLoading(true);
        console.log("➡️ Downloading accounts from QuickBooks if not in DB...");
    
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/customer/fetch-customers-from-quickbooks`, {
                method: 'GET',
            });
    
            const text = await res.text();
            let result;
    
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error("❌ Invalid JSON from QuickBooks download:", text);
                throw new Error(text);
            }
    
            if (!res.ok) {
                console.error("❌ Error response from QuickBooks download:", result);
                throw new Error(result.message || 'Failed to download accounts from QuickBooks');
            }
    
            if (result && result.length > 0) {
                setPagedData(result);
                setIsDataFetched(true);
                message.success('Chart of accounts downloaded successfully from QuickBooks.');
            } else {
                message.warning('No new accounts were downloaded from QuickBooks.');
            }
        } catch (err) {
            message.error('Failed to download chart of accounts from QuickBooks.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchCustomersFromDb(1, pagination.pageSize, value);
    };

    const handleTableChange = (paginationInfo: any) => {
        const { current, pageSize } = paginationInfo;
        setPagination(prev => ({
            ...prev,
            current,
            pageSize
        }));
        fetchCustomersFromDb(current, pageSize, searchTerm);
    };

    const handleDownload = () => {
        setIsDataFetched(false);
        fetchCustomersFromQuickBooks()
        fetchCustomersFromDb();
    };

    const handleAddCustomer = () => {
        setEditingCustomer(null);
        form.resetFields();
        setDrawerVisible(true);
    };

    const handleEditCustomer = (customer: CustomerData) => {
        console.log('Editing customer with ID:', customer.id);
        console.log('Full customer object:', customer);
        
        // Create a modified version of the customer object with properly mapped field names
        const formValues = {
            ...customer,
            billingStreet1: customer.billingLine1,
            city: customer.billingCity,
            state: customer.billingState,
            zipCode: customer.billingPostalCode,
            country: customer.billingCountry
        };
        
        setEditingCustomer(customer);
        form.setFieldsValue(formValues);
        setDrawerVisible(true);
    };

    const handleDeleteCustomer = async (customerId: string, platform: string, contactID?: string) => {
        console.log("deleting", customerId, "from platform", platform);
        
        setLoading(true);
        try {
            let res;
            
            if (platform === 'QBO') {
                res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/customer/delete-customer/${customerId}`, {
                    method: 'DELETE',
                });
            } else if (platform === 'Xero' && contactID) {
                res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Xero/archive-contact/${contactID}`, {
                    method: 'POST',
                });
            } else {
                throw new Error('Invalid platform or missing contact ID');
            }
    
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to delete customer');
            }
    
            message.success(`Customer deleted successfully from ${platform === 'QBO' ? 'QuickBooks' : 'Xero'} and local database.`);
            fetchCustomersFromDb(pagination.current, pagination.pageSize, searchTerm);
        } catch (err: any) {
            message.error('Failed to delete customer.');
            console.error('Delete Error:', err.message || err);
        } finally {
            setLoading(false);
        }
    };
    
    

    const handleDrawerClose = () => {
        setDrawerVisible(false);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            let mappedValues;
            
            if (values.company === 'Xero') {
                // Format payload specifically for Xero
                mappedValues = {
                    displayName: values.displayName,
                    givenName: values.givenName || "",
                    familyName: values.familyName || "",
                    email: values.email || "",
                    phones: [
                        {
                            phoneType: "DEFAULT",
                            phoneNumber: values.phone || "",
                            phoneAreaCode: "",
                            phoneCountryCode: ""
                        }
                    ],
                    Addresses: [
                        {
                            AddressType: "POBOX",
                            City: values.city || "",
                            Region: values.state || "",
                            PostalCode: values.zipCode || "",
                            Country: values.country || ""
                        }
                    ],
                    company: values.company,
                    ...(editingCustomer ? { contactID: editingCustomer.contactID } : {})
                };
            } else {
                // Original format for QBO
                mappedValues = {
                    displayName: values.displayName,
                    companyName: values.companyName,
                    phone: values.phone,
                    email: values.email,
                    billingLine1: values.billingStreet1,
                    billingCity: values.city,
                    billingState: values.state,
                    billingPostalCode: values.zipCode,
                    billingCountry: values.country,
                    company: values.company,
                };
            }
              
            setSubmitting(true);
            
            const isEditing = !!editingCustomer;
            let apiEndpoint;
            let method;

            if (values.company === 'QBO') {
                apiEndpoint = isEditing 
                    ? `${import.meta.env.VITE_API_BASE_URL}/api/customer/update-customer/${editingCustomer?.id}`
                    : `${import.meta.env.VITE_API_BASE_URL}/api/customer/add-customer`;
                method = isEditing ? 'PUT' : 'POST';
            } else {
                apiEndpoint = isEditing
                    ? `${import.meta.env.VITE_API_BASE_URL}/api/Xero/update-customer`
                    : `${import.meta.env.VITE_API_BASE_URL}/api/Xero/add-customer-to-xero`;
                method = 'POST'; // Always use POST for Xero
            }
            
            console.log('🧾 Form values before submit:', mappedValues);

            const response = await fetch(apiEndpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mappedValues),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save customer');
            }
            
            message.success(`Customer ${isEditing ? 'updated' : 'added'} successfully!`);
            setDrawerVisible(false);
            form.resetFields();
            fetchCustomersFromDb(pagination.current, pagination.pageSize, searchTerm);
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            } else {
                message.error('An error occurred while saving the customer');
            }
            console.error('Submit error:', error);
        } finally {
            setSubmitting(false);
        }
    };


    const handleXeroDownload = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Xero/sync-contacts`, {
                method: 'POST',
            });

            if (!res.ok) {
                throw new Error('Failed to download contacts from Xero');
            }

            message.success('Contacts downloaded successfully from Xero');
            fetchCustomersFromDb(pagination.current, pagination.pageSize, searchTerm);
        } catch (err) {
            message.error('Failed to download contacts from Xero');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    

    useEffect(() => {
        fetchCustomersFromDb();
    }, []);

    const columns = [
        {
            title: 'Display Name',
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: (a: CustomerData, b: CustomerData) => a.displayName.localeCompare(b.displayName),
        },
        {
            title: 'First Name',
            dataIndex: 'givenName',
            key: 'givenName',
        },
        {
            title: 'Last Name',
            dataIndex: 'familyName',
            key: 'familyName',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Billing Address',
            key: 'billingAddress',
            render: (record: CustomerData) => {
                const line1 = [record.billingLine1, record.billingCity].filter(Boolean).join(', ');
                const line2 = [ record.billingState, record.billingCountry].filter(Boolean).join(', ');
                
                return (
                    <div>
                        <div>{line1 || '-'}</div>
                        <div>{line2 || ''}</div>
                    </div>
                );
            },
        },
        {
            title: 'Active',
            dataIndex: 'active',
            key: 'active',
            render: (value: number) => {
                if (value == 0) return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Inactive</span>;
                if (value == 1) return <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Active</span>;
                return '-';
            },
        },
        {
            title:'Plateform',
            key: 'company',
            dataIndex: 'company'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: CustomerData) => (
                <div className="action-buttons">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditCustomer(record)}
                        className="edit-button"
                    >
                        
                    </Button>
                    &nbsp;&nbsp;
                    <Popconfirm
                        title="Are you sure you want to delete this customer?"
                        onConfirm={() => handleDeleteCustomer(record.id, record.company, record.contactID)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />} className="delete-button ">
                            
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="chart-accounts-container">
            <div className="chart-accounts-header">
                <div className="chart-accounts-title">Customers</div>
                <div className="chart-accounts-actions">
                    <SearchBar onSearch={handleSearch} searchTerm={searchTerm} />
                    <Select
                        defaultValue="all"
                        style={{ width: 150, marginRight: 10 }}
                        onChange={handleCompanyFilterChange}
                        options={[
                            { value: 'all', label: 'All Platforms' },
                            { value: 'QBO', label: 'QBO' },
                            { value: 'Xero', label: 'Xero' },
                        ]}
                        prefix={<FilterOutlined />}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddCustomer}
                        className="action-button"
                    >
                        Add Customer
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleDownload}
                        icon={<DownloadOutlined />}
                        className="action-button ml-2"
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Download From QuickBooks
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleXeroDownload}
                        icon={<DownloadOutlined />}
                        className="action-button ml-2"
                    >
                        Download From Xero
                    </Button>
                </div>
            </div>

            <div className="scrollable-table-container">
                {loading ? (
                    <div className="loading-container">
                        <Spin size="large" />
                        <p>Loading Customers...</p>
                    </div>
                ) : pagedData.length > 0 ? (
                    <Table
    rowKey={(record) => record.id}
    columns={columns}
    dataSource={pagedData}
    loading={loading}
    pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} products`,
    }}
    onChange={handleTableChange}
    scroll={{ x: 'max-content' }}
    bordered
    className="accounts-table"
/>

                ) : (
                    <div className="empty-data-container">
                        <Empty
                            description='No customer data available. Click "Download" to load from QuickBooks.'
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                        <Button
                            type="primary"
                            onClick={handleDownload}
                            icon={<DownloadOutlined />}
                            className="empty-download-button"
                        >
                            Download
                        </Button>
                    </div>
                )}
            </div>

            <Drawer
                title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
                placement="right"
                onClose={handleDrawerClose}
                open={drawerVisible}
                width={500}
                className="customer-drawer"
                footer={
                    <div className="drawer-footer">
                        <Button onClick={handleDrawerClose} className="cancel-button">
                            Cancel
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={handleSubmit}
                            loading={submitting}
                            className="submit-button"
                        >
                            {editingCustomer ? 'Update Customer' : 'Add Customer'}
                        </Button>
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={editingCustomer || {}}
                    className="customer-form"
                >
                    
                    <Form.Item 
                        label={<span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>Platform</span>}
                        name="company"
                        rules={[{ required: true, message: 'Please select a platform' }]}
                        style={{ 
                            marginBottom: '24px',
                            padding: '12px',
                            backgroundColor: '#f0f5ff',
                            borderRadius: '8px',
                            border: '1px solid #91caff'
                        }}
                    >
                        <Select
                            placeholder="Select platform"
                            options={[
                                { 
                                    value: 'QBO', 
                                    label: <span style={{ fontWeight: 500 }}>QuickBooks</span>
                                },
                                { 
                                    value: 'Xero', 
                                    label: <span style={{ fontWeight: 500 }}>Xero</span>
                                }
                            ]}
                            disabled={!!editingCustomer}
                            style={{ 
                                width: '100%',
                                height: '40px',
                                fontSize: '14px'
                            }}
                            className="platform-select"
                        />
                    </Form.Item>
                    
                    <Form.Item 
                        label="Display Name" 
                        name="displayName"
                        rules={[{ required: true, message: 'Please enter display name' }]}
                    >
                        <Input placeholder="Enter display name" />
                    </Form.Item>
                    <Form.Item 
                        label="Company Name" 
                        name="companyName"
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (getFieldValue('company') === 'QBO' && !value) {
                                        return Promise.reject('Please enter company name');
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <Input placeholder="Enter company name" />
                    </Form.Item>

                    <Form.Item 
                        label="Phone" 
                        name="phone"
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (getFieldValue('company') === 'QBO' && !value) {
                                        return Promise.reject('Please enter phone number');
                                    }
                                    if (value && !/^[0-9+-]+$/.test(value)) {
                                        return Promise.reject('Please enter a valid phone number');
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>
                    <Form.Item 
                        label="Email" 
                        name="email"
                        rules={[
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>

                    <Divider orientation="left">Billing Address</Divider>
                    <Form.Item 
                        label="Street Address 1" 
                        name="billingStreet1"
                    >
                        <Input placeholder="Enter street address 1" />
                    </Form.Item>
                    <Form.Item 
                        label="Street Address 2" 
                        name="billingStreet2"
                    >
                        <Input placeholder="Enter street address 2" />
                    </Form.Item>
                    
                    <div className="form-row">
                        <Form.Item 
                            label="City" 
                            name="city"
                            className="city-field"
                        >
                            <Input placeholder="Enter city" />
                        </Form.Item>
                        <Form.Item 
                            label="State" 
                            name="state"
                            className="state-field"
                        >
                            <Input placeholder="Enter state" />
                        </Form.Item>
                    </div>
                    
                    <div className="form-row">
                        <Form.Item 
                            label="ZIP Code" 
                            name="zipCode"
                            className="zip-field"
                        >
                            <Input placeholder="Enter ZIP code" />
                        </Form.Item>
                        <Form.Item 
                            label="Country" 
                            name="country"
                            className="country-field"
                        >
                            <Input placeholder="Enter country" />
                        </Form.Item>
                    </div>
                </Form>
            </Drawer>
        </div>
    );
};

export default Customers;