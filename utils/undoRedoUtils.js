import WaveSurfer from "wavesurfer.js";

export const handleUndo = (
  audioBuffer,
  setHistory,
  setRedoStack,
  history,
  redoStack,
  setDuration,
  waveformRef
) => {
  if (history.length > 0) {
    const lastBuffer = history.pop();
    setRedoStack([...redoStack, audioBuffer.current]); // Save current for redo
    audioBuffer.current = lastBuffer;
    setHistory([...history]);

    // Re-render waveform
    if (waveformRef.current) {
      let wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#4ade80",
        progressColor: "#22c55e",
        cursorColor: "#ffffff",
        barWidth: 2,
        barRadius: 3,
        height: 100,
        normalize: true,
      });
      const blob = bufferToWave(lastBuffer, lastBuffer.length);
      wavesurfer.loadBlob(blob);
      setDuration(lastBuffer.duration);
    }
  }
};

export const handleRedo = (
  audioBuffer,
  setHistory,
  setRedoStack,
  history,
  redoStack,
  setDuration,
  waveformRef
) => {
  if (redoStack.length > 0) {
    const nextBuffer = redoStack.pop();
    setHistory([...history, audioBuffer.current]); // Save current for undo
    audioBuffer.current = nextBuffer;
    setRedoStack([...redoStack]);

    // Re-render waveform
    if (waveformRef.current) {
      let wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#4ade80",
        progressColor: "#22c55e",
        cursorColor: "#ffffff",
        barWidth: 2,
        barRadius: 3,
        height: 100,
        normalize: true,
      });
      const blob = bufferToWave(nextBuffer, nextBuffer.length);
      wavesurfer.loadBlob(blob);
      setDuration(nextBuffer.duration);
    }
  }
};

// Helper function to convert AudioBuffer to WAV Blob
export function bufferToWave(abuffer, len) {
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
  setUint16(16); // 16-bit (hardcoded)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

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

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
