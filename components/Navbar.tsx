"use client";

import { useState } from "react";
import { Tooltip, UnstyledButton, Stack, rem } from "@mantine/core";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import styles from "@/styles/Navbar.module.css";
import Image from "next/image";

interface NavbarLinkProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?(): void;
}

function NavbarLink({ icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        onClick={onClick}
        className={`${styles.link} ${active ? styles.active : ""}`}
      >
        <div className={styles.linkContent}>
          <Image src={icon} alt={label} width={24} height={24} />
          <span className={styles.linkLabel}>{label}</span>
        </div>
      </UnstyledButton>
    </Tooltip>
  );
}

const mockdata = [
  { icon: "/remover.svg", label: "Remover" },
  { icon: "/splitter.svg", label: "Splitter" },
  { icon: "/pitcher.svg", label: "Pitcher" },
  { icon: "/key_bpm_finder.svg", label: "Key BPM Finder" },
  { icon: "/cutter.svg", label: "Cutter" },
  { icon: "/joiner.svg", label: "Joiner" },
  { icon: "/recorder.svg", label: "Recorder" },
  { icon: "/karaoke.svg", label: "Karaoke" },
];

interface NavbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Navbar({ isCollapsed, setIsCollapsed }: NavbarProps) {
  const [active, setActive] = useState(4); // Set initial active to 4 for "Cutter"

  const links = mockdata.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => setActive(index)}
    />
  ));

  return (
    <span className={styles.navMain}>
      <div className={styles.collapseButtonWrapper}>
        <UnstyledButton
          className={styles.collapseButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <HiOutlineMenuAlt2 size={30} />
        </UnstyledButton>
      </div>

      <nav className={`${styles.navbar} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.navbarMain}>
          <Stack justify="center" gap={rem(16)}>
            <br />
            <br />
            {links}
          </Stack>
        </div>
        <Stack justify="center" gap={rem(16)}>
          <NavbarLink icon="/support-icon.svg" label="Support" />
          <NavbarLink icon="/flag.svg" label="Language" />
        </Stack>
      </nav>
    </span>
  );
}
