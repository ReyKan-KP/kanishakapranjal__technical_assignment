"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconCut,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import { IoPlaySkipBack } from "react-icons/io5";
import WaveSurfer from "wavesurfer.js";
import { GrUndo, GrRedo } from "react-icons/gr";
import { handleUndo, handleRedo } from "@/utils/undoRedoUtils";

export default function Component({ audioFile }: { audioFile: File }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState("wav");
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioBuffer = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    if (audioFile && waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#01ff8f",
        progressColor: "#22c55e",
        cursorColor: "#ffffff",
        barWidth: 2,
        barRadius: 3,
        // responsive: true,
        height: 100,
        normalize: true,
        // partialRender: true,
      });

      wavesurfer.current.loadBlob(audioFile);

      wavesurfer.current.on("ready", () => {
        const duration = wavesurfer.current!.getDuration();
        setDuration(duration);
        setEndTime(duration);
      });

      wavesurfer.current.on("audioprocess", () => {
        setCurrentTime(wavesurfer.current!.getCurrentTime());
      });

      // Initialize AudioContext and load audio buffer
      audioContext.current = new AudioContext();
      audioFile.arrayBuffer().then((arrayBuffer) => {
        audioContext.current!.decodeAudioData(arrayBuffer).then((buffer) => {
          audioBuffer.current = buffer;
        });
      });

      return () => wavesurfer.current!.destroy();
    }
  }, [audioFile]);

  const togglePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${Math.floor((time % 1) * 10)}`;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = parseFloat(e.target.value);
    setStartTime(newStartTime);
    wavesurfer.current?.seekTo(newStartTime / duration);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = parseFloat(e.target.value);
    setEndTime(newEndTime);
  };

  const handleCut = () => {
    if (audioBuffer.current && audioContext.current) {
      const newBuffer = audioContext.current.createBuffer(
        audioBuffer.current.numberOfChannels,
        (endTime - startTime) * audioBuffer.current.sampleRate,
        audioBuffer.current.sampleRate
      );

      for (
        let channel = 0;
        channel < audioBuffer.current.numberOfChannels;
        channel++
      ) {
        const channelData = audioBuffer.current.getChannelData(channel);
        const newChannelData = newBuffer.getChannelData(channel);
        for (let i = 0; i < newBuffer.length; i++) {
          newChannelData[i] =
            channelData[
              i + Math.floor(startTime * audioBuffer.current.sampleRate)
            ];
        }
      }

      audioBuffer.current = newBuffer;

      // Recreate the waveform with the new audio buffer
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }

      const blob = bufferToWave(newBuffer, newBuffer.length);
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current!,
        waveColor: "#4ade80",
        progressColor: "#22c55e",
        cursorColor: "#ffffff",
        barWidth: 2,
        barRadius: 3,
        // responsive: true,
        height: 100,
        normalize: true,
        // partialRender: true,
      });
      wavesurfer.current.loadBlob(blob);

      setDuration(endTime - startTime);
      setStartTime(0);
      setEndTime(endTime - startTime);
      setCurrentTime(0);
    }
  };
  const playFromStart = () => {
    if (wavesurfer.current) {
      wavesurfer.current.seekTo(0);
      setCurrentTime(0);
      wavesurfer.current.play();
      setIsPlaying(true);
    }
  };
  const handleCloseEditor = () => {
    // Logic to close the editor
  };

  const handleSave = () => {
    if (audioBuffer.current && audioContext.current) {
      const offlineContext = new OfflineAudioContext(
        audioBuffer.current.numberOfChannels,
        audioBuffer.current.length,
        audioBuffer.current.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer.current;
      source.connect(offlineContext.destination);
      source.start();

      offlineContext.startRendering().then((renderedBuffer) => {
        const blob = bufferToWave(renderedBuffer, renderedBuffer.length);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `audio.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  };

  // Helper function to convert AudioBuffer to WAV Blob
  function bufferToWave(abuffer: AudioBuffer, len: number) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this demo)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (let i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++; // next source sample
    }

    // create Blob
    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }
  const [history, setHistory] = useState<AudioBuffer[]>([]);
  const [redoStack, setRedoStack] = useState<AudioBuffer[]>([]);

  const handleRemove = () => {
    if (audioBuffer.current && audioContext.current) {
      setHistory([...history, audioBuffer.current]); // Save current buffer in history
      audioBuffer.current = null;
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
      setDuration(0);
      setStartTime(0);
      setEndTime(0);
      setCurrentTime(0);
    }
  };
  const handleUndoClick = () => {
    handleUndo(
      audioBuffer,
      setHistory,
      setRedoStack,
      history,
      redoStack,
      setDuration,
      waveformRef
    );
  };

  const handleRedoClick = () => {
    handleRedo(
      audioBuffer,
      setHistory,
      setRedoStack,
      history,
      redoStack,
      setDuration,
      waveformRef
    );
  };
const getTimeDifference = () => formatTime(endTime - startTime);
  return (
    <div className="audio-editor">
      <button className="close-editor" onClick={handleCloseEditor}>
        <IconX size={24} />
      </button>
      <div className="waveform-container">
        <div ref={waveformRef} className="waveform" />
        <input
          type="range"
          min={0}
          max={duration}
          value={startTime}
          onChange={handleStartTimeChange}
          className="slider start-slider"
        />
        <input
          type="range"
          min={0}
          max={duration}
          value={endTime}
          onChange={handleEndTimeChange}
          className="slider end-slider"
        />
        <div className="time-labels">
          <span>{formatTime(startTime)}</span>
          <span>{getTimeDifference()}</span>
          <span>{formatTime(endTime)}</span>
        </div>
      </div>
      <div className="controls">
        <button className="control-button" onClick={handleCut}>
          <IconCut size={20} />
          <span>Cut</span>
        </button>
        <button className="control-button" onClick={handleRemove}>
          <IconTrash size={20} />
          <span>Remove</span>
        </button>
        <button className="control-button" onClick={handleUndoClick}>
          <GrUndo size={20} />
        </button>
        <button className="control-button" onClick={handleRedoClick}>
          <GrRedo size={20} />
        </button>
      </div>
      {/* <hr className="footer-line" /> */}
      <div className="footer">
        <div className="playback-controls">
          <button onClick={togglePlayPause} className="play-pause-button">
            {isPlaying ? (
              <IconPlayerPause size={20} />
            ) : (
              <IconPlayerPlay size={20} />
            )}
          </button>
          <button className="play-pause-button" onClick={playFromStart}>
            <IoPlaySkipBack size={20} />
          </button>
          <div className="time-display">
            <span>Start :</span>
            <input
              type="number"
              min="0"
              max={endTime}
              value={currentTime.toFixed(2)}
              onChange={handleStartTimeChange}
              className="time-input"
            />
            <span>End :</span>
            <input
              type="number"
              min={startTime}
              max={duration}
              value={endTime.toFixed(2)}
              onChange={handleEndTimeChange}
              className="time-input"
            />
          </div>
        </div>
        <div className="format-save">
          <span className="format">
            Format:{" "}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="format-select"
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
            </select>
          </span>
          <button className="save-button" onClick={handleSave}>
            <span>Save</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .audio-editor {
          width: 100vw;
          height: 100vh;
          background-color: #18161e;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          font-family: Arial, sans-serif;
        }
        .close-editor {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          /* color: white */
          border: none;
          cursor: pointer;
        }
        .menu-button {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background-color: #2c2b31;
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 50%;
          cursor: pointer;
        }
        .waveform-container {
          width: 90%;
          max-width: 1200px;
          background-color: #1d1a26;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          position: relative;
        }
        .waveform {
          width: 100%;
          height: 100px;
        }
        .slider {
          position: absolute;
          width: calc(100% - 32px);
          top: 60px;
          left: 16px;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: transparent;
          outline: none;
          opacity: 0.7;
          transition: opacity 0.2s;
          z-index: 10;
        }

        .slider:hover {
          opacity: 1;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 4px;
          height: 100px;
          background: #6be0c5;
          border-radius: 50%;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 10px;
          height: 120px;
          background: #6be0c5;
          cursor: pointer;
        }

        .end-slider {
          top: 60px;
        }
        .time-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 28px;
          font-size: 12px;
        }
        .controls {
          display: flex;
          justify-content: flex-end;
          width: 90%;
          max-width: 1200px;
          margin-bottom: 16px;
        }
        .control-button {
          background-color: #2c2b31;
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          margin-right: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .control-button span {
          margin-left: 4px;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 95%;
          max-width: 1200px;
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
        }
        .footer-line {
          width: 100%;
          border: 1px solid #2c2b31;
          /* padding-top: 25rem; */
          /* bottom:0; */
        }
        .playback-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
        }

        .play-pause-button {
          background-color: #2c2b31;
          border: none;
          color: white;
          padding: 0.8rem;
          width: 6rem;
          border-radius: 25%;
          cursor: pointer;
          margin-right: 16px;
        }
        .time-display {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-grow: 1;
          text-align: center;
        }
        .format-save {
          display: flex;
          align-items: center;
        }
        .format {
          margin-right: 16px;
        }
        .format-select {
          background: #18161e;
          color: #4ade80;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .save-button {
          background-color: #d3d3df;
          border: none;
          color: black;
          padding: 0.5rem 1.5rem;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .save-button span {
          margin-left: 4px;
        }
        .time-input {
          width: 100px;
          background: #18161e;
          color: white;
          /* border: none; */
          padding: 4px;
          text-align: center;
          border-radius: 40px;
          align-items: center;
        }

        .time-input:focus {
          outline: none;
          box-shadow: 0 0 5px #4ade80;
        }
        @media (max-width: 640px) {
          .audio-editor {
            font-size: 12px;
          }
          .waveform-container {
            width: 100%;
            height: 80px;
          }
          .controls {
            flex-direction: column;
          }
          .footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .audio-editor {
            font-size: 14px;
          }
          .waveform-container {
            width: 95%;
          }
        }

        @media (min-width: 769px) {
          .audio-editor {
            font-size: 16px;
          }
          .waveform-container {
            width: 90%;
          }
        }
      `}</style>
    </div>
  );
}
