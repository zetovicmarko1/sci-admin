import { Button, Input, Table, Popconfirm, Modal, Divider } from "antd";
import React, { useState, useEffect } from "react";

const AllUsersComponent = ({ secretKey }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editedEmail, setEditedEmail] = useState("");
  const [editedPhone, setEditedPhone] = useState("");

  const exportUsersToCSV = async () => {
    let usersToExport = [];

    try {
      const response = await fetch("/api/search-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ searchTerm: "", page: 1, pageSize: null }),
      });

      const data = await response.json();

      if (response.ok) {
        usersToExport = data.users;
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while exporting users.");
    }
    if (!usersToExport || usersToExport.length === 0) {
      alert("No users to export.");
      return;
    }

    const headers = [
      "Id",
      "Name",
      "Email",
      "Phone",
      "Gender",
      "Pronouns",
      "Birthday",
    ];

    const rows = usersToExport.map((user) => [
      user._id,
      user.name,
      user.email || "",
      user.phone || "",
      user.gender || "",
      user.pronouns || "",
      user.birthday || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((e) =>
          e.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: "User Id",
      dataIndex: "_id",
      key: "_id",
      render: (id) => "..." + id.slice(-3),
    },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Banned",
      dataIndex: "banned",
      key: "banned",
      render: (banned) => (banned ? "Yes" : "No"),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <>
          <Button type="link" onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Divider type="vertical" />
          <Popconfirm
            title={`Are you sure you want to ${
              record.banned ? "unban" : "ban"
            } this user?`}
            onConfirm={() => banUser(record._id, !record.banned)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger={!record.banned}>
              {record.banned ? "Unban User" : "Ban User"}
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  // Open Edit Modal and Set User Data
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditedEmail(user.email);
    setEditedPhone(user.phone);
    setIsModalOpen(true);
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Save Changes
  const saveChanges = async () => {
    if (!editingUser) return;
    setLoading(true);

    try {
      const response = await fetch("/api/edit-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({
          id: editingUser._id,
          email: editedEmail,
          phone: editedPhone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setIsModalOpen(false);
        await fetchUsers(pagination.current, pagination.pageSize);
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while updating the user.");
    }

    setLoading(false);
  };

  const banUser = async (id, banned) => {
    setLoading(true);
    try {
      const response = await fetch("/api/ban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ id, banned }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        await fetchUsers(pagination.current, pagination.pageSize);
      }
    } catch {
      alert("An error occurred while updating the user.");
    }
    setLoading(false);
  };

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await fetch("/api/search-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ searchTerm, page, pageSize }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPagination({ current: page, pageSize, total: data.total });
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while fetching users.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="w-100 justify-center">
      <div className="w-100 flex flex-row justify-end items-center gap-2 mb-4">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users"
        />
        <Button
          color="primary"
          onClick={() => fetchUsers(1, pagination.pageSize)}
        >
          Search
        </Button>
        <Button onClick={exportUsersToCSV} type="default">
          Export All Users
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => fetchUsers(page, pageSize),
        }}
        rowKey="_id"
      />

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isModalOpen}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>
            Cancel
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={saveChanges}
            disabled={
              !(
                editedEmail !== editingUser?.email ||
                editedPhone !== editingUser?.phone
              )
            }
          >
            OK
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-4">
          <label>Email:</label>
          <Input
            type="email"
            value={editedEmail}
            onChange={(e) => setEditedEmail(e.target.value)}
          />
          <label>Phone:</label>
          <Input
            type="number"
            value={editedPhone}
            onChange={(e) => setEditedPhone(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AllUsersComponent;
