import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Tag, Typography, Spin, Alert, Space, Button,Input, Modal } from "antd";
import {SearchOutlined, PlusOutlined } from "@ant-design/icons";
import AddVendorDrawer from "./AddVendorDrawer";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

type Vendor = {
  id: number;
  vId: string;
  displayName: string;
  active: boolean;
  balance: number;
  primaryEmailAddr: string | null;
  primaryPhone: string | null;
  createTime: string;
};

const VendorDashboard: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);

const openDrawer = () => setDrawerVisible(true);
const closeDrawer = () => setDrawerVisible(false);

const handleVendorAdded = () => {
    fetchVendors(currentPage);
  };

  const fetchVendors = async (page: number, search: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://localhost:7241/api/Vendor?pageNumber=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
      );
      const { data, totalCount } = response.data;
  
      setVendors(data);
      setTotalCount(totalCount);
    } catch (err) {
      setError("Failed to load vendors.");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchVendors(currentPage, searchTerm);
    }, 500); // wait 500ms after typing stops
  
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddVendor = () => {
    // Placeholder for your add vendor logic (e.g., open a modal or navigate to a form)
    console.log("Add Vendor Clicked");
  };

  const handleSyncVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("https://localhost:7241/api/Vendor/sync"); // <-- Adjust your endpoint if different
      console.log("Sync successful", response.data);
      Modal.success({
        title: "Sync Successful",
        content: "Vendors synced successfully from QuickBooks!",
      }); 
      fetchVendors(currentPage); // Refresh list
    } catch (err) {
      console.error("Sync failed", err);
      setError("Failed to sync vendors from QuickBooks.");
      Modal.error({
        title: "Sync Failed",
        content: "Failed to sync vendors from QuickBooks.",
      });
    } finally {
      setLoading(false);
    }
  };
  const navigate = useNavigate();

  const handleCreateBill = async (vendor: any) => {
    
    navigate(`/home/add-bill`);
    try{
        const response = await axios.get(`https://localhost:7241/api/Vendor/${vendor.vId}`);
        console.log("Sync successful", response.data);
    }
    catch(err){
        console.error("Sync failed", err);
        setError("Failed to sync vendors from QuickBooks.");
    }
  };
  
  const handleMakeInactive = async (vendor: any) => {
    console.log("Marking vendor as inactive:", vendor);
    // Call API to update vendor status
    // Example: await axios.put(`/api/vendors/${vendor.id}/inactive`);
  };
  

  const columns = [
    {
      title: "Name",
      dataIndex: "displayName",
      key: "displayName",
    },
    {
      title: "Active",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) =>
        active ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: "Balance (USD)",
      dataIndex: "balance",
      key: "balance",
      align: "right" as const,
      render: (balance: number) => `$${balance.toFixed(2)}`,
    },
    {
      title: "Email",
      dataIndex: "primaryEmailAddr",
      key: "primaryEmailAddr",
      render: (email: string | null) => email || "-",
    },
    {
      title: "Phone",
      dataIndex: "primaryPhone",
      key: "primaryPhone",
      render: (phone: string | null) => phone || "-",
    },
    {
      title: "Created On",
      dataIndex: "createTime",
      key: "createTime",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
        title: "Action",
        render: (text: any, record: any) => (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
               onClick={() => handleCreateBill(record)}
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
                borderRadius: "4px"
              }}
            >
              Create Bill
            </button>
            <button
               onClick={() => handleMakeInactive(record)}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
                borderRadius: "4px"
              }}
            >
              Make Inactive
            </button>
          </div>
        )
      }
      
  ];

  if (loading) return <Spin tip="Loading vendors..." style={{ marginTop: 100 }} size="large" />;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div style={{ padding: "24px" }}>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
  <Title level={3}>Vendor Dashboard</Title>
  <Space>
  <Input
    placeholder="Search by name"
    prefix={<SearchOutlined />}
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    allowClear
  />
  <Button type="primary" onClick={openDrawer}>
    Add Vendor
  </Button>
  <Button type="default" onClick={handleSyncVendors}>
    Sync Vendors
  </Button>
</Space>

</Space>
      <Table
        columns={columns}
        dataSource={vendors}
        rowKey="id"
        scroll={{ y: 500 }}
        bordered
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          onChange: handlePageChange,
        }}
      />

<AddVendorDrawer
  visible={drawerVisible}
  onClose={closeDrawer}
  onVendorAdded={handleVendorAdded}
/>

    </div>
    
  );
};

export default VendorDashboard;
