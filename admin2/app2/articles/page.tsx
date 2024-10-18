import React from 'react'
import Footer from '../components/footer'
import Login from '../components/login'
import Article from './article'

async function getData() {
  const res = await fetch('http://localhost:8000/api/all/articles');
  return res.json();
}

const page = async () => {

  const {articles} = await getData();
  
  return (
    <div className='flex flex-col h-max w-full '>
      {/* <Login /> */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-16 px-4 py-16 w-full'>
        <Article article={articles[0]} />
        <Article article={articles[1]} />
        <Article article={articles[2]} />
        <Article article={articles[3]} />
      </div>
      <Footer />
    </div>
  )
}

export default page 