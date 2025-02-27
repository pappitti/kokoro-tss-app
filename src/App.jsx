import { useState, useEffect, useRef, createRef } from 'react';
import { KokoroTTS, TextSplitterStream } from 'kokoro-js';
import './App.css'

// Device options
const DEVICE_OPTIONS = [
  { id: 'webgpu', name: 'GPU 🚀', description: 'Faster, but has usage quota' },
  { id: 'wasm', name: 'CPU 💻', description: 'Slower but more reliable' }
];

// Data type options
const DTYPE_OPTIONS = [
  { id: 'fp32', name: 'FP32', description: 'Full precision (slower but higher quality)' },
  { id: 'fp16', name: 'FP16', description: 'Half precision (balanced)' },
  { id: 'q8', name: 'Q8', description: 'Quantized 8-bit (faster, slightly lower quality)' },
  { id: 'q4', name: 'Q4', description: 'Quantized 4-bit (fastest, lowest quality)' },
];

// Default settings
const DEFAULT_SETTINGS = {
  text: '',
  voice: 'af_heart',
  device: 'webgpu',
  speed: 1.0,
  dtype: 'fp32',
  streaming: false
};

function App() {
  // State management
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [voices, setVoices] = useState([]);
  const [voiceCategories, setVoiceCategories] = useState({});
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [streamingAudio, setStreamingAudio] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1);
  const streamingAudioRefs = useRef([]);
  
  // Audio reference
  const audioRef = useRef(null);
  const streamSplitterRef = useRef(null);
  
  // Helper function to update settings
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Load model on initial render
  useEffect(() => {
    loadModel();
  }, []);
  
  // Reset audio when settings change
  useEffect(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [settings.voice, settings.speed]);
  
  // Update character count when text changes
  useEffect(() => {
    setCharacterCount(settings.text.length);
  }, [settings.text]);

  // Function to categorize voices
  const categorizeVoices = (voices) => {
    const categories = {};
    
    // Process voices and organize into categories
    voices.forEach(voice => {
      const voiceId = voice.id;
      
      // Extract language/gender info from voice ID (like af_, am_, bf_, bm_)
      const prefix = voiceId.substring(0, 2);
      
      // Map codes to readable names
      const categoryMap = {
        'af': 'American English - Female',
        'am': 'American English - Male',
        'bf': 'British English - Female',
        'bm': 'British English - Male',
      };
      
      const category = categoryMap[prefix] || 'Other';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(voice);
    });
    
    return categories;
  };

  // Initialize refs array when streamingAudio changes
  useEffect(() => {
    streamingAudioRefs.current = streamingAudio.map(() => createRef());
  }, [streamingAudio]);

  // Set up event listeners for sequential playback
  useEffect(() => {
    // Only run this effect if we have streaming audio
    if (streamingAudio.length === 0) return;
    
    // Remove any existing listeners first
    streamingAudioRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current.onended = null;
      }
    });
    
    // Add new listeners for sequential playback
    streamingAudioRefs.current.forEach((ref, index) => {
      if (ref.current) {
        ref.current.onended = () => {
          // When audio ends, play the next one if available
          if (index < streamingAudio.length - 1) {
            setCurrentPlayingIndex(index + 1);
            streamingAudioRefs.current[index + 1].current?.play().catch(err => {
              console.error("Error auto-playing next chunk:", err);
            });
          } else {
            // End of all audio chunks
            setCurrentPlayingIndex(-1);
          }
        };
      }
    });
  }, [streamingAudio]);

  // Start playback when a new chunk is added
  useEffect(() => {
    // Only run this if we have streaming audio
    if (streamingAudio.length === 0) return;
    
    const lastIndex = streamingAudio.length - 1;
    
    // If this is the first chunk or we're already playing something
    if (streamingAudio.length === 1 || currentPlayingIndex !== -1) {
      // Small delay to ensure the audio element is properly set up
      setTimeout(() => {
        if (streamingAudioRefs.current[lastIndex]?.current) {
          setCurrentPlayingIndex(lastIndex);
          streamingAudioRefs.current[lastIndex].current.play().catch(err => {
            console.error("Error auto-playing new chunk:", err);
          });
        }
      }, 100);
    }
  }, [streamingAudio.length, currentPlayingIndex]);


  // Load the Kokoro TTS model
  const loadModel = async () => {
    try {
      setModelLoading(true);
      setError(null);
      setLoadingProgress(0);
      
      console.log("Loading Kokoro TTS model...");
      const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
        dtype: settings.dtype,
        device: settings.device,
        progress_callback: (progress) => {
          setLoadingProgress(Math.round(progress * 100));
          console.log(`Loading progress: ${Math.round(progress * 100)}%`);
        }
      });
      
      console.log("Model loaded successfully!");
      
      // Log available voices
      console.log("Available voices:", tts.voices);
      
      // Extract available voices
      const voiceList = Object.entries(tts.voices).map(([id, info]) => {

        const name = info.name || id.split('_');
        
        const genderIcon = info.gender == "Female" ? '👩' : '👨';
        
        const traitIcon = info.traits || '';

        const overallGrade = info.overallGrade || 'C';
        
        return {
            id,
            name: name,
            genderIcon: genderIcon,
            traitIcon: traitIcon,
            grade: overallGrade,
        };
      });
      
      setVoices(voiceList);
      setVoiceCategories(categorizeVoices(voiceList));
      setModel(tts);
    } catch (err) {
      console.error("Failed to load model:", err);
      setError(`Failed to load model: ${err.message}`);
    } finally {
      setModelLoading(false);
    }
  };

  // Convert Float32Array audio data to WAV format
  function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (1 is PCM) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return buffer;
  }

  // Generate speech from text
  const generateSpeech = async () => {
    if (!model || !settings.text.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (settings.streaming) {
        // Clear previous streaming audio
        setStreamingAudio([]);
        await startStreamingSpeech();
      } else {
        // Regular generation
        const audio = await model.generate(settings.text, {
          voice: settings.voice,
          speed: settings.speed
        });

        // Log the audio object structure for debugging
        console.log("Audio object:", audio);
        
        // Convert Float32Array to WAV buffer
        const wavBuffer = encodeWAV(audio.audio, audio.sampling_rate);
        
        // Create blob from the WAV buffer
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        setAudioUrl(url);
        
        // Play audio automatically after a short delay to ensure it's loaded
        setTimeout(() => {
          if (audioRef.current) {
            console.log("Attempting to play audio");
            audioRef.current.load();
            audioRef.current.play().catch(err => {
              console.error("Error playing audio:", err);
            });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Speech generation failed:", err);
      setError(`Speech generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Also update the streaming audio processing
  const startStreamingSpeech = async () => {
    if (!model || !settings.text.trim()) return;
    
    try {
      setIsStreaming(true);
      
      // Create a text splitter stream
      const splitter = new TextSplitterStream();
      streamSplitterRef.current = splitter;
      
      // Start the generation stream
      const stream = model.stream(splitter, {
        voice: settings.voice,
        speed: settings.speed
      });
      
      // Process the text into chunks (simulating sentence splits)
      const textChunks = settings.text.match(/[^.!?]+[.!?]+|\s*\S+/g) || [settings.text];
      
      // Start processing stream results
      (async () => {
        try {
          for await (const { text, audio } of stream) {
            // Convert the audio Float32Array to WAV
            const wavBuffer = encodeWAV(audio.audio, audio.sampling_rate);
            
            // Create blob from the WAV buffer
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            
            setStreamingAudio(prev => [...prev, { text, url }]);
          }
        } catch (err) {
          console.error("Stream processing error:", err);
          setError(`Streaming error: ${err.message}`);
        } finally {
          setIsStreaming(false);
        }
      })();
      
      // Feed text chunks to the stream with slight delays to simulate typing
      for (const chunk of textChunks) {
        if (streamSplitterRef.current) {
          streamSplitterRef.current.push(chunk);
          // Small delay between chunks
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          break;
        }
      }
      
      // Close the stream when done
      if (streamSplitterRef.current) {
        streamSplitterRef.current.close();
        streamSplitterRef.current = null;
      }
    } catch (err) {
      console.error("Streaming failed:", err);
      setError(`Streaming failed: ${err.message}`);
      setIsStreaming(false);
    }
  };
  
  // Stop streaming
  const stopStreaming = () => {
    if (streamSplitterRef.current) {
      streamSplitterRef.current.close();
      streamSplitterRef.current = null;
    }
    setIsStreaming(false);
  };
  
  // Combine streaming audio chunks into one downloadable file
  const combineStreamingAudio = async () => {
    if (streamingAudio.length === 0) return null;
    
    try {
      // Fetch all audio blobs
      const audioBlobs = await Promise.all(
        streamingAudio.map(async (item) => {
          const response = await fetch(item.url);
          return response.blob();
        })
      );
      
      // Combine into a single blob
      const combinedBlob = new Blob(audioBlobs, { type: 'audio/wav' });
      return URL.createObjectURL(combinedBlob);
    } catch (err) {
      console.error("Failed to combine audio:", err);
      return null;
    }
  };

  const renderStreamingResults = () => {
    if (!settings.streaming || streamingAudio.length === 0) return null;
    
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-900">Streaming Results</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Stop current playback
                streamingAudioRefs.current.forEach(ref => {
                  if (ref.current) ref.current.pause();
                });
                setCurrentPlayingIndex(-1);
                
                // Start from beginning
                if (streamingAudioRefs.current[0]?.current) {
                  setCurrentPlayingIndex(0);
                  streamingAudioRefs.current[0].current.play().catch(err => {
                    console.error("Error playing from start:", err);
                  });
                }
              }}
              className="px-2 py-1 text-xs bg-blue-600 rounded hover:bg-blue-700"
              disabled={streamingAudio.length === 0}
            >
              Play All
            </button>
            <button
              onClick={async () => {
                const combinedUrl = await combineStreamingAudio();
                if (combinedUrl) {
                  const a = document.createElement('a');
                  a.href = combinedUrl;
                  a.download = 'kokoro-tts-combined.wav';
                  a.click();
                }
              }}
              className="px-2 py-1 text-xs text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50"
              disabled={streamingAudio.length === 0}
            >
              Download All
            </button>
          </div>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto p-2">
          {streamingAudio.map((item, index) => (
            <div 
              key={index} 
              className={`bg-gray-50 rounded-lg p-3 transition-all duration-300 ${
                currentPlayingIndex === index ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <p className="text-sm text-gray-700 mb-2">{item.text}</p>
              <div className="flex items-center">
                <audio 
                  ref={el => streamingAudioRefs.current[index] = el}
                  className="w-full h-8" 
                  src={item.url}
                  controls
                >
                  Your browser does not support the audio element.
                </audio>
                <a
                  href={item.url}
                  download={`chunk-${index}.wav`}
                  className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Kokoro TTS Demo</h1>
            <p className="text-blue-100 mt-1">
              Run text-to-speech with 82M parameter model in your browser
            </p>
          </div>
          
          <div className="p-6">
            {/* Model loading status */}
            {modelLoading && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-700 font-medium mb-2">Loading Kokoro TTS model...</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Progress: {loadingProgress}%</p>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Text Input */}
                <div className="mb-6">
                  <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Input Text
                  </label>
                  <div className="mt-1 relative">
                    <textarea
                      id="text-input"
                      rows={6}
                      className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter text to convert to speech (up to 5000 characters for streaming, 500 for regular generation)"
                      value={settings.text}
                      onChange={(e) => updateSetting('text', e.target.value)}
                      maxLength={settings.streaming ? 5000 : 500}
                      disabled={loading || isStreaming || !model}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {characterCount}/{settings.streaming ? 5000 : 500} characters
                    </div>
                  </div>
                </div>
                
                {/* Generate Button */}
                <div className="mb-6 flex space-x-3">
                  <button
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={generateSpeech}
                    disabled={loading || isStreaming || !model || !settings.text.trim()}
                  >
                    {loading ? "Generating..." : (isStreaming ? "Streaming..." : "Generate Speech")}
                  </button>
                  
                  {isStreaming && (
                    <button
                      className="py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={stopStreaming}
                    >
                      Stop Streaming
                    </button>
                  )}
                </div>
                
                {/* Audio Player (for non-streaming) */}
                {audioUrl && !settings.streaming && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Generated Audio:</p>
                    <audio 
                      ref={audioRef}
                      controls 
                      className="w-full"
                      src={audioUrl}
                      onError={(e) => console.error("Audio element error:", e)}
                      onLoadedData={() => console.log("Audio loaded successfully")}
                    >
                      Your browser does not support the audio element.
                    </audio>
                    <div className="mt-2 flex justify-between">
                      <button
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.load();
                            audioRef.current.play();
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Play Again
                      </button>
                      <a
                        href={audioUrl}
                        download="kokoro-tts-output.wav"
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Download Audio
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Streaming Audio Results */}
                {settings.streaming && streamingAudio.length > 0 && renderStreamingResults()}
              </div>
              
              <div>
                {/* Settings Panel */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
                  
                  {/* Voice Selection */}
                  <div className="mb-4">
                    <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Voice
                    </label>
                    <select
                      id="voice-select"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={settings.voice}
                      onChange={(e) => updateSetting('voice', e.target.value)}
                      disabled={loading || isStreaming || !model}
                    >
                      {Object.entries(voiceCategories).map(([category, categoryVoices]) => (
                        <optgroup key={category} label={category}>
                          {categoryVoices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                              {voice.genderIcon} {voice.name} {voice.traitIcon} {voice.grade ? `(${voice.grade})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  
                  {/* Device Selection */}
                  <div className="mb-4">
                    <label htmlFor="device-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Hardware
                    </label>
                    <select
                      id="device-select"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={settings.device}
                      onChange={(e) => updateSetting('device', e.target.value)}
                      disabled={loading || isStreaming || modelLoading}
                    >
                      {DEVICE_OPTIONS.map((device) => (
                        <option key={device.id} value={device.id}>
                          {device.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.device === 'webgpu' 
                        ? "GPU is usually faster, but has a usage quota" 
                        : "CPU is slower but more reliable"}
                    </p>
                  </div>
                  
                  {/* Data Type Selection */}
                  <div className="mb-4">
                    <label htmlFor="dtype-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Precision
                    </label>
                    <select
                      id="dtype-select"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={settings.dtype}
                      onChange={(e) => updateSetting('dtype', e.target.value)}
                      disabled={loading || isStreaming || modelLoading}
                    >
                      {DTYPE_OPTIONS.map((dtype) => (
                        <option key={dtype.id} value={dtype.id}>
                          {dtype.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Higher precision = better quality, lower = faster
                    </p>
                  </div>
                  
                  {/* Speed Control */}
                  <div className="mb-4">
                    <label htmlFor="speed-slider" className="block text-sm font-medium text-gray-700 mb-1">
                      Speed: {settings.speed.toFixed(1)}x
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">0.5</span>
                      <input
                        id="speed-slider"
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        value={settings.speed}
                        onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
                        disabled={loading || isStreaming || !model}
                      />
                      <span className="text-xs text-gray-500">2.0</span>
                    </div>
                  </div>
                  
                  {/* Streaming Toggle */}
                  <div className="mb-4">
                    <div className="flex items-center">
                      <input
                        id="streaming-toggle"
                        type="checkbox"
                        className="h-4 w-4 accent-indigo-600 focus:ring-2 focus:ring-indigo-500 border border-gray-300 rounded"
                        checked={settings.streaming}
                        onChange={(e) => updateSetting('streaming', e.target.checked)}
                        disabled={loading || isStreaming}
                      />
                      <label htmlFor="streaming-toggle" className="ml-2 block text-sm text-gray-700">
                        Enable Streaming
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Process longer text in chunks (up to 5000 chars)
                    </p>
                  </div>
                  
                  {/* Reset Button */}
                  <button
                    className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      if (window.confirm("Reset all settings to default values?")) {
                        setSettings(DEFAULT_SETTINGS);
                      }
                    }}
                    disabled={loading || isStreaming}
                  >
                    Reset Settings
                  </button>
                  
                  {/* Reload Model Button */}
                  <button
                    className="w-full mt-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      if (window.confirm("Reload model with current settings?")) {
                        loadModel();
                      }
                    }}
                    disabled={loading || isStreaming || modelLoading}
                  >
                    Reload Model
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Kokoro is a frontier TTS model with 82 million parameters. This demo runs 100% locally in your browser using WebGPU or WebAssembly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;