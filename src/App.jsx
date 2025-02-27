import { useState, useEffect, useRef } from 'react';
import Header from './components/header';
import Footer from './components/footer';
import Kokoro from './components/kokoro';
import './App.css'


function App() {

  return (
    <div className="h-fit w-full min-h-screen flex flex-col justify-between">
      <Header/>
      <main>
        <Kokoro/>
      </main>
      <Footer/>
    </div>
  );
}

export default App;