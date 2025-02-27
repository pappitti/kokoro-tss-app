function Header() {
  return (
    <header className='sticky z-20 p-4 inset-x-0 top-0 border-b-2 border-grey-700 bg-[var(--primary-color)]'>
      <nav className='flex w-full flex-nowrap gap-5 justify-between items-center'>
        <a href="/" className='flex flex-nowrap justify-start items-center'>
          <h1 className='text-2xl text-center font-bold text-[var(--opposite-color)] shrink-0 min-[600px]:text-4xl'>kokoro:ki</h1>
        </a>
        <a href="https://www.pitti.io" target="_blank">
          <svg className='flex h-6 w-18 ' viewBox="0 0 64 30" xmlns="http://www.w3.org/2000/svg"> {/*min-[600px]:h-10 min-[600px]:w-30 */}
            <path d="M8.73315363881402 0.001 L17.2641509433962 9.29919137466307 L24.5013477088949 26.4420485175202 L16.900269541779 29.5148247978437 L0.001 24.6630727762803 Z" fill="var(--opposite-color)"/>
            <path d="M20.5390835579515 8.61185983827493 L45.0808625336927 0.363881401617251 L43.2614555256065 12.6549865229111 L34.0835579514825 29.1509433962264 L27.2911051212938 24.8652291105121 Z" fill="var(--opposite-color)"/>
            <path d="M43.9083557951482 18.3962264150943 L58.2210242587601 6.06469002695418 L63.0727762803235 12.4528301886792 L63.7196765498652 29.99999 L37.9649595687332 29.2722371967655 Z" fill="var(--opposite-color)"/>
          </svg>
        </a>
      </nav>
    </header>
  )
  }

export default Header;