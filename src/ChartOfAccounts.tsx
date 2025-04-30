import React, { useEffect, useState } from 'react';
import { Table, message, Spin, Card, Button, Empty, Select } from 'antd';
import SearchBar from './SearchBar';
import { DownloadOutlined } from '@ant-design/icons';
import './ChartOfAccount.css';
import axios from 'axios';
interface AccountData {
    id: string;
    name: string;
    accountType: string;
    accountSubType: string;
    currentBalance: number;
    classification: string;
    active: boolean;
    currencyRef?: {
        value: string;
        name?: string;
    };
}

const ChartOfAccounts = () => {
    const [pagedData, setPagedData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
      });
      const [companyFilter, setCompanyFilter] = useState<string | null>(null);
      const [selectedCompany, setSelectedCompany] = useState<string>('QBO');

      const checkDataInDatabase = async (
        page = pagination.current,
        pageSize = pagination.pageSize,
        search = searchTerm,
        company = selectedCompany
    ) => {
        setLoading(true);
    
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/QuickBooks/fetch-from-db`, {
                params: { 
                    page, 
                    pageSize, 
                    searchTerm: search, 
                    company: company === 'Both' ? '' : company 
                }
            });
    
            const result = res.data;
    
            setPagedData(result.data);
            setPagination({
                current: result.currentPage,
                pageSize: result.pageSize,
                total: result.totalRecords,
            });
            setIsDataFetched(true);
        } catch (err) {
            message.error('Failed to fetch chart of accounts.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    

    const fetchAccountsFromQuickBooks = async () => {
        setLoading(true);
        console.log("➡️ Fetching from QuickBooks...");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/QuickBooks/fetch-chart-of-accounts-from-quickbooks`, {
                method: 'GET',
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result);

            if (result && result.length > 0) {
                setPagedData(result);
                setIsDataFetched(true);
                message.success('Chart of accounts loaded successfully from QuickBooks.');
            } else {
                message.warning('No chart of accounts data found in QuickBooks.');
            }
        } catch (err) {
            message.error('Failed to fetch chart of accounts from QuickBooks.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        console.log("🔍 Searching:", value);
        setSearchTerm(value);
        checkDataInDatabase(1, pagination.pageSize, value);
    };

    const handleTableChange = (paginationInfo: any) => {
        const { current, pageSize } = paginationInfo;
        setPagination(prev => ({
            ...prev,
            current,
            pageSize,
        }));
        checkDataInDatabase(current, pageSize, searchTerm, selectedCompany);
    };
    
  
    const handleCompanyChange = (value: string) => {
        setSelectedCompany(value);
        checkDataInDatabase(1, pagination.pageSize, searchTerm, value);
    };
    


    const handleDownload = () => {
        console.log("⬇️ Downloading from QuickBooks...");
        setIsDataFetched(false);
        fetchAccountsFromQuickBooks();
    };
    const handleDownloadFromXero = async () => {
        setLoading(true);
        console.log("➡️ Fetching from Xero...");
    
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/XeroAccounts/fetch-chart-of-accounts-from-xero`, {
                method: 'GET',
            });
    
            const result = await res.json();
    
            if (!res.ok) throw new Error(result);
    
            if (result && result.length > 0) {
                setPagedData(result);
                setIsDataFetched(true);
                message.success('Chart of accounts loaded successfully from Xero.');
            } else {
                message.warning('No chart of accounts data found in Xero.');
            }
        } catch (err) {
            message.error('Failed to fetch chart of accounts from Xero.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: AccountData, b: AccountData) => a.name.localeCompare(b.name),
        },
        {
            title: 'Account Type',
            dataIndex: 'accountType',
            key: 'accountType',
            filters: Array.from(new Set(pagedData.map(item => item.accountType)))
                .filter(Boolean)
                .map(type => ({ text: type, value: type })),
            onFilter: (value, record: AccountData) => record.accountType === String(value),
        },
        {
            title: 'Detail Type',
            dataIndex: 'accountSubType',
            key: 'accountSubType',
        },
        {
            title: 'Classification',
            dataIndex: 'classification',
            key: 'classification',
        },
        {
            title: 'Company',
            dataIndex: 'company',
            key: 'company',
        }
        
        
        
    ];


    useEffect(() => {
        checkDataInDatabase(pagination.current, pagination.pageSize, searchTerm);
    }, [searchTerm]);

    
    return (
        <div className="chart-accounts-container">
           <div className="chart-accounts-header">
    <div className="chart-accounts-title">Chart of Accounts</div>
    <div className="chart-accounts-actions">
    <Select
    value={selectedCompany}
    onChange={handleCompanyChange}
    style={{ width: 120, marginRight: 16 }}
>
    <Select.Option value="QBO">QuickBooks</Select.Option>
    <Select.Option value="Xero">Xero</Select.Option>
    <Select.Option value="Both">All</Select.Option>
</Select>
        <SearchBar onSearch={handleSearch} searchTerm={searchTerm} />
        <Button
            type="primary"
            onClick={handleDownload}
            icon={<DownloadOutlined />}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
            Download From QuickBooks
        </Button>
        <Button
            type="primary"
            onClick={handleDownloadFromXero}
            icon={<DownloadOutlined />}
        >
            Download From Xero
        </Button>
    </div>
</div>


            <div className="scrollable-table-container">
                {loading ? (
                    <div className="loading-container">
                        <Spin size="large" />
                        <p>Loading Accounts...</p>
                    </div>
                ) : pagedData.length > 0 ? (
                    <Table
    dataSource={pagedData}
    columns={columns}
    rowKey="id"
    pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '20', '50'],
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    }}
    onChange={handleTableChange}
    scroll={{ x: 'max-content' }}
    bordered
    className="accounts-table"
/>
                ) : (
                    <div className="empty-data-container">
                        <Empty
                            description='No data available. Click "Download" to load chart of accounts.'
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
        </div>
    );
};

export default ChartOfAccounts;
