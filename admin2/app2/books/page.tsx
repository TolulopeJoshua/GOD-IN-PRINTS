import Footer from '../components/footer'
import Login from '../components/login'
import Book from './book'

async function getData() {
  const res = await fetch('http://localhost:8000/api/all/books');
  return res.json();
}

const page = async () => {

  const {books} = await getData();
  // console.log(books[0])
  
  return (
    <div className='flex flex-col h-max w-full '>
      {/* <Login /> */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-16 px-4 py-16 w-full'>
        <Book book={books[0]} />
        <Book book={books[1]} />
        <Book book={books[2]} />
        <Book book={books[3]} />
      </div>
      <Footer /> 
    </div>
  )
}

export default page 