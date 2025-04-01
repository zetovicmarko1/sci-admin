import { Button, Input } from "antd";
import React, { useEffect, useState } from "react";

const OtherSettingsComponent = ({ secretKey }) => {
  const [price, setPrice] = useState("");
  const [expiryTime, setExpiryTime] = useState("");

  const getSettings = async () => {
    try {
      const response = await fetch("/api/get-settings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      setPrice(data.price);
      setExpiryTime(data.expiryTime);
    } catch (error) {
      alert("An error occurred while fetching settings.");
    }
  };

  const updateSettings = async () => {
    if (!price || !expiryTime) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const response = await fetch("/api/update-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": secretKey,
        },
        body: JSON.stringify({ price, expiryTime }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      alert("Settings updated successfully");
    } catch (error) {
      alert("An error occurred while updating settings.");
    }
  };
  // Fetch settings when the component mounts
  useEffect(() => {
    getSettings();
  }, []);

  return (
    <div className="w-100 justify-start">
      <h1 className="text-lg">Other settings</h1>
      <label>Pass Price: (in cents, e.g. 799 = $7.99)</label>
      <Input
        value={price}
        type="number"
        className="mb-4"
        onChange={(e) => setPrice(e.target.value)}
      />
      <label>Pass expiration time: (in hours)</label>
      <Input
        value={expiryTime}
        type="number"
        className="mb-4"
        onChange={(e) => setExpiryTime(e.target.value)}
      />
      <Button type="primary" onClick={updateSettings}>
        Save Settings
      </Button>
    </div>
  );
};

export default OtherSettingsComponent;
