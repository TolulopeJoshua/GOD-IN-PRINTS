import Biography from './biography'
import Footer from '../components/footer'
import Bio from '../components/bio';
import Login from '../components/login'

async function getData() {
  const res = await fetch('http://localhost:8000/api/all/biographies');
  return res.json();
}

const page = async () => {

  const {biographies} = await getData();
   
  return ( 
    <div className='flex flex-col h-max w-full '>
      {/* <Login /> */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-16 px-4 py-16 w-full'>
        <Biography biography={biographies[0]} />
        <Biography biography={biographies[1]} />
        <Biography biography={biographies[2]} />
        <Biography biography={biographies[3]} />
      </div>
      <Footer /> 
    </div>
  )
}

export default page 