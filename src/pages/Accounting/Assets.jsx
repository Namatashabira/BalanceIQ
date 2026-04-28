import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Upload,
  Modal,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Form,
  message,
} from 'antd';
import { PlusOutlined, UploadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';

// Example asset data
const initialAssets = [
  {
    id: 1,
    name: 'Laptop',
    type: 'Electronics',
    status: 'Active',
    value: 1200,
    location: 'HQ',
    department: 'IT',
    utilization: 90,
    depreciation: 200,
    attachments: [],
    history: [
      { date: '2025-01-01', action: 'Added', by: 'Admin' },
      { date: '2025-02-01', action: 'Maintenance', by: 'IT' },
    ],
  },
];

const typeOptions = ['Electronics', 'Furniture', 'Vehicle', 'Other'];
const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Disposed'];

export default function Assets() {
  const [assets, setAssets] = useState(initialAssets);
  const [filter, setFilter] = useState({ type: '', status: '', search: '' });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modal, setModal] = useState({ visible: false, asset: null });

  const filteredAssets = assets.filter(asset => {
    return (
      (!filter.type || asset.type === filter.type) &&
      (!filter.status || asset.status === filter.status) &&
      (!filter.search || asset.name.toLowerCase().includes(filter.search.toLowerCase()))
    );
  });

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colors = { Active: 'green', Maintenance: 'orange', Inactive: 'gray', Disposed: 'red' };
        return <Tag color={colors[s] || 'default'} style={{ fontWeight: 600 }}>{s}</Tag>;
      },
      filters: statusOptions.map(s => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
    },
    { title: 'Value', dataIndex: 'value', key: 'value', render: v => `$${v}`, sorter: (a, b) => a.value - b.value },
    { title: 'Depreciation', dataIndex: 'depreciation', key: 'depreciation', render: d => `$${d}`, sorter: (a, b) => a.depreciation - b.depreciation },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Utilization', dataIndex: 'utilization', key: 'utilization', render: u => `${u}%`, sorter: (a, b) => a.utilization - b.utilization },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, asset) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            type="default"
            onClick={() => setModal({ visible: true, asset })}
            style={{ borderRadius: 8 }}
          >
            View
          </Button>
          <Button
            icon={<DeleteOutlined />}
            type="primary"
            danger
            onClick={() => handleDelete(asset.id)}
            style={{ borderRadius: 8 }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: keys => setSelectedRowKeys(keys),
  };

  const handleAdd = () => setModal({ visible: true, asset: null });

  const handleSave = asset => {
    if (asset.id) {
      setAssets(assets.map(a => (a.id === asset.id ? asset : a)));
      message.success('Asset updated');
    } else {
      setAssets([...assets, { ...asset, id: Date.now() }]);
      message.success('Asset added');
    }
    setModal({ visible: false, asset: null });
  };

  const handleDelete = id => {
    setAssets(assets.filter(a => a.id !== id));
    message.success('Asset deleted');
  };

  const handleBulkDelete = () => {
    setAssets(assets.filter(a => !selectedRowKeys.includes(a.id)));
    setSelectedRowKeys([]);
    message.success('Selected assets deleted');
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5' }}>
      <Card
        title={<span style={{ fontSize: 22, fontWeight: 600 }}>Assets Overview</span>}
        extra={(
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            Add Asset
          </Button>
        )}
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* Filters */}
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Select
            placeholder="Type"
            style={{ width: 160 }}
            allowClear
            onChange={type => setFilter(f => ({ ...f, type }))}
          >
            {typeOptions.map(t => (
              <Select.Option key={t} value={t}>{t}</Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Status"
            style={{ width: 160 }}
            allowClear
            onChange={status => setFilter(f => ({ ...f, status }))}
          >
            {statusOptions.map(s => (
              <Select.Option key={s} value={s}>{s}</Select.Option>
            ))}
          </Select>

          <Input.Search
            placeholder="Search by name"
            allowClear
            onSearch={search => setFilter(f => ({ ...f, search }))}
            style={{ width: 220 }}
          />

          {selectedRowKeys.length > 0 && (
            <Button
              danger
              onClick={handleBulkDelete}
              style={{ borderRadius: 8 }}
            >
              Delete Selected ({selectedRowKeys.length})
            </Button>
          )}
        </Space>

        {/* Assets Table */}
        <Table
          dataSource={filteredAssets}
          columns={columns}
          rowKey="id"
          rowSelection={rowSelection}
          expandable={{
            expandedRowRender: record => (
              <div style={{ background: '#fafafa', padding: 12, borderRadius: 8 }}>
                <h4 style={{ marginBottom: 8 }}>History:</h4>
                <ul>
                  {record.history.map((h, i) => (
                    <li key={i}>{h.date}: {h.action} by {h.by}</li>
                  ))}
                </ul>
                <h4 style={{ marginBottom: 8 }}>Attachments:</h4>
                <ul>
                  {record.attachments.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              </div>
            ),
          }}
          bordered
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
          rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : ''}
        />

        {/* KPIs */}
        <Card style={{ marginTop: 24, borderRadius: 12, background: '#e6f7ff' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total Value"
                value={assets.reduce((sum, a) => sum + a.value, 0)}
                prefix="$"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Depreciation"
                value={assets.reduce((sum, a) => sum + a.depreciation, 0)}
                prefix="$"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Average Utilization"
                value={assets.length ? (assets.reduce((sum, a) => sum + a.utilization, 0) / assets.length).toFixed(1) : 0}
                suffix="%"
              />
            </Col>
          </Row>
        </Card>
      </Card>

      <AssetModal modal={modal} setModal={setModal} onSave={handleSave} />
    </div>
  );
}

// Modal Form Component
function AssetModal({ modal, setModal, onSave }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const asset = modal.asset || {};

  useEffect(() => {
    if (modal.visible) {
      form.setFieldsValue({ ...asset });
      setFileList(asset.attachments || []);
    }
  }, [modal.visible, asset, form]);

  const handleOk = () => {
    form.validateFields().then(values => {
      onSave({ ...asset, ...values, attachments: fileList });
    });
  };

  const handleCancel = () => setModal({ visible: false, asset: null });

  return (
    <Modal
      open={modal.visible}
      title={asset.id ? 'Edit Asset' : 'Add Asset'}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      okType="primary"
      okButtonProps={{ style: { borderRadius: 8, fontWeight: 500 } }}
      cancelButtonProps={{ style: { borderRadius: 8 } }}
      bodyStyle={{ borderRadius: 12, padding: 24 }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please input asset name!' }]}
        >
          <Input placeholder="Asset Name" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: 'Select asset type!' }]}
        >
          <Select placeholder="Select Type" style={{ borderRadius: 8 }}>
            {typeOptions.map(t => (
              <Select.Option key={t} value={t}>{t}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Select asset status!' }]}
        >
          <Select placeholder="Select Status" style={{ borderRadius: 8 }}>
            {statusOptions.map(s => (
              <Select.Option key={s} value={s}>{s}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="value"
              label="Value ($)"
              rules={[{ required: true, message: 'Enter asset value!' }]}
            >
              <Input type="number" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="depreciation"
              label="Depreciation ($)"
              rules={[{ required: true, message: 'Enter depreciation!' }]}
            >
              <Input type="number" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="location" label="Location">
              <Input style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="department" label="Department">
              <Input style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="utilization" label="Utilization (%)">
          <Input type="number" style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item label="Attachments">
          <Upload
            fileList={fileList}
            beforeUpload={file => {
              setFileList(prev => [...prev, file]);
              return false;
            }}
            onRemove={file => setFileList(prev => prev.filter(f => f.uid !== file.uid))}
          >
            <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>
              Upload Attachment
            </Button>
          </Upload>
        </Form.Item>
      </Form>

      {asset.history && asset.history.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4>History</h4>
          <ul>
            {asset.history.map((h, i) => (
              <li key={i}>{h.date}: {h.action} by {h.by}</li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
