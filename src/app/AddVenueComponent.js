import { Button, Divider, Input, Modal, Popconfirm, Table } from "antd";
import Image from "next/image";

import React, { useState, useEffect, useRef } from "react";

const AddVenueComponent = ({ secretKey }) => {
  const [loading, setLoading] = useState(false);
  //   const [editedAddress, setEditedAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const resetForm = () => {
    setEmail("");
    setPhone("");
    setName("");
    setRadius(null);
    setSelectedFile(null);
    setCity("");
    setState("");
    setPostcode("");
    setAddress("");
    setLat(null);
    setLng(null);
  };

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
    if (
      !radius ||
      !name ||
      lat === null ||
      lng === null ||
      !state ||
      !city ||
      !postcode ||
      !address
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    if (!name) return;
    setUploading(true);

    let createdVenueId = null;
    let uploadedImageUrl = null;

    try {
      const response = await fetch("/api/add-venue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({
          email: email,
          phone: phone,
          address: address,
          name: name,
          radius: radius,
          lat: lat,
          lng: lng,
          postcode: postcode,
          state: state,
          city: city,
        }),
      });

      const newData = await response.json();
      if (!response.ok) {
        throw new Error(newData.message);
      }

      createdVenueId = newData.newId;
    } catch (error) {
      alert("An error occurred while updating the venue.");
    }

    if (selectedFile && createdVenueId) {
      try {
        const mimeType = selectedFile.type; // Extract MIME type from file

        // Step 1: Get Signed URL from API
        const response = await fetch(
          `/api/upload-image/${createdVenueId}?mimeType=${encodeURIComponent(
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
          console.log(uploadResponse);
          throw new Error("Failed to upload image");
        }

        // Step 3: Extract Final Image URL from S3
        uploadedImageUrl = data.url.split("?")[0]; // Remove query params if necessary
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
          id: createdVenueId,
          email: email,
          phone: phone,
          address: address,
          radius: radius,
          lat: lat,
          lng: lng,
          postcode: postcode,
          state: state,
          city: city,
          name: name,
          image: uploadedImageUrl, // Save the new image URL
        }),
      });

      const updateData = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateData.message);
      }

      alert(updateData.message);
      setLoading(false);
      setUploading(false);
      resetForm();
    } catch (error) {
      alert("An error occurred while updating the venue.");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google && addressInputRef.current) {
        if (autocompleteRef.current) {
          autocompleteRef.current.unbindAll?.(); // optional chaining for safety
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          addressInputRef.current.input, // this gets the real DOM node from AntD Input
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
              localState = component.short_name;
            }
            if (types.includes("postal_code")) {
              localPostcode = component.long_name;
            }
          });

          setAddress(formattedAddress);
          setLat(lat);
          setLng(lng);
          setCity(localCity);
          setState(localState);
          setPostcode(localPostcode);
        });

        clearInterval(interval); // ✅ Stop checking once initialized
      }
    }, 300); // check every 300ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-100 justify-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-lg">Add New Venue</h1>
        <label>Venue name: (required)</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label>Radius: (in metres) </label>
        <Input
          type="number"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
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
        <label>Address: (required)</label>
        <Input
          ref={addressInputRef}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Search for an address"
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
