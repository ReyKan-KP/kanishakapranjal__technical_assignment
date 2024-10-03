"use client";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import styles from "@/styles/HomePage.module.css";
import { AudioCutter } from "@/components/AudioCutter";
export default function HomePage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className={styles.container}>
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <AudioCutter />
    </div>
  );
}
