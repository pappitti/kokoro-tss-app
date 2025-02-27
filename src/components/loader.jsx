function Loader() {
    return (
        <div className="flex flex-wrap justify-start min-[550px]:flex-nowrap gap-3 mt-10">
              <div className="w-full min-[550px]:w-[250px] min-[550px]:shrink-0">
                <div className="w-full text-start mb-2 text-xs italic">Top 10 results:</div>
                <div className="border-2 border-gray-300 rounded-lg h-[300px] flex items-center justify-center" >
                  Processing input ...
                </div>
              </div>
              <div className="flex min-w-[300px] h-[300px] grow items-center justify-center">
                <svg className='h-[100px] w-[300px]' viewBox="0 0 64 30" xmlns="http://www.w3.org/2000/svg">
                    <path className="animate-[col1_6s_linear_infinite]" d="M8.73315363881402 0.001 L17.2641509433962 9.29919137466307 L24.5013477088949 26.4420485175202 L16.900269541779 29.5148247978437 L0.001 24.6630727762803 Z">
                    </path>
                    <path className="animate-[col2_6s_linear_infinite]" d="M20.5390835579515 8.61185983827493 L45.0808625336927 0.363881401617251 L43.2614555256065 12.6549865229111 L34.0835579514825 29.1509433962264 L27.2911051212938 24.8652291105121 Z">
                    </path>
                    <path className="animate-[col3_6s_linear_infinite]" d="M43.9083557951482 18.3962264150943 L58.2210242587601 6.06469002695418 L63.0727762803235 12.4528301886792 L63.7196765498652 29.99999 L37.9649595687332 29.2722371967655 Z">
                    </path>
                </svg> 
              </div>
          </div>
    )
  }

export default Loader;