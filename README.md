# Kokoro TTS React Demo

A React application that demonstrates the capabilities of Kokoro.js, a browser-based Text-to-Speech model with 82 million parameters that runs 100% locally.

## Features

- Convert text to speech directly in the browser
- Choose from multiple voices (American & British English)
- Adjust speaking speed
- Stream longer text in chunks
- Run on GPU (WebGPU) or CPU (WebAssembly)
- Adjustable model precision (FP32, FP16, Q8, Q4)
- Download generated audio files

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/pappitti/kokoro-tts-app.git
cd kokoro-tts-app
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## Building for Production

Build the app for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Technology Stack

- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Kokoro.js](https://npmjs.com/package/kokoro-js) - Browser-based Text-to-Speech model
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework

## How It Works

Kokoro is a frontier TTS model for its size of 82 million parameters. This JavaScript library allows the model to be run 100% locally in the browser thanks to 🤗 Transformers.js.

The application loads the model and its weights in your browser once, and then generates audio from text without any server requests, all computation happens locally.

## Browser Compatibility

This application works best in browsers that support WebGPU:
- Chrome 113+
- Edge 113+
- Opera 99+

For browsers without WebGPU support, the application will fall back to WebAssembly, which is slower but still functional.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Kokoro model by [onnx-community](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX)
- Powered by [Transformers.js](https://huggingface.co/docs/transformers.js)