import React, { useState } from "react";
import { Upload, Button, message, Alert, Card, Typography, Space, Table } from "antd";
import { UploadOutlined, FileTextOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import axios from "axios";

const { Title } = Typography;

interface ValidationError {
  row: number;
  message: string;
}

const CSVUploadPage: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<"success" | "error" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const props: UploadProps = {
    name: "file",
    accept: ".csv",
    beforeUpload: (file) => {
      setSelectedFile(file);
      return false;
    },
    showUploadList: false,
  };
  const handleParseData = async () => {
    if (!selectedFile) {
      message.error("Please upload a CSV file first");
      return;
    }
  
    setIsLoading(true); // Start loading
    const formData = new FormData();
    formData.append("file", selectedFile);
  
    try {
      const response = await axios.post("https://localhost:7241/api/CSVParse/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.data.message === "Validation failed.") {
        message.error("Validation failed. Please review the errors below.");
        setUploadStatus("error");
        // Transform the error array into the required format
        const formattedErrors = response.data.errors.map((error: string) => {
          const rowMatch = error.match(/Row (\d+):/);
          return {
            row: rowMatch ? parseInt(rowMatch[1]) : 0,
            message: error
          };
        });
        setValidationErrors(formattedErrors);
      } else {
        message.success(`${selectedFile.name} parsed successfully`);
        setUploadStatus("success");
        setValidationErrors([]);
        setSelectedFile(null);
      }
    } catch (error) {
      message.error("An unexpected error occurred.");
      setUploadStatus("error");
      setValidationErrors([{ row: 0, message: "Failed to connect or parse the file." }]);
    }
    finally{
      setIsLoading(false);
    }
  };

  const columns = [
    {
      title: "Row Number",
      dataIndex: "row",
      key: "row",
    },
    {
      title: "Error Message",
      dataIndex: "message",
      key: "message",
    },
  ];

  return (
    <div style={{ padding: "40px", maxWidth: 800, margin: "auto" }}>
      <Card bordered={false} style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <Title level={3}>Upload CSV File</Title>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space>
            <Upload {...props}>
              <Button icon={<UploadOutlined />}>Select CSV File</Button>
            </Upload>
            {selectedFile && (
              <Button 
              type="primary" 
              icon={<FileTextOutlined />} 
              onClick={handleParseData}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Parsing...' : 'Parse Data'}
            </Button>
            )}
          </Space>

          {selectedFile && (
            <Alert
              message="File Selected"
              description={`Selected file: ${selectedFile.name}`}
              type="info"
              showIcon
            />
          )}

          {uploadStatus === "success" && (
            <Alert
              message="Parse Successful"
              description="The CSV file was processed successfully."
              type="success"
              showIcon
            />
          )}

          {uploadStatus === "error" && validationErrors.length > 0 && (
            <>
              <Alert
                message="Validation Errors Detected"
                description="Some rows contain invalid data. Please fix the following issues and re-upload the file."
                type="error"
                showIcon
              />
              <Table
  columns={columns}
  dataSource={validationErrors}
  pagination={false}
  bordered
  size="small"
  loading={isLoading}
/>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default CSVUploadPage;
