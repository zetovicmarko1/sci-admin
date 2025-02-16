import { Button, Input, Popconfirm, Table } from "antd";
import React, { useState, useEffect } from "react";

const ActivePassesComponent = ({ secretKey }) => {
  const [passes, setPasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const columns = [
    { title: "Pass ID", dataIndex: "_id", key: "_id" },
    { title: "Location name", dataIndex: "locationName", key: "locationName" },
    { title: "User's name", dataIndex: "userName", key: "userName" },
    { title: "User's email", dataIndex: "userEmail", key: "userEmail" },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => formatDate(date),
    },
    {
      title: "Expired",
      dataIndex: "expired",
      key: "expired",
      render: (expired) => (expired ? "Yes" : "No"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <>
          <Popconfirm
            title={`Are you sure you want to expire this pass?`}
            onConfirm={() => expirePass(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button disabled={record.expired} danger={!record.expired}>
              Expire pass
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"; // Handle missing dates

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      // Check if date is invalid
      console.error("Invalid Date:", dateString);
      return "Invalid Date";
    }

    return date
      .toLocaleString("en-AU", {
        timeZone: "Australia/Sydney",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true, // Ensures AM/PM format
      })
      .replace(",", ""); // Remove comma after the date
  };

  const expirePass = async (id) => {
    setLoading(true);
    try {
      const response = await fetch("/api/expire-pass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        await fetchPasses(pagination.current, pagination.pageSize);
      }
    } catch {
      alert("An error occurred while updating the pass.");
    }
    setLoading(false);
  };

  const fetchPasses = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await fetch("/api/search-passes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ searchTerm, page, pageSize }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasses(data.passes);
        setPagination({ current: page, pageSize, total: data.total });
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while fetching passes.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  return (
    <div className="w-100 justify-center">
      <div className="w-100 flex flex-row justify-end items-center gap-2 mb-4">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search passes"
        />
        <Button
          color="primary"
          onClick={() => fetchPasses(1, pagination.pageSize)}
        >
          Search
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={passes}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => fetchPasses(page, pageSize),
        }}
        rowKey="_id"
      />
    </div>
  );
};

export default ActivePassesComponent;
