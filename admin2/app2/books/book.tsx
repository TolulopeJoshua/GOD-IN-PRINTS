import { AiOutlineSave, AiOutlineDelete, AiOutlineUpload, AiOutlineDownload } from 'react-icons/ai'
import { book } from '../types'

const Book = ({ book }: book) => {

    const size = book.document.size >= 1000000 ? Math.round(book.document.size / 10000) / 100 + ' MB' : Math.round(book.document.size / 1000) + ' KB';
     
  return (
    <div className='bg-white/5 w-[700px] border-y-4 border-slate-700 max-w-full rounded-md flex relative'>
        <form className='w-6/12 px-1 pt-2 h-full flex flex-col gap-2'>
            <label className='text-xs text-slate-500 m-0 p-1' htmlFor="name">Title</label>
            <textarea className='bg-transparent border-b-2 border-0 w-full px-1 text-xs scrollbar' value={book.title} name="title" id="" rows={2}></textarea>
            <label className='text-xs text-slate-500 m-0 p-1' htmlFor="gender">Author</label>
            <textarea className='bg-transparent border-b-2 border-0 w-full px-1 text-xs scrollbar' value={book.author} name="author" id="" rows={1}></textarea>
            <div className='grid grid-cols-2 gap-2'>
                <div>
                    <label className='text-xs text-slate-500 m-0 p-1' htmlFor="gender">File Type</label>
                    <textarea disabled className='bg-transparent border-b-2 border-0 w-full px-1 text-xs scrollbar' value={book.filetype} id="" rows={1}></textarea>
                </div> 
                <div> 
                    <label className='text-xs text-slate-500 m-0 p-1' htmlFor="gender">Size</label>
                    <textarea disabled className='bg-transparent border-b-2 border-0 w-full px-1 text-xs scrollbar' value={size} id="" rows={1}></textarea>
                </div>
            </div>
            <div className='flex mt-auto pt-2'>
                <button type='button' className='text-xs p-2 mr-auto'>APPROVE</button>
                <button type='button' className='p-2'><AiOutlineDownload /></button>
                <button className='p-2'><AiOutlineSave /></button>
                <button type='button' className='p-2'><AiOutlineDelete /></button>
            </div>
        </form>
        <div className='w-6/12 px-1 h-full overflow-y-auto right-0 top-0 scrollbar text-sm text-justify'>
            <img className='m-0 p-0' src={`https://godinprintsdocuments.s3.amazonaws.com/${book.image.key}`} alt="book_img" />
        </div>
        <button type='button' className='absolute bottom-0 right-1 p-1 bg-slate-500 hover:bg-slate-400 hover:text-white'><AiOutlineUpload /></button>
    </div>
  ) 
}
 
export default Book