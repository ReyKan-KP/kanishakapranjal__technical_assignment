"use client";
import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { AudioCutter } from "../components/AudioCutter";
import styles from "@/styles/HomePage.module.css";

export default function HomePage() {
  const [isCollapsed, setIsCollapsed] = useState(false); // State for navbar collapse

  return (
    <div className={styles.container}>
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <AudioCutter />
    </div>
  );
}
