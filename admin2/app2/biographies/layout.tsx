import Sidebar from '../components/sidebar';

const layout = ({ children }: {
    children: React.ReactNode;
  }) => {
  return (
    <div className='w-screen h-full flex'>
        {/* Sidebar */}
        <div className='hidden md:flex w-64 h-full shrink-0'>
          <Sidebar />
        </div>
        <div className='w-full h-full flex justify-center align-middle overflow-y-auto overflow-x-hidden'>
          {children}
        </div>
    </div>
  )
}

export default layout