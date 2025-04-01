import { Button, Input } from "antd";
import React, { useState } from "react";

const TncsComponent = ({ secretKey }) => {
  const [selectedMainFile, setSelectedMainFile] = useState(null);
  const [selectedPassFile, setSelectedPassFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e, mainOrPass) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // Check file type
    if (file.type !== "application/pdf") {
      alert("Invalid file type. Only PDFs are allowed are allowed.");
      return;
    }

    if (mainOrPass && file) {
      setSelectedMainFile(file);
    }

    if (!mainOrPass && file) {
      setSelectedPassFile(file);
    }
  };

  // Save Changes
  const saveChanges = async () => {
    if (!selectedMainFile && !selectedPassFile) return;
    setUploading(true);

    if (selectedMainFile) {
      try {
        // Step 1: Get Signed URL from API
        const response = await fetch("/api/upload-tncs-link/mainSciTncs", {
          headers: {
            "x-api-key": secretKey,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          setUploading(false);
          throw new Error(data.error || "Failed to get signed URL");
        }

        // Step 2: Upload File to S3
        const uploadResponse = await fetch(data.url, {
          method: "PUT",
          body: selectedMainFile,
          headers: {
            "Content-Type": "application/pdf", // Ensure correct MIME type
          },
        });

        if (!uploadResponse.ok) {
          setUploading(false);
          throw new Error("Failed to upload terms and conditions");
        }

        setSelectedMainFile(null);
        alert("App terms and conditions uploaded successfully");
        setUploading(false);
      } catch (error) {
        console.error("Doc upload failed:", error);
        alert("Failed to upload doc.");
        setUploading(false);
        return;
      }
    }

    if (selectedPassFile) {
      try {
        // Step 1: Get Signed URL from API
        const response = await fetch("/api/upload-tncs-link/passSciTncs", {
          headers: {
            "x-api-key": secretKey,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          setUploading(false);
          throw new Error(data.error || "Failed to get signed URL");
        }

        // Step 2: Upload File to S3
        const uploadResponse = await fetch(data.url, {
          method: "PUT",
          body: selectedPassFile,
          headers: {
            "Content-Type": "application/pdf", // Ensure correct MIME type
          },
        });

        if (!uploadResponse.ok) {
          setUploading(false);
          throw new Error("Failed to upload terms and conditions");
        }

        setSelectedPassFile(null);
        alert("Pass terms and conditions uploaded successfully");
        setUploading(false);
      } catch (error) {
        console.error("Doc upload failed:", error);
        alert("Failed to upload doc.");
        setUploading(false);
        return;
      }
    }
  };
  return (
    <div className="w-100 flex flex-col items-start">
      <h1 className="text-lg mb-4">Update Terms and Conditions</h1>
      <div className="flex flex-row gap-4">
        <div>
          <label>Application terms and conditions</label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileChange(e, true)}
          />
        </div>
        <div>
          <label>Pass purchase terms and conditions</label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileChange(e, false)}
          />
        </div>
      </div>
      <Button
        className="mt-4"
        type="primary"
        onClick={saveChanges}
        disabled={!selectedMainFile && !selectedPassFile}
        loading={uploading}
      >
        Save
      </Button>
    </div>
  );
};

export default TncsComponent;
