"use client";

import { Button, Input, Layout, Menu } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import {
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  HomeOutlined,
  LaptopOutlined,
  MessageOutlined,
  NotificationOutlined,
  PlusCircleOutlined,
  QrcodeOutlined,
  ScheduleOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Sider from "antd/es/layout/Sider";
import React, { useState, useEffect } from "react";
import AllUsersComponent from "./AllUsersComponent";
import ActivePassesComponent from "./ActivePassesComponent";
import AllVenuesComponent from "./AllVenuesComponent";
import QRCodeGeneratorComponent from "./QRCodeGeneratorComponent";
import TncsComponent from "./TncsComponent";
import ViewVenuesComponent from "./ViewVenuesComponent";
import AddVenueComponent from "./AddVenueComponent";
import MessagesComponent from "./MessagesComponent";
import OtherSettingsComponent from "./OtherSettingsComponent";

const HomepageComponent = () => {
  const [user, setUser] = useState(false);
  const [selectedKey, setSelectedKey] = useState("1");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");

  useEffect(() => {
    const storedSecretKey = localStorage.getItem("secretKey");
    const storedLoggedIn = localStorage.getItem("loggedIn");

    if (storedSecretKey && storedLoggedIn === "true") {
      setSecretKey(storedSecretKey);
      setUser(true);
    }

    return () => {};
  }, []);

  const menuItems = [
    { key: "1", icon: <UserOutlined />, label: "All users" },
    { key: "2", icon: <ScheduleOutlined />, label: "Venue passes" },
    { key: "3", icon: <MessageOutlined />, label: "All messages" },
    {
      key: "4",
      icon: <HomeOutlined />,
      label: "Venues",
      children: [
        { key: "4-1", icon: <EyeOutlined />, label: "View and edit" },
        { key: "4-2", icon: <PlusCircleOutlined />, label: "Add venue" },
      ],
    },
    { key: "5", icon: <FileTextOutlined />, label: "Terms and conditions" },
    { key: "6", icon: <SettingOutlined />, label: "Other settings" },
  ];

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter a username and password");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(true);
        setSecretKey(data.key);
        localStorage.setItem("loggedIn", true);
        localStorage.setItem("secretKey", data.key);
      }

      if (!response.ok) {
        alert(data.message);
      }
    } catch {
      alert("An error occurred while logging in");
    }
  };

  const handleLogout = () => {
    setUser(false);
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("secretKey");
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "1":
        return <AllUsersComponent secretKey={secretKey} />;
      case "2":
        return <ActivePassesComponent secretKey={secretKey} />;
      case "3":
        return <MessagesComponent secretKey={secretKey} />;
      case "4-1":
        return <ViewVenuesComponent secretKey={secretKey} />;
      case "4-2":
        return <AddVenueComponent secretKey={secretKey} />;
      case "5":
        return <TncsComponent secretKey={secretKey} />;
      case "6":
        return <OtherSettingsComponent secretKey={secretKey} />;
      default:
        return <AllUsersComponent secretKey={secretKey} />;
    }
  };

  return (
    <Layout>
      <Header
        color="primary"
        className="bg-[#F6A350] text-lg text-white font-bold flex justify-between items-center"
      >
        <span>Single Check In</span>
        {user && (
          <div className="flex items-center gap-x-4">
            {" "}
            <span>Welcome Todd</span>
            <Button onClick={() => handleLogout()}>Log out</Button>
          </div>
        )}
      </Header>
      <Layout className="h-screen">
        <Sider width={"20%"} className="bg-[#F6A350]">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: "100%" }}
            items={menuItems}
            onClick={(e) => setSelectedKey(e.key)}
          />
        </Sider>
        <Content className="p-4 flex justify-center w-100 bg-gray-100">
          {user ? (
            renderContent()
          ) : (
            <div className="w-1/2 mt-20 flex items-center flex-col gap-y-2">
              <Input
                value={username}
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={() => handleLogin()} size="large">
                Log in
              </Button>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default HomepageComponent;
