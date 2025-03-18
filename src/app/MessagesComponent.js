import { Button, Input, Table, Popconfirm, Modal, Divider } from "antd";
import React, { useState, useEffect } from "react";
import { render } from "react-dom";

const MessagesComponent = ({ secretKey }) => {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [messagesSearchTerm, setMessagesSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [messagesPagination, setMessagesPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [viewingMessages, setViewingMessages] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    {
      title: "Chat Id",
      dataIndex: "_id",
      key: "_id",
      render: (id) => "..." + id.slice(-3),
    },
    {
      title: "Users",
      dataIndex: "users",
      key: "users",
      render: (users) => users.map((user) => user.name).join(", "),
    },
    {
      title: "Location Name",
      dataIndex: "locationName",
      key: "locationName",
    },
    {
      title: "Total Messages",
      dataIndex: "messages",
      key: "messages",
      render: (messages, record) => (
        <>
          <Button type="link" onClick={() => openEditModal(record._id)}>
            {messages.length}
          </Button>
        </>
      ),
    },
  ];

  const messagesColumns = [
    {
      title: "Message Id",
      dataIndex: "_id",
      key: "_id",
      render: (id) => "..." + id.slice(-3),
    },
    {
      title: "Content",
      dataIndex: "messageBody",
      key: "messageBody",
    },
    {
      title: "Sent At",
      dataIndex: "sentAt",
      key: "sentAt",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Sent By User Id",
      dataIndex: "userId",
      key: "userId",
    },
  ];

  // Open Edit Modal and Set User Data
  const openEditModal = (chatId) => {
    setOpenChatId(chatId);
    fetchMessages(1, messagesPagination.pageSize, chatId);
    setIsModalOpen(true);
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setMessagesPagination({ current: 1, pageSize: 5, total: 0 });
    setMessagesSearchTerm("");
    setOpenChatId(null);
    setViewingMessages(null);
    setIsModalOpen(false);
  };

  const fetchChats = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await fetch("/api/search-chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ searchTerm, page, pageSize }),
      });

      const data = await response.json();

      if (response.ok) {
        setChats(data.chats);
        setPagination({ current: page, pageSize, total: data.total });
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while fetching chats.");
    }
    setLoading(false);
  };

  const fetchMessages = async (page = 1, pageSize = 5, chatId) => {
    setLoading(true);
    try {
      const response = await fetch("/api/search-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({
          chatId,
          messagesSearchTerm,
          page,
          pageSize,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setViewingMessages(data.messages);
        setMessagesPagination({ current: page, pageSize, total: data.total });
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while fetching messages.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="w-100 justify-center">
      <div className="w-100 flex flex-row justify-end items-center gap-2 mb-4">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search chat users, locations"
        />
        <Button
          color="primary"
          onClick={() => fetchChats(1, pagination.pageSize)}
        >
          Search
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={chats}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => fetchChats(page, pageSize),
        }}
        rowKey="_id"
      />

      {/* Edit User Modal */}
      <Modal
        width={1200}
        title="View Messages"
        open={isModalOpen}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>
            Cancel
          </Button>,
        ]}
      >
        <div className="w-100 flex flex-row justify-end items-center gap-2 mb-4">
          <Input
            value={messagesSearchTerm}
            onChange={(e) => setMessagesSearchTerm(e.target.value)}
            placeholder="Search messages"
          />
          <Button
            color="primary"
            onClick={() => fetchMessages(1, pagination.pageSize, openChatId)}
          >
            Search
          </Button>
        </div>

        <Table
          columns={messagesColumns}
          dataSource={viewingMessages}
          loading={loading}
          pagination={{
            current: messagesPagination.current,
            pageSize: messagesPagination.pageSize,
            total: messagesPagination.total,
            onChange: (page, pageSize) =>
              fetchMessages(page, pageSize, openChatId),
          }}
          rowKey="_id"
        />
      </Modal>
    </div>
  );
};

export default MessagesComponent;
