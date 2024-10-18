import React from 'react'
import Input from './UI/Input'

function Sidebar() {
  return (
    <div  className='scrollbar h-full overflow-y-scroll w-full py-16 px-4'>
      <button className='w-full px-4 py-2 font-semibold text-left transition hover:bg-white/10 rounded-full'>All Bios</button>
      <form action="">
        <Input label='Title' />
        <Input label='Author' />
        <Input label='Id' />
        <button className='w-full px-4 py-2 font-semibold transition hover:bg-white/10 rounded-full'>Search</button>
      </form>
    </div>
  )
}

export default Sidebar