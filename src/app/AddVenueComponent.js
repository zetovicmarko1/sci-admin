import { Button, Divider, Input, Modal, Popconfirm, Table } from "antd";
import Image from "next/image";

import React, { useState, useEffect } from "react";

const AddVenueComponent = ({ secretKey }) => {
  const [loading, setLoading] = useState(false);
  //   const [editedAddress, setEditedAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newVenueId, setNewVenueId] = useState(null);
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const [imageUrl, setImageUrl] = useState(null);

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

  // Save Changes
  const addVenue = async () => {
    if (!name) return;
    setUploading(true);

    try {
      const response = await fetch("/api/add-venue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({
          //   id: editingVenue._id,
          email: email,
          phone: phone,
          //   address: editedAddress,
          name: name,
          //   image: imageUrl, // Save the new image URL
        }),
      });

      const newData = await response.json();
      if (!response.ok) {
        throw new Error(newData.message);
      }

      setNewVenueId(newData.newId);
    } catch (error) {
      alert("An error occurred while updating the venue.");
    }

    if (selectedFile && newVenueId) {
      try {
        const mimeType = selectedFile.type; // Extract MIME type from file

        // Step 1: Get Signed URL from API
        const response = await fetch(
          `/api/upload-image/${newVenueId}?mimeType=${encodeURIComponent(
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
        setImageUrl(data.url.split("?")[0]); // Remove query params if necessary
        setSelectedFile(null);
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Failed to upload image.");
        setUploading(false);
        return;
      }
    }

    try {
      const updateResponse = await fetch("/api/edit-venue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({
          id: newVenueId,
          email: email,
          phone: phone,
          //   address: editedAddress,
          name: name,
          image: imageUrl, // Save the new image URL
        }),
      });

      const updateData = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateData.message);
      }

      alert(updateData.message);
    } catch (error) {
      alert("An error occurred while updating the venue.");
    }
  };

  return (
    <div className="w-100 justify-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-lg">Add New Venue</h1>
        <label>Venue name:</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label>Email:</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label>Phone:</label>
        <Input
          type="number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <label>Upload Image:</label>
        <Input type="file" accept="image/*" onChange={handleFileChange} />

        {/* Show Preview */}
        {selectedFile && (
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Preview"
            style={{ width: "200px", marginTop: "10px" }}
          />
        )}

        {/* <label>Address:</label>
          <Input
            value={editedAddress}
            onChange={(e) => setEditedAddress(e.target.value)}
          /> */}
        <Button
          type="primary"
          onClick={addVenue}
          disabled={!name}
          loading={uploading}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default AddVenueComponent;
