"use client";
import React, { useState, useEffect } from "react";
import { Box, Button, Text, FileInput, Group } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import AudioEditor from "./AudioEditor";
import { useRouter } from "next/navigation";
import styles from "@/styles/AudioCutter.module.css";

export function AudioCutter() {
  const router = useRouter();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false); // New state for tracking redirection

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onFileChange = (file: File | null) => {
    if (file) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setAudioFile(file);
        setIsRedirecting(true); // Set redirection to true when file is selected
      }, 1000);
    }
  };

  return (
    <Box className={styles.pageContainer}>
      {!isRedirecting && ( // Conditionally render navBar based on redirection
        <Box
          className={`${styles.navBar} ${
            hasScrolled ? styles.navBarScrolled : ""
          }`}
        >
          <Group>
            <Box
              style={{
                width: 32,
                height: 32,
                visibility: hasScrolled ? "visible" : "hidden",
              }}
            />
            <Group
              className={
                hasScrolled
                  ? styles.navButtonGroupScrolled
                  : styles.navButtonGroup
              }
            >
              <Button
                variant="subtle"
                color="gray"
                onClick={() => {
                  const infoSection = document.getElementById("infoSection");
                  if (infoSection)
                    infoSection.scrollIntoView({ behavior: "smooth" });
                }}
              >
                HOW IT WORKS
              </Button>
              <Button
                variant="subtle"
                color="gray"
                onClick={() => router.push("/")}
              >
                JOINER
              </Button>
            </Group>
            <Box
              style={{
                width: 32,
                height: 32,
                visibility: hasScrolled ? "visible" : "hidden",
              }}
            />
          </Group>
        </Box>
      )}

      {!audioFile ? (
        <>
          <Box className={styles.contentContainer}>
            <Text className={styles.headingTitle}>Audio Cutter</Text>
            <Text className={styles.headingSubtitle}>
              Free editor to trim and cut any audio file online
            </Text>
            <FileInput
              placeholder={loading ? "Please wait..." : "Browse my files"}
              accept="audio/*"
              onChange={onFileChange}
              styles={{
                input: {
                  backgroundColor: "#18161e",
                  color: "white",
                  border: "2px solid #655dc2",
                  borderRadius: "50px",
                  padding: "10px 20px",
                  fontSize: "16px",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "#675d97",
                  },
                },
              }}
              disabled={loading}
            />
          </Box>

          <Box className={styles.infoSectionContainer} id="infoSection">
            <Text className={styles.infoHeading}>How to cut audio</Text>
            <Box className={styles.infoCard}>
              <Text className={`${styles.infoText} ${styles.marginBottom}`}>
                This app can be used to trim and/or cut audio tracks, remove
                audio fragments. Fade in and fade out your music easily to make
                the audio harmoniously.
              </Text>
              <Text className={`${styles.infoText} ${styles.marginBottom}`}>
                It&apos;s fast and easy to use. You can save the audio file in
                any format (codec parameters are configured).
              </Text>
              <Text className={styles.infoText}>
                It works directly in the browser, no need to install any
                software, and is available for mobile devices.
              </Text>
            </Box>
            <Text className={`${styles.infoHeading} ${styles.marginTop}`}>
              <IconLock size="1.5rem" style={{ marginRight: "0.5rem" }} />
              Privacy and Security Guaranteed
            </Text>
            <Box className={styles.infoCard}>
              <Text className={styles.infoText}>
                This is a serverless app. Your files do not leave your device.
              </Text>
            </Box>
          </Box>
        </>
      ) : (
        <AudioEditor audioFile={audioFile} />
      )}
    </Box>
  );
}
