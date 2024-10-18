import React from 'react'

const Login = () => {
  return (
    <div className='h-max w-full flex'>
    <form className='flex flex-col w-96 justify-center align-middle pb-8'>
        <p className='text-5xl text-center'>Login</p>
        <div className='group first-letter:flex flex-col text-slate-500 pb-8'>
            <label className='group-hover:text-white group-focus-within:text-white' htmlFor="email">Email</label>
            <input className='peer text-white w-full bg-transparent border-2 group-hover:border-white invalid:border-red-300' type="email" name='email' /> 
        </div>
        <div className='group first-letter:flex flex-col text-slate-500 pb-8'>
            <label className='group-hover:text-white group-focus-within:text-white' htmlFor="password">Password</label>
            <input className='peer text-white w-full bg-transparent border-2 group-hover:border-white invalid:border-red-300' minLength={8} type="password" name='password' /> 
        </div>
        <button className='border-2 border-slate-300 p-1 my-8 hover:bg-white/10 hover:text-white' type='submit'>Sign In</button>
    </form>
    </div>
  ) 
}

export default Login 