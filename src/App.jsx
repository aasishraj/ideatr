import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faStop, faDownload } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const App = () => {
  const words = [
    'Algorithm', 'Blockchain', 'Compression', 'Database', 'Encryption',
    'Framework', 'Gateway', 'Hyperlink', 'Interface', 'Kernel'
  ];

  const [selectedWords, setSelectedWords] = useState([]);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();
  const mediaRecorderRef = useRef();
  const recordedChunks = useRef([]);
  const progressRef = useRef();
  const stopTimeoutRef = useRef();

  const getRandomWords = () => {
    const firstIndex = Math.floor(Math.random() * words.length);
    let secondIndex;
    do {
      secondIndex = Math.floor(Math.random() * words.length);
    } while (secondIndex === firstIndex);

    return [words[firstIndex], words[secondIndex]];
  };

  const handleButtonClick = () => {
    if (!selectedWords.length) {
      // Generate words
      handleGenerateWords();
    } else if (!recording && !recorded) {
      // Start recording
      startRecording();
    } else if (recording) {
      // Stop recording
      handleStopRecording();
    } else if (recorded) {
      // Download the video and reset
      downloadVideo();
      resetState();
    }
  };

  const handleGenerateWords = () => {
    const newWords = getRandomWords();
    setSelectedWords(newWords);
  };

  const resetState = () => {
    setSelectedWords([]);
    setRecorded(false);
  };

  const startVideoPreview = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();

    const drawOnCanvas = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (selectedWords.length > 1) {
          ctx.font = '24px "Times New Roman"';

          // Left word placement
          const leftText = selectedWords[0];
          ctx.fillStyle = 'black';
          ctx.fillRect(10, canvas.height - 40, ctx.measureText(leftText).width + 8, 30);
          ctx.fillStyle = 'white';
          ctx.fillText(leftText, 14, canvas.height - 18);

          // Right word placement
          const rightText = selectedWords[1];
          const rightTextWidth = ctx.measureText(rightText).width;
          ctx.fillStyle = 'black';
          ctx.fillRect(canvas.width - rightTextWidth - 18, canvas.height - 40, rightTextWidth + 8, 30);
          ctx.fillStyle = 'white';
          ctx.fillText(rightText, canvas.width - rightTextWidth - 14, canvas.height - 18);
        }
        requestAnimationFrame(drawOnCanvas);
      }
    };
    drawOnCanvas();
  }, [selectedWords]);

  const startRecording = () => {
    recordedChunks.current = []; // Reset recorded chunks
    const canvasStream = canvasRef.current.captureStream(30);
    const audioTrack = videoRef.current.srcObject.getAudioTracks()[0];
    const canvasAudioStream = new MediaStream([audioTrack, ...canvasStream.getVideoTracks()]);
    mediaRecorderRef.current = new MediaRecorder(canvasAudioStream, { mimeType: 'video/webm' });

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      setRecorded(true);
    };

    mediaRecorderRef.current.start();
    setRecording(true);

    // Automatically stop recording after 60 seconds
    stopTimeoutRef.current = setTimeout(() => {
      handleStopRecording();
    }, 60000);

    // Circular progress update
    let startTime = Date.now();
    const updateProgress = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = (elapsed / 60) * 360;
      progressRef.current.style.background = `conic-gradient(red ${progress}deg, transparent ${progress}deg)`;

      if (elapsed < 60 && recording) {
        requestAnimationFrame(updateProgress);
      }
    };
    requestAnimationFrame(updateProgress);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      clearTimeout(stopTimeoutRef.current); // Clear timeout to prevent duplicate calls
      setRecording(false);
    }
  };

  const downloadVideo = () => {
    const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const date = new Date();
    const filename = `${selectedWords.join('_')}_${date.toISOString().replace(/[:.]/g, '-')}.mp4`;
    a.href = url;
    a.download = filename;
    a.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    startVideoPreview().catch(error => console.error('Error accessing video', error));
    return () => clearTimeout(stopTimeoutRef.current); // Cleanup timeout on component unmount
  }, [startVideoPreview]);

  return (
    <div className="app">
      <div className="camera-view">
        <video ref={videoRef} className="video" muted playsInline autoPlay />
        <canvas ref={canvasRef} className="canvas" width="640" height="480" />
        <div className="controls">
          <div ref={progressRef} className={`progress-circle ${recording ? 'recording' : ''}`}>
            <button
              onClick={handleButtonClick}
              title={!selectedWords.length ? "Generate Words" : recording ? "Stop Recording" : recorded ? "Download Video" : "Start Recording"}
              className="action-button"
            >
              <FontAwesomeIcon
                icon={recording ? faStop : recorded ? faDownload : faCircle}
                size="2x"
                color={recording ? 'red' : recorded ? 'blue' : 'green'}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
