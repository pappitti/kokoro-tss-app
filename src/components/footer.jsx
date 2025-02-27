function Footer() {
  return (
    <footer className="relative bg-black w-full flex flex-wrap items-center px-5 py-3 justify-center min-[400px]:justify-between">
       <div className='relative min-w-[360px] mt-3 justify-center text-white flex flex-nowrap items-center grow min-[740px]:mt-1 min-[740px]:justify-start'> 
        <a className="text-center px-2 socials github text-white shrink-0 min-[740px]:mt-0" href="https://github.com/pappitti/kokoro-tss-app" rel="noreferrer" target="_blank">
          Code
        </a>
      </div>
      <div className='relative min-w-[360px] mt-3 justify-center text-white flex flex-nowrap items-center grow min-[740px]:mt-1 min-[740px]:justify-end'> 
        <a href="https://twitter.com/PITTI_DATA" rel="noreferrer" target="_blank"
          className="text-center px-2 socials maintwitter text-white mt-3 mr-6 shrink-0 min-[740px]:mt-0"
        >
          Follow us
        </a>
      </div>
    </footer>
  )
};

export default Footer;