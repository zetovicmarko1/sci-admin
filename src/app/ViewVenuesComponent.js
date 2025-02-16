import { Button, Divider, Input, Modal, Popconfirm, Table } from "antd";
import { set } from "mongoose";
import Image from "next/image";

import React, { useState, useEffect } from "react";

const ViewVenuesComponent = ({ secretKey }) => {
  const [venues, setVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [searchUserTerm, setUserSearchTerm] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [userPagination, setUserPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [viewingUsers, setViewingUsers] = useState(null);
  const [editedAddress, setEditedAddress] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedName, setEditedName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, and WebP are allowed.");
      return;
    }

    if (file) {
      setSelectedFile(file);
    }
  };

  const columns = [
    { title: "Id", dataIndex: "_id", key: "_id" },
    { title: "Name", dataIndex: "name", key: "name" },
    // {
    //   title: "Location",
    //   dataIndex: "address",
    //   key: "address",
    //   render: (address) => address.city,
    // },
    {
      title: "Users",
      dataIndex: "allUsers",
      key: "allUsers",
      render: (allUsers, record) => (
        <>
          <Button
            type="link"
            disabled={allUsers.length < 1}
            onClick={() => openUsersModal(record._id)} // Pass the venue ID
          >
            {allUsers.length}
          </Button>
        </>
      ),
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
            title={`Are you sure you want to delete this venue?`}
            onConfirm={() => deleteVenue(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const userColumns = [
    { title: "User Id", dataIndex: "_id", key: "_id" },
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
    if (!viewingUsers) return; // Ensure a venue is selected

    setUserLoading(true);
    try {
      const response = await fetch("/api/search-venue-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({
          venueId: viewingUsers,
          searchUserTerm,
          page,
          pageSize,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setUserPagination({ current: page, pageSize, total: data.total });
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while fetching users.");
    }
    setUserLoading(false);
  };

  // Open Edit Modal and Set User Data
  const openEditModal = (venue) => {
    setEditingVenue(venue);
    setEditedEmail(venue.email);
    setEditedPhone(venue.phone);
    setEditedName(venue.name);
    setEditedAddress(venue.address);
    setIsEditModalOpen(true);
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVenue(null);
  };

  // Open Edit Modal and Set User Data
  const openUsersModal = (venueId) => {
    setViewingUsers(venueId);
    setIsUserModalOpen(true);
    console.log("venueId set:", venueId);
  };

  // Close Edit Modal
  const closeUsersModal = () => {
    setIsUserModalOpen(false);
    setViewingUsers(null);
    setUserSearchTerm("");
    setUsers([]);
  };

  // Save Changes
  const saveChanges = async () => {
    if (!editingVenue) return;
    setUploading(true);

    let imageUrl = editingVenue.image; // Keep old image if no new one is uploaded

    if (selectedFile) {
      try {
        const mimeType = selectedFile.type; // Extract MIME type from file

        // Step 1: Get Signed URL from API
        const response = await fetch(
          `/api/upload-image/${editingVenue._id}?mimeType=${encodeURIComponent(
            mimeType
          )}`,
          {
            headers: {
              "x-api-key": secretKey,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          setUploading(false);
          throw new Error(data.error || "Failed to get signed URL");
        }

        // Step 2: Upload File to S3
        const uploadResponse = await fetch(data.url, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": mimeType, // Ensure correct MIME type
          },
        });

        if (!uploadResponse.ok) {
          setUploading(false);
          throw new Error("Failed to upload image");
        }

        // Step 3: Extract Final Image URL from S3
        imageUrl = data.url.split("?")[0]; // Remove query params if necessary
        setSelectedFile(null);
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Failed to upload image.");
        setUploading(false);
        return;
      }
    }

    // Step 4: Update Venue in Database
    try {
      const updateResponse = await fetch("/api/edit-venue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({
          id: editingVenue._id,
          email: editedEmail,
          phone: editedPhone,
          address: editedAddress,
          name: editedName,
          image: imageUrl, // Save the new image URL
        }),
      });

      const updateData = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateData.message);
      }

      alert(updateData.message);
      setIsEditModalOpen(false);
      await fetchVenues(pagination.current, pagination.pageSize);
    } catch (error) {
      alert("An error occurred while updating the venue.");
    }

    setUploading(false);
  };

  const deleteVenue = async (id) => {
    setLoading(true);
    try {
      const response = await fetch("/api/delete-venue", {
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
        await fetchVenues(pagination.current, pagination.pageSize);
      }
    } catch {
      alert("An error occurred while deleting the venue.");
    }
    setLoading(false);
  };

  const fetchVenues = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await fetch("/api/search-venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ searchTerm, page, pageSize }),
      });

      const data = await response.json();

      if (response.ok) {
        setVenues(data.locations);
        setPagination({ current: page, pageSize, total: data.total });
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while fetching venues.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    if (viewingUsers) {
      fetchUsers(1, userPagination.pageSize);
    }
  }, [viewingUsers]);

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
          onClick={() => fetchVenues(1, pagination.pageSize)}
        >
          Search
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={venues}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => fetchVenues(page, pageSize),
        }}
        rowKey="_id"
      />

      {/* Edit Venue Modal */}
      <Modal
        title="Edit Venue"
        open={isEditModalOpen}
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
                editedEmail !== editingVenue?.email ||
                editedPhone !== editingVenue?.phone ||
                editedName !== editingVenue?.name ||
                selectedFile ||
                editedAddress !== editingVenue?.address
              )
            }
          >
            OK
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-4">
          <label>Name:</label>
          <Input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
          />
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
          <label>Upload Image:</label>
          <Input type="file" accept="image/*" onChange={handleFileChange} />

          {/* Show Preview */}
          {selectedFile && (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              style={{ width: "100px", marginTop: "10px" }}
            />
          )}
          {editingVenue?.image && !selectedFile && (
            <Image
              src={editingVenue.image}
              width={100}
              height={50}
              alt="Preview"
              className="mt-3"
            />
          )}

          {/* <label>Address:</label>
          <Input
            value={editedAddress}
            onChange={(e) => setEditedAddress(e.target.value)}
          /> */}
        </div>
      </Modal>

      <Modal
        width={1200}
        title="View Users"
        open={isUserModalOpen}
        onCancel={closeUsersModal}
        footer={[
          <Button key="cancel" onClick={closeUsersModal}>
            Close
          </Button>,
        ]}
      >
        <div className="w-100 flex flex-row justify-end items-center gap-2 mb-4">
          <Input
            value={searchUserTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            placeholder="Search users"
          />
          <Button
            color="primary"
            onClick={() => fetchUsers(1, pagination.pageSize)}
          >
            Search
          </Button>
        </div>
        <Table
          columns={userColumns}
          dataSource={users}
          loading={loading}
          pagination={{
            current: userPagination.current,
            pageSize: userPagination.pageSize,
            total: userPagination.total,
            onChange: (page, pageSize) => fetchUsers(page, pageSize),
          }}
          rowKey="_id"
        />
      </Modal>
    </div>
  );
};

export default ViewVenuesComponent;
