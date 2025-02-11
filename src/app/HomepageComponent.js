"use client";

import { Button, Layout, Menu } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import {
  FileTextOutlined,
  HomeOutlined,
  LaptopOutlined,
  NotificationOutlined,
  QrcodeOutlined,
  ScheduleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Sider from "antd/es/layout/Sider";
import React, { useState } from "react";
import AllUsersComponent from "./AllUsersComponent";
import ActivePassesComponent from "./ActivePassesComponent";
import AllVenuesComponent from "./AllVenuesComponent";
import QRCodeGeneratorComponent from "./QRCodeGeneratorComponent";
import TncsComponent from "./TncsComponent";

const HomepageComponent = () => {
  const [user, setUser] = useState(null);
  const [selectedKey, setSelectedKey] = useState("1");

  const menuItems = [
    { key: "1", icon: <UserOutlined />, label: "All users" },
    { key: "2", icon: <ScheduleOutlined />, label: "Active passes" },
    { key: "3", icon: <HomeOutlined />, label: "All venues" },
    { key: "4", icon: <QrcodeOutlined />, label: "QR code generator" },
    { key: "5", icon: <FileTextOutlined />, label: "Terms and conditions" },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case "1":
        return <AllUsersComponent />;
      case "2":
        return <ActivePassesComponent />;
      case "3":
        return <AllVenuesComponent />;
      case "4":
        return <QRCodeGeneratorComponent />;
      case "5":
        return <TncsComponent />;
      default:
        return <AllUsersComponent />;
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
          <div>
            {" "}
            <span>Welcome {user.name}</span>
            <Button>Log out</Button>
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
        <Content className="p-4 bg-gray-100">{renderContent()}</Content>
      </Layout>
    </Layout>
  );
};

export default HomepageComponent;
