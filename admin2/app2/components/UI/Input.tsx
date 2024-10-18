'use client'

import { ChangeEvent, useState } from "react";

const Input = ({ label }: { label: string }) => {

    const [hasValue, setHasValue] = useState(false);

    const handlechange = (e: ChangeEvent<HTMLInputElement>) => {
        setHasValue(e.target.value != '')
    }

  return (
    <div className='group px-4 py-4 relative'>
        <input className='peer bg-transparent w-full border-0 border-b-2 hover:border p-2 pt-8' name={label.toLowerCase()} type="text" onChange={(e) => handlechange(e)} />
        <label className={'text-slate-500 text-sm absolute transition-all left-6 bottom-6 peer-hover:top-6 peer-focus:top-6' + (hasValue ? ' top-6' : '')} htmlFor={label.toLowerCase()}>{label}</label>
    </div>
  )
} 

export default Input    