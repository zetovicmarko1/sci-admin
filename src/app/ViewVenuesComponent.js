import {
  Button,
  Divider,
  Input,
  Modal,
  Popconfirm,
  Table,
  Tooltip,
} from "antd";
import Image from "next/image";
import { SettingFilled, DeleteFilled, QrcodeOutlined } from "@ant-design/icons";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode"; // Import qrcode for direct canvas rendering

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
  const [editedRadius, setEditedRadius] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrSize, setQrSize] = useState(1024); // Default size
  const [selectedQrId, setSelectedQrId] = useState(null);
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [latLng, setLatLng] = useState(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");

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

  const exportVenuesToCSV = async () => {
    let venuesToExport = [];

    try {
      const response = await fetch("/api/search-venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ searchTerm: "", page: 1, pageSize: null }),
      });

      const data = await response.json();

      if (response.ok) {
        venuesToExport = data.locations;
      } else {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while exporting venues.");
    }
    if (!venues || venues.length === 0) {
      alert("No venues to export.");
      return;
    }

    const headers = [
      "Id",
      "Name",
      "Email",
      "Phone",
      "City",
      "State",
      "Postcode",
      "Address",
      "Latitude",
      "Longitude",
    ];

    const rows = venuesToExport.map((venue) => [
      venue._id,
      venue.name,
      venue.email || "",
      venue.phone || "",
      venue.city || "",
      venue.state || "",
      venue.postcode || "",
      venue.address || "",
      venue.geo?.coordinates?.[1] || "", // lat
      venue.geo?.coordinates?.[0] || "", // lng
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
    link.setAttribute("download", "venues_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: "Id",
      dataIndex: "_id",
      key: "_id",
      render: (id) => "..." + id.slice(-3),
    },
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
    { title: "City", dataIndex: "city", key: "city" },
    { title: "State", dataIndex: "state", key: "state" },
    { title: "Postcode", dataIndex: "postcode", key: "postcode" },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <>
          {/* Open the QR Size Selection Modal */}
          <Button
            type="link"
            onClick={() => {
              setSelectedQrId(record._id); // Store venue ID
              setIsQrModalOpen(true); // Open modal
            }}
          >
            <Tooltip title="Download QR Code">
              <QrcodeOutlined />
            </Tooltip>
          </Button>
          <Divider type="vertical" />

          {/* Edit Venue */}
          <Button type="link" onClick={() => openEditModal(record)}>
            <Tooltip title="Venue Properties">
              <SettingFilled />
            </Tooltip>
          </Button>
          <Divider type="vertical" />

          {/* Delete Venue */}
          <Popconfirm
            title={`Are you sure you want to delete this venue?`}
            onConfirm={() => deleteVenue(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              <Tooltip title="Delete Venue">
                <DeleteFilled />
              </Tooltip>
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const userColumns = [
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
    setEditedRadius(venue.radius);
    setState(venue.state);
    setCity(venue.city);
    setPostcode(venue.postcode);
    setLatLng({ lat: venue.geo.coordinates[1], lng: venue.geo.coordinates[0] });
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
    if (
      !editingVenue._id ||
      !editedRadius ||
      !editedName ||
      latLng === null ||
      !state ||
      !city ||
      !postcode ||
      !editedAddress
    ) {
      alert("Please fill in all required fields.");
      return;
    }
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
          radius: editedRadius,
          lat: latLng.lat,
          lng: latLng.lng,
          state: state,
          city: city,
          postcode: postcode,
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

  const generateQRCode = async () => {
    if (!selectedQrId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/generate-qr/${selectedQrId}`, {
        method: "GET",
        headers: {
          "x-api-key": secretKey,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.message || "Failed to generate QR code URL");
      }

      // Step 1: Create a High-Resolution Canvas
      const canvas = document.createElement("canvas");
      const size = Math.min(Math.max(qrSize, 256), 4096); // Ensure valid size (256px - 4096px)

      // Set canvas size for high-resolution QR code
      canvas.width = size;
      canvas.height = size;

      // Generate QR code directly on the canvas
      await QRCode.toCanvas(canvas, data.url, {
        width: size, // High-resolution size
        margin: 2, // Adjust margin for better readability
        errorCorrectionLevel: "H", // High error correction
      });

      // Step 2: Convert to High-Resolution PNG
      const pngUrl = canvas.toDataURL("image/png", 1.0);

      // Step 3: Trigger Download
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `QR_Code_${selectedQrId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsQrModalOpen(false);
    } catch (error) {
      console.error("QR Code generation failed:", error);
      alert("Failed to generate QR code.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isEditModalOpen && window.google && addressInputRef.current) {
      if (autocompleteRef.current) {
        autocompleteRef.current.unbindAll();
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current.input,
        {
          types: ["geocode"],
        }
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();

        if (!place.geometry || !place.geometry.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address;

        // Extract components
        const components = place.address_components;
        let localCity = "";
        let localState = "";
        let localPostcode = "";

        components.forEach((component) => {
          const types = component.types;

          if (types.includes("locality")) {
            localCity = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            localState = component.short_name; // or long_name if you prefer full name
          }
          if (types.includes("postal_code")) {
            localPostcode = component.long_name;
          }
        });

        // Update states
        setEditedAddress(formattedAddress);
        setLatLng({ lat, lng });
        setCity(localCity);
        setState(localState);
        setPostcode(localPostcode);
      });
    }
  }, [isEditModalOpen]);

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
        <Button onClick={exportVenuesToCSV} type="default">
          Export All Venues
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
        title="Venue Properties"
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
                editedAddress !== editingVenue?.address ||
                editedRadius !== editingVenue?.radius ||
                latLng !== null ||
                state !== editingVenue?.state ||
                city !== editingVenue?.city ||
                postcode !== editingVenue?.postcode
              )
            }
          >
            OK
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-4">
          <label>Name: (required)</label>
          <Input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
          />
          <label>Radius: (in metres) (required)</label>
          <Input
            type="number"
            value={editedRadius}
            onChange={(e) => setEditedRadius(e.target.value)}
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
          <label>Address: (required)</label>
          <Input
            ref={addressInputRef}
            value={editedAddress}
            onChange={(e) => setEditedAddress(e.target.value)}
            placeholder="Search for an address"
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
          loading={userLoading}
          pagination={{
            current: userPagination.current,
            pageSize: userPagination.pageSize,
            total: userPagination.total,
            onChange: (page, pageSize) => fetchUsers(page, pageSize),
          }}
          rowKey="_id"
        />
      </Modal>

      <Modal
        title="Select QR Code Size"
        open={isQrModalOpen}
        onCancel={() => setIsQrModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsQrModalOpen(false)}>
            Cancel
          </Button>,
          <Button key="generate" type="primary" onClick={generateQRCode}>
            Generate & Download
          </Button>,
        ]}
      >
        <p>Select the size of the QR code (256px - 4096px):</p>
        <Input
          type="number"
          value={qrSize}
          min={256}
          max={4096}
          onChange={(e) => setQrSize(Number(e.target.value))}
        />
      </Modal>
    </div>
  );
};

export default ViewVenuesComponent;
